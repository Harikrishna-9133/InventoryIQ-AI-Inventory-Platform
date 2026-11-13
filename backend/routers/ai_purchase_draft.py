from fastapi import APIRouter, HTTPException
from database import SessionLocal
from models import Product, Inventory, Supplier
from ai.forecast import forecast_demand

router = APIRouter(
    prefix="/ai",
    tags=["AI Purchase Order"]
)


@router.get("/purchase-draft/{product_id}")
def purchase_draft(product_id: int):

    db = SessionLocal()

    try:
        # -----------------------------------------
        # Find product
        # -----------------------------------------

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

        # -----------------------------------------
        # Find inventory
        # -----------------------------------------

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

        # -----------------------------------------
        # Find supplier
        # -----------------------------------------

        supplier_id = getattr(
            product,
            "supplier_id",
            None
        )

        supplier = None

        if supplier_id:
            supplier = (
                db.query(Supplier)
                .filter(
                    Supplier.id == supplier_id
                )
                .first()
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
        # Inventory
        # -----------------------------------------

        current_quantity = inventory.quantity

        reserved_quantity = (
            inventory.reserved_quantity or 0
        )

        available_quantity = (
            current_quantity - reserved_quantity
        )

        reorder_level = (
            product.reorder_level or 0
        )

        safety_stock = (
            product.safety_stock or 0
        )

        # -----------------------------------------
        # Calculate required quantity
        # -----------------------------------------

        required_stock = (
            total_forecast + safety_stock
        )

        recommended_quantity = max(
            0,
            round(
                required_stock - available_quantity
            )
        )

        # -----------------------------------------
        # Supplier lead time
        # -----------------------------------------

        lead_time_days = (
            supplier.lead_time_days
            if supplier
            else None
        )

        # -----------------------------------------
        # PO status
        # -----------------------------------------

        if recommended_quantity > 0:
            draft_status = "DRAFT_RECOMMENDED"
        else:
            draft_status = "NO_ORDER_REQUIRED"

        # -----------------------------------------
        # Return draft
        # -----------------------------------------

        return {
            "status": "success",

            "purchase_order": {
                "status": draft_status,

                "supplier": {
                    "supplier_id": (
                        supplier.id
                        if supplier
                        else None
                    ),

                    "supplier_name": (
                        supplier.name
                        if supplier
                        else None
                    ),

                    "lead_time_days":
                        lead_time_days
                },

                "product": {
                    "product_id": product.id,

                    "product_name":
                        product.name,

                    "quantity":
                        recommended_quantity
                },

                "ai_analysis": {
                    "forecast_days": 7,

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
                        ),

                    "current_quantity":
                        current_quantity,

                    "reserved_quantity":
                        reserved_quantity,

                    "available_quantity":
                        available_quantity,

                    "safety_stock":
                        safety_stock,

                    "required_stock":
                        round(
                            float(required_stock),
                            2
                        )
                },

                "recommendation": (
                    "Create purchase order"
                    if recommended_quantity > 0
                    else
                    "No purchase order required"
                )
            }
        }

    finally:
        db.close()