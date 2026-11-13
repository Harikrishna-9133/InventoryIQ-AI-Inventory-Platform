from fastapi import APIRouter
from database import SessionLocal
from models import Product, Inventory, Supplier
from ai.forecast import forecast_demand
from email_service import send_email_to_admin_and_supplier

router = APIRouter(
    prefix="/ai",
    tags=["AI Alerts"]
)



@router.get("/reorder-alerts")
def reorder_alerts():

    db = SessionLocal()

    try:
        products = db.query(Product).all()

        alerts = []

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

            current_quantity = inventory.quantity

            reserved_quantity = (
                inventory.reserved_quantity or 0
            )

            available_quantity = (
                current_quantity - reserved_quantity
            )

            # AI forecast
            predictions = forecast_demand(7)

            total_forecast = sum(predictions)

            safety_stock = product.safety_stock

            reorder_level = product.reorder_level

            required_stock = (
                total_forecast + safety_stock
            )

            recommended_order_quantity = max(
                0,
                required_stock - available_quantity
            )

            # Determine alert
            if available_quantity <= safety_stock:

                status = "CRITICAL"

                priority = "HIGH"

                message = (
                    "Inventory is critically low. "
                    "Immediate purchase order recommended."
                )

            elif available_quantity <= reorder_level:

                status = "LOW STOCK"

                priority = "HIGH"

                message = (
                    "Inventory is below reorder level."
                )

            elif available_quantity < required_stock:

                status = "AT RISK"

                priority = "MEDIUM"

                message = (
                    "Forecasted demand may exceed "
                    "available inventory."
                )

            else:
                continue

            # Send Email Alert if Critical or Low Stock
            if status in ["CRITICAL", "LOW STOCK"]:
                supplier_email = None
                if product.supplier_id:
                    supplier = db.query(Supplier).filter(Supplier.id == product.supplier_id).first()
                    if supplier:
                        supplier_email = supplier.email

                subject = f"[{status}] Inventory Alert: {product.name}"
                body = (
                    f"Product: {product.name} (ID: {product.id})\n"
                    f"Status: {status}\n\n"
                    f"{message}\n\n"
                    f"Available Quantity: {available_quantity}\n"
                    f"Reorder Level: {reorder_level}\n"
                    f"Safety Stock: {safety_stock}\n"
                    f"Forecasted 7-Day Demand: {round(float(total_forecast), 2)}\n"
                    f"Recommended Order Quantity: {round(float(recommended_order_quantity), 2)}\n"
                )
                send_email_to_admin_and_supplier(
                    subject=subject,
                    message_body=body,
                    supplier_email=supplier_email,
                    db=db,
                    notification_type="ALERT"
                )

            alerts.append({

                "product_id": product.id,

                "product_name": product.name,

                "status": status,

                "priority": priority,

                "available_quantity": available_quantity,

                "reorder_level": reorder_level,

                "safety_stock": safety_stock,

                "forecast_7_day_demand": round(
                    float(total_forecast),
                    2
                ),

                "recommended_order_quantity": round(
                    float(recommended_order_quantity),
                    2
                ),

                "message": message
            })

        return {
            "alert_count": len(alerts),
            "alerts": alerts
        }

    finally:
        db.close()


@router.post("/send-test-email")
def send_test_email(supplier_email: str = None):
    """
    Test endpoint to send a test alert directly to both Admin and Supplier.
    """
    db = SessionLocal()
    try:
        subject = "[TEST ALERT] InventoryIQ Direct Email System Test"
        body = (
            "This is a test notification from the InventoryIQ AI Platform.\n\n"
            "If you received this message:\n"
            "- Direct Admin email delivery is working properly.\n"
            "- Direct Supplier email delivery is working properly (if supplier email was specified).\n\n"
            "System Status: ONLINE & ACTIVE"
        )
        result = send_email_to_admin_and_supplier(
            subject=subject,
            message_body=body,
            supplier_email=supplier_email,
            db=db,
            notification_type="TEST"
        )
        return {
            "status": "TEST_EMAIL_SENT",
            "details": result
        }
    finally:
        db.close()