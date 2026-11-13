from fastapi import APIRouter
from database import SessionLocal
from models import Sale, SaleItem, Product, Inventory

router = APIRouter(
    prefix="/analytics",
    tags=["Advanced Analytics"]
)


@router.get("/overview")
def analytics_overview():

    db = SessionLocal()

    try:
        # -----------------------------------------
        # Total products
        # -----------------------------------------

        total_products = db.query(Product).count()

        # -----------------------------------------
        # Inventory totals
        # -----------------------------------------

        inventory_records = db.query(Inventory).all()

        total_inventory = sum(
            item.quantity or 0
            for item in inventory_records
        )

        total_available = sum(
            item.available_quantity or 0
            for item in inventory_records
        )

        total_reserved = sum(
            item.reserved_quantity or 0
            for item in inventory_records
        )

        # -----------------------------------------
        # Sales totals
        # -----------------------------------------

        sales = db.query(Sale).all()

        total_sales = len(sales)

        total_revenue = sum(
            float(sale.total_amount or 0)
            for sale in sales
        )

        # -----------------------------------------
        # Units sold
        # -----------------------------------------

        sale_items = db.query(SaleItem).all()

        total_units_sold = sum(
            item.quantity or 0
            for item in sale_items
        )

        # -----------------------------------------
        # Average sale value
        # -----------------------------------------

        average_sale_value = (
            total_revenue / total_sales
            if total_sales > 0
            else 0
        )

        # -----------------------------------------
        # Low-stock products
        # -----------------------------------------

        low_stock = []

        for product in db.query(Product).all():

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

                low_stock.append({
                    "product_id": product.id,
                    "product_name": product.name,
                    "available_quantity": available,
                    "reorder_level": reorder_level,
                    "status": "LOW STOCK"
                })

        # -----------------------------------------
        # Product sales ranking
        # -----------------------------------------

        product_sales = {}

        for item in sale_items:

            product_id = item.product_id

            product_sales[product_id] = (
                product_sales.get(product_id, 0)
                + (item.quantity or 0)
            )

        top_products = []

        for product_id, units in product_sales.items():

            product = (
                db.query(Product)
                .filter(Product.id == product_id)
                .first()
            )

            if product:

                top_products.append({
                    "product_id": product.id,
                    "product_name": product.name,
                    "units_sold": units
                })

        top_products.sort(
            key=lambda x: x["units_sold"],
            reverse=True
        )

        # -----------------------------------------
        # Return analytics
        # -----------------------------------------

        return {

            "summary": {

                "total_products":
                    total_products,

                "total_sales":
                    total_sales,

                "total_units_sold":
                    total_units_sold,

                "total_revenue":
                    round(total_revenue, 2),

                "average_sale_value":
                    round(
                        average_sale_value,
                        2
                    ),

                "total_inventory":
                    total_inventory,

                "total_available_inventory":
                    total_available,

                "total_reserved_inventory":
                    total_reserved
            },

            "inventory_alerts": {

                "low_stock_count":
                    len(low_stock),

                "low_stock_products":
                    low_stock
            },

            "top_products":
                top_products[:10]
        }

    finally:
        db.close()