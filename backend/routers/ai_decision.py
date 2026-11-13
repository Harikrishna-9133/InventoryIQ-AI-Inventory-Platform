
import math

from fastapi import APIRouter, HTTPException

from database import SessionLocal
from models import Product, Inventory
from ai.forecast import forecast_demand


router = APIRouter(
    prefix="/ai",
    tags=["AI Inventory Decisions"]
)


# ---------------------------------------------------------
# GET AI inventory decision for one product
# URL: GET /ai/inventory-decision/{product_id}
# ---------------------------------------------------------

@router.get("/inventory-decision/{product_id}")
def inventory_decision(product_id: int):
    db = SessionLocal()

    try:
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

        inventory_records = (
            db.query(Inventory)
            .filter(Inventory.product_id == product_id)
            .all()
        )

        if not inventory_records:
            raise HTTPException(
                status_code=404,
                detail="Inventory record not found for this product"
            )

        predictions = forecast_demand(7)
        total_forecast = sum(float(value) for value in predictions)

        average_daily_demand = (
            total_forecast / len(predictions)
            if predictions else 0
        )

        # Combine inventory across all warehouses.
        current_stock = sum(
            int(item.quantity or 0)
            for item in inventory_records
        )

        reserved_quantity = sum(
            int(item.reserved_quantity or 0)
            for item in inventory_records
        )

        available_stock = max(
            0,
            current_stock - reserved_quantity
        )

        reorder_level = int(product.reorder_level or 0)
        safety_stock = int(product.safety_stock or 0)

        required_stock = total_forecast + safety_stock

        recommended_order_quantity = max(
            0,
            math.ceil(required_stock - available_stock)
        )

        if available_stock <= safety_stock:
            status = "CRITICAL"
            recommendation = "Immediate reorder required"

        elif available_stock <= reorder_level:
            status = "LOW STOCK"
            recommendation = "Reorder recommended"

        elif available_stock < required_stock:
            status = "AT RISK"
            recommendation = (
                "Stock may become insufficient based on AI forecast"
            )

        else:
            status = "HEALTHY"
            recommendation = "No reorder required"

        return {
            "product_id": product.id,
            "product_name": product.name,
            "current_quantity": current_stock,
            "reserved_quantity": reserved_quantity,
            "available_quantity": available_stock,
            "reorder_level": reorder_level,
            "safety_stock": safety_stock,
            "forecast_days": len(predictions),
            "forecast_demand": [
                round(float(value), 2)
                for value in predictions
            ],
            "total_forecast_demand": round(total_forecast, 2),
            "average_daily_demand": round(
                average_daily_demand, 2
            ),
            "required_stock": round(required_stock, 2),
            "recommended_order_quantity": recommended_order_quantity,
            "status": status,
            "recommendation": recommendation
        }

    finally:
        db.close()


# ---------------------------------------------------------
# GET AI reorder decisions for all products
# URL: GET /ai/decisions
# Used by the React Recommendations page
# ---------------------------------------------------------

@router.get("/decisions")
def get_all_inventory_decisions():
    db = SessionLocal()

    try:
        products = (
            db.query(Product)
            .order_by(Product.id)
            .all()
        )

        # Preserve the forecasting function already used
        # by this project.
        predictions = forecast_demand(7)
        total_forecast = sum(
            float(value) for value in predictions
        )

        decisions = []

        for product in products:
            inventory_records = (
                db.query(Inventory)
                .filter(Inventory.product_id == product.id)
                .all()
            )

            current_stock = sum(
                int(item.quantity or 0)
                for item in inventory_records
            )

            reserved_stock = sum(
                int(item.reserved_quantity or 0)
                for item in inventory_records
            )

            available_stock = max(
                0,
                current_stock - reserved_stock
            )

            reorder_level = int(product.reorder_level or 0)
            safety_stock = int(product.safety_stock or 0)

            required_stock = total_forecast + safety_stock

            recommended_quantity = max(
                0,
                math.ceil(required_stock - available_stock)
            )

            should_buy = (
                available_stock <= reorder_level
                or available_stock < required_stock
            )

            if should_buy:
                decision = "BUY"

                if (
                    available_stock <= safety_stock
                    or current_stock == 0
                ):
                    priority = "CRITICAL"
                    reason = (
                        "Available stock is at or below safety stock."
                    )

                elif available_stock <= reorder_level:
                    priority = "HIGH"
                    reason = (
                        "Available stock has reached the reorder level."
                    )

                else:
                    priority = "MEDIUM"
                    reason = (
                        "Forecast demand may exceed available stock."
                    )

            else:
                decision = "HOLD"
                priority = "LOW"
                reason = (
                    "Available stock is sufficient for forecast demand."
                )

            decisions.append({
                "product_id": product.id,
                "product_name": product.name,
                "decision": decision,
                "reason": reason,
                "current_stock": current_stock,
                "forecast_demand": round(total_forecast, 2),
                "reorder_level": reorder_level,
                "recommended_quantity": recommended_quantity,
                "priority": priority
            })

        return decisions

    finally:
        db.close()
