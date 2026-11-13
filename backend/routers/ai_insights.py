from fastapi import APIRouter
from database import SessionLocal
from models import Product, Inventory, Sale, SaleItem
from ai.forecast import forecast_demand

router = APIRouter(
    prefix="/ai",
    tags=["AI Insights"]
)


@router.get("/business-insights")
def business_insights():

    db = SessionLocal()

    try:
        products = db.query(Product).all()
        inventories = db.query(Inventory).all()
        sales = db.query(Sale).all()
        sale_items = db.query(SaleItem).all()

        # -----------------------------------------
        # Basic business metrics
        # -----------------------------------------

        total_products = len(products)

        total_sales = len(sales)

        total_revenue = sum(
            float(s.total_amount or 0)
            for s in sales
        )

        total_units_sold = sum(
            item.quantity or 0
            for item in sale_items
        )

        # -----------------------------------------
        # Inventory metrics
        # -----------------------------------------

        total_inventory = sum(
            item.quantity or 0
            for item in inventories
        )

        total_available = sum(
            item.available_quantity
            if item.available_quantity is not None
            else (
                item.quantity
                - (item.reserved_quantity or 0)
            )
            for item in inventories
        )

        total_reserved = sum(
            item.reserved_quantity or 0
            for item in inventories
        )

        # -----------------------------------------
        # Low stock analysis
        # -----------------------------------------

        low_stock_products = []

        for product in products:

            inventory = (
                db.query(Inventory)
                .filter(
                    Inventory.product_id == product.id
                )
                .first()
            )

            if not inventory:
                continue

            available = (
                inventory.available_quantity
                if inventory.available_quantity is not None
                else (
                    inventory.quantity
                    - (inventory.reserved_quantity or 0)
                )
            )

            reorder_level = (
                product.reorder_level or 0
            )

            if available <= reorder_level:

                low_stock_products.append({
                    "product_id": product.id,
                    "product_name": product.name,
                    "available_quantity": available,
                    "reorder_level": reorder_level
                })

        # -----------------------------------------
        # Top selling product
        # -----------------------------------------

        product_sales = {}

        for item in sale_items:

            product_sales[item.product_id] = (
                product_sales.get(item.product_id, 0)
                + (item.quantity or 0)
            )

        top_product = None

        if product_sales:

            top_product_id = max(
                product_sales,
                key=product_sales.get
            )

            product = (
                db.query(Product)
                .filter(
                    Product.id == top_product_id
                )
                .first()
            )

            if product:

                top_product = {
                    "product_id": product.id,
                    "product_name": product.name,
                    "units_sold":
                        product_sales[top_product_id]
                }

        # -----------------------------------------
        # AI forecast
        # -----------------------------------------

        forecast = forecast_demand(7)

        total_forecast = sum(forecast)

        average_daily_demand = (
            total_forecast / len(forecast)
        )

        # -----------------------------------------
        # Overall inventory health
        # -----------------------------------------

        if total_available == 0:

            inventory_health = "CRITICAL"

        elif len(low_stock_products) > 0:

            inventory_health = "WARNING"

        else:

            inventory_health = "HEALTHY"

        # -----------------------------------------
        # Generate business insights
        # -----------------------------------------

        insights = []

        if inventory_health == "HEALTHY":

            insights.append(
                "Overall inventory health is healthy. "
                "No products are currently below "
                "their reorder level."
            )

        elif inventory_health == "WARNING":

            insights.append(
                f"{len(low_stock_products)} product(s) "
                "are currently at or below the "
                "reorder level."
            )

        else:

            insights.append(
                "Inventory is critically low and "
                "requires immediate attention."
            )

        if top_product:

            insights.append(
                f"{top_product['product_name']} is currently "
                f"the top-selling product with "
                f"{top_product['units_sold']} units sold."
            )

        if total_forecast > 0:

            insights.append(
                f"AI forecasts approximately "
                f"{total_forecast:.2f} units of demand "
                f"over the next 7 days."
            )

        if total_available >= total_forecast:

            insights.append(
                "Current available inventory is "
                "sufficient to cover the AI forecast "
                "for the next 7 days."
            )

        else:

            shortage = (
                total_forecast - total_available
            )

            insights.append(
                f"AI forecasts a potential inventory "
                f"shortage of approximately "
                f"{shortage:.2f} units."
            )

        # -----------------------------------------
        # Return response
        # -----------------------------------------

        return {

            "status": "success",

            "business_summary": {

                "total_products":
                    total_products,

                "total_sales":
                    total_sales,

                "total_units_sold":
                    total_units_sold,

                "total_revenue":
                    round(
                        total_revenue,
                        2
                    ),

                "total_inventory":
                    total_inventory,

                "total_available_inventory":
                    total_available,

                "total_reserved_inventory":
                    total_reserved
            },

            "inventory_health": {

                "status":
                    inventory_health,

                "low_stock_count":
                    len(low_stock_products),

                "low_stock_products":
                    low_stock_products
            },

            "sales_performance": {

                "top_product":
                    top_product
            },

            "ai_forecast": {

                "forecast_days": 7,

                "forecast_demand":
                    [
                        round(float(x), 2)
                        for x in forecast
                    ],

                "total_forecast_demand":
                    round(
                        float(total_forecast),
                        2
                    ),

                "average_daily_demand":
                    round(
                        float(
                            average_daily_demand
                        ),
                        2
                    )
            },

            "insights":
                insights
        }

    finally:

        db.close()