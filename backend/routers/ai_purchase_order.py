from fastapi import APIRouter, HTTPException
from database import SessionLocal
from models import Product, Inventory, Supplier
from ai.forecast import forecast_demand

router = APIRouter(
    prefix="/ai",
    tags=["AI Purchase Orders"]
)


@router.get("/purchase-recommendation/{product_id}")
def purchase_recommendation(product_id: int):

    db = SessionLocal()

    try:
        # Find product
        product = (
            db.query(Product)
            .filter(Product.id == product_id)
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        # Find inventory
        inventory = (
            db.query(Inventory)
            .filter(
                Inventory.product_id == product_id
            )
            .first()
        )

        if not inventory:
            raise HTTPException(
                status_code=404,
                detail="Inventory record not found"
            )

        # Find supplier
        supplier = (
            db.query(Supplier)
            .filter(
                Supplier.id == product.supplier_id
            )
            .first()
        )

        # AI forecast
        predictions = forecast_demand(7)

        total_forecast = sum(predictions)

        safety_stock = product.safety_stock or 0

        reorder_level = product.reorder_level or 0

        current_quantity = inventory.quantity

        reserved_quantity = (
            inventory.reserved_quantity or 0
        )

        available_quantity = (
            current_quantity - reserved_quantity
        )

        # Required stock
        required_stock = (
            total_forecast + safety_stock
        )

        recommended_quantity = max(
            0,
            round(
                required_stock - available_quantity
            )
        )

        # Decision
        if recommended_quantity <= 0:

            status = "NO_ORDER_REQUIRED"

            recommendation = (
                "Current inventory is sufficient "
                "for forecasted demand."
            )

        elif available_quantity <= safety_stock:

            status = "URGENT_ORDER"

            recommendation = (
                "Immediate purchase order recommended."
            )

        elif available_quantity <= reorder_level:

            status = "REORDER"

            recommendation = (
                "Inventory is below reorder level."
            )

        else:

            status = "PLANNED_ORDER"

            recommendation = (
                "Inventory may become insufficient "
                "according to AI forecast."
            )

        return {
            "product_id": product.id,
            "product_name": product.name,

            "supplier": {
                "supplier_id": (
                    supplier.id if supplier else None
                ),
                "supplier_name": (
                    supplier.name if supplier else None
                )
            },

            "inventory": {
                "current_quantity": current_quantity,
                "reserved_quantity": reserved_quantity,
                "available_quantity": available_quantity,
                "reorder_level": reorder_level,
                "safety_stock": safety_stock
            },

            "ai_forecast": {
                "forecast_days": 7,
                "total_forecast_demand": round(
                    float(total_forecast),
                    2
                ),
                "average_daily_demand": round(
                    float(total_forecast / 7),
                    2
                )
            },

            "purchase_recommendation": {
                "required_stock": round(
                    float(required_stock),
                    2
                ),
                "recommended_quantity": (
                    recommended_quantity
                ),
                "status": status,
                "recommendation": recommendation
            }
        }

    finally:
        db.close()