from fastapi import APIRouter
from database import SessionLocal
from models import Product, Inventory
from ai.forecast import forecast_demand

router = APIRouter(
    prefix="/ai",
    tags=["AI Dashboard"]
)


@router.get("/dashboard")
def ai_dashboard():

    db = SessionLocal()

    try:
        products = db.query(Product).all()

        dashboard = []

        for product in products:

            # -----------------------------------------
            # Get inventory
            # -----------------------------------------

            inventory = (
                db.query(Inventory)
                .filter(
                    Inventory.product_id == product.id
                )
                .first()
            )

            if not inventory:
                continue

            # -----------------------------------------
            # Current inventory
            # -----------------------------------------

            current_quantity = inventory.quantity

            reserved_quantity = (
                inventory.reserved_quantity or 0
            )

            available_quantity = (
                current_quantity - reserved_quantity
            )

            # -----------------------------------------
            # AI forecast
            # -----------------------------------------

            predictions = forecast_demand(7)

            total_forecast = sum(predictions)

            average_daily_demand = (
                total_forecast / len(predictions)
            )

            # -----------------------------------------
            # Inventory requirements
            # -----------------------------------------

            reorder_level = product.reorder_level

            safety_stock = product.safety_stock

            required_stock = (
                total_forecast + safety_stock
            )

            recommended_order_quantity = max(
                0,
                required_stock - available_quantity
            )

            # -----------------------------------------
            # AI decision
            # -----------------------------------------

            if available_quantity <= safety_stock:

                status = "CRITICAL"

                recommendation = (
                    "Immediate reorder required"
                )

            elif available_quantity <= reorder_level:

                status = "LOW STOCK"

                recommendation = (
                    "Reorder recommended"
                )

            elif available_quantity < required_stock:

                status = "AT RISK"

                recommendation = (
                    "Stock may become insufficient "
                    "based on AI forecast"
                )

            else:

                status = "HEALTHY"

                recommendation = (
                    "No reorder required"
                )

            # -----------------------------------------
            # Dashboard item
            # -----------------------------------------

            dashboard.append({

                "product_id": product.id,

                "product_name": product.name,

                "current_quantity": current_quantity,

                "reserved_quantity": reserved_quantity,

                "available_quantity": available_quantity,

                "reorder_level": reorder_level,

                "safety_stock": safety_stock,

                "forecast_days": 7,

                "total_forecast_demand": round(
                    float(total_forecast),
                    2
                ),

                "average_daily_demand": round(
                    float(average_daily_demand),
                    2
                ),

                "required_stock": round(
                    float(required_stock),
                    2
                ),

                "recommended_order_quantity": round(
                    float(recommended_order_quantity),
                    2
                ),

                "status": status,

                "recommendation": recommendation
            })

        # -----------------------------------------
        # Summary statistics
        # -----------------------------------------

        total_products = len(dashboard)

        healthy_products = sum(
            1
            for item in dashboard
            if item["status"] == "HEALTHY"
        )

        at_risk_products = sum(
            1
            for item in dashboard
            if item["status"] == "AT RISK"
        )

        low_stock_products = sum(
            1
            for item in dashboard
            if item["status"] == "LOW STOCK"
        )

        critical_products = sum(
            1
            for item in dashboard
            if item["status"] == "CRITICAL"
        )

        total_recommended_order = sum(
            item["recommended_order_quantity"]
            for item in dashboard
        )

        return {

            "summary": {

                "total_products": total_products,

                "healthy_products": healthy_products,

                "at_risk_products": at_risk_products,

                "low_stock_products": low_stock_products,

                "critical_products": critical_products,

                "total_recommended_order_quantity":
                    round(
                        total_recommended_order,
                        2
                    )
            },

            "products": dashboard
        }

    finally:
        db.close()