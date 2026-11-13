from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta

from database import SessionLocal
from models import (
    Product,
    Inventory,
    Supplier,
    PurchaseOrder,
    PurchaseOrderItem
)

from ai.forecast import forecast_demand
from email_service import send_email_to_admin_and_supplier



router = APIRouter(
    prefix="/ai",
    tags=["AI Purchase Order"]
)


@router.post("/create-purchase-order/{product_id}")
def create_ai_purchase_order(product_id: int):

    db = SessionLocal()

    try:

        # -----------------------------------------
        # 1. Find product
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
        # 2. Find inventory
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
        # 3. Find supplier
        # -----------------------------------------

        if not product.supplier_id:
            raise HTTPException(
                status_code=400,
                detail="Product is not linked to a supplier"
            )

        supplier = (
            db.query(Supplier)
            .filter(
                Supplier.id == product.supplier_id
            )
            .first()
        )

        if not supplier:
            raise HTTPException(
                status_code=404,
                detail="Supplier not found"
            )

        # -----------------------------------------
        # 4. AI forecast
        # -----------------------------------------

        predictions = forecast_demand(7)

        total_forecast = sum(predictions)

        average_daily_demand = (
            total_forecast / len(predictions)
        )

        # -----------------------------------------
        # 5. Inventory calculation
        # -----------------------------------------

        current_quantity = inventory.quantity

        reserved_quantity = (
            inventory.reserved_quantity or 0
        )

        available_quantity = (
            current_quantity - reserved_quantity
        )

        safety_stock = (
            product.safety_stock or 0
        )

        required_stock = (
            total_forecast + safety_stock
        )

        # -----------------------------------------
        # 6. AI recommended quantity
        # -----------------------------------------

        recommended_quantity = max(
            0,
            round(
                required_stock - available_quantity
            )
        )

        # -----------------------------------------
        # 7. No purchase required
        # -----------------------------------------

        if recommended_quantity <= 0:

            return {
                "status": "NO_ORDER_REQUIRED",

                "message": (
                    "AI determined that current "
                    "inventory is sufficient."
                ),

                "product_id": product.id,

                "product_name": product.name,

                "supplier_id": supplier.id,

                "supplier_name": supplier.name,

                "available_quantity": available_quantity,

                "forecast_demand": round(
                    float(total_forecast),
                    2
                ),

                "required_stock": round(
                    float(required_stock),
                    2
                ),

                "recommended_quantity": 0
            }

        # -----------------------------------------
        # 8. Find existing active purchase orders
        # -----------------------------------------

        active_po_items = (
            db.query(PurchaseOrderItem)
            .join(
                PurchaseOrder,
                PurchaseOrder.id
                == PurchaseOrderItem.purchase_order_id
            )
            .filter(
                PurchaseOrderItem.product_id == product_id,
                PurchaseOrder.supplier_id == supplier.id,
                PurchaseOrder.status.in_([
                    "DRAFT",
                    "draft",
                    "PENDING",
                    "pending"
                ])
            )
            .all()
        )

        # -----------------------------------------
        # 9. Calculate outstanding quantity
        # -----------------------------------------

        outstanding_quantity = sum(
            item.quantity or 0
            for item in active_po_items
        )

        # -----------------------------------------
        # 10. Calculate additional quantity
        # -----------------------------------------

        additional_quantity = max(
            0,
            recommended_quantity - outstanding_quantity
        )

        # -----------------------------------------
        # 11. Existing POs cover requirement
        # -----------------------------------------

        if additional_quantity <= 0:

            return {
                "status": "EXISTING_PURCHASE_ORDER",

                "message": (
                    "Existing pending purchase orders "
                    "already cover the AI recommended "
                    "quantity."
                ),

                "product": {
                    "product_id": product.id,
                    "product_name": product.name
                },

                "supplier": {
                    "supplier_id": supplier.id,
                    "supplier_name": supplier.name
                },

                "inventory": {
                    "available_quantity":
                        available_quantity,

                    "required_stock":
                        round(
                            float(required_stock),
                            2
                        )
                },

                "ai_analysis": {

                    "forecast_days": 7,

                    "forecast_demand":
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

                    "recommended_quantity":
                        recommended_quantity,

                    "outstanding_po_quantity":
                        outstanding_quantity,

                    "additional_quantity_required":
                        0
                },

                "purchase_orders": [
                    {
                        "purchase_order_id":
                            item.purchase_order_id,

                        "quantity":
                            item.quantity
                    }
                    for item in active_po_items
                ]
            }

        # -----------------------------------------
        # 12. Calculate expected delivery
        # -----------------------------------------

        lead_time = (
            supplier.lead_time_days or 7
        )

        expected_delivery = (
            datetime.utcnow()
            + timedelta(days=lead_time)
        )

        # -----------------------------------------
        # 13. Calculate PO amount
        # -----------------------------------------

        unit_price = float(product.price)

        total_price = (
            additional_quantity * unit_price
        )

        # -----------------------------------------
        # 14. Create Purchase Order
        # -----------------------------------------

        purchase_order = PurchaseOrder(

            supplier_id=supplier.id,

            status="DRAFT",

            total_amount=total_price,

            order_date=datetime.utcnow(),

            expected_delivery=expected_delivery
        )

        db.add(purchase_order)

        db.flush()

        # -----------------------------------------
        # 15. Create Purchase Order Item
        # -----------------------------------------

        purchase_order_item = PurchaseOrderItem(

            purchase_order_id=purchase_order.id,

            product_id=product.id,

            quantity=additional_quantity,

            unit_price=unit_price,

            total_price=total_price
        )

        db.add(purchase_order_item)

        # -----------------------------------------
        # 16. Save to database
        # -----------------------------------------

        db.commit()

        db.refresh(purchase_order)

        # -----------------------------------------
        # 16b. Send Email Alert
        # -----------------------------------------
        subject = f"[AI ACTION] Purchase Order #{purchase_order.id} Created for {product.name}"
        body = (
            f"An AI-generated Purchase Order has been created.\n\n"
            f"PO ID: {purchase_order.id}\n"
            f"Product: {product.name} (ID: {product.id})\n"
            f"Supplier: {supplier.name}\n"
            f"Quantity Ordered: {additional_quantity}\n"
            f"Total Amount: ${purchase_order.total_amount}\n\n"
            f"Forecasted Demand (7-day): {round(float(total_forecast), 2)}\n"
            f"Current Available Quantity: {available_quantity}\n"
        )
        send_email_to_admin_and_supplier(
            subject=subject,
            message_body=body,
            supplier_email=supplier.email if supplier else None,
            db=db,
            notification_type="PURCHASE_ORDER"
        )

        # -----------------------------------------
        # 17. Return result
        # -----------------------------------------

        return {

            "status": "PURCHASE_ORDER_CREATED",

            "purchase_order": {

                "id":
                    purchase_order.id,

                "supplier_id":
                    purchase_order.supplier_id,

                "supplier_name":
                    supplier.name,

                "status":
                    purchase_order.status,

                "total_amount":
                    purchase_order.total_amount,

                "order_date":
                    purchase_order.order_date,

                "expected_delivery":
                    purchase_order.expected_delivery
            },

            "item": {

                "product_id":
                    product.id,

                "product_name":
                    product.name,

                "quantity":
                    additional_quantity,

                "unit_price":
                    unit_price,

                "total_price":
                    total_price
            },

            "ai_analysis": {

                "forecast_days": 7,

                "forecast_demand":
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
                    ),

                "recommended_quantity":
                    recommended_quantity,

                "outstanding_po_quantity":
                    outstanding_quantity,

                "additional_quantity_required":
                    additional_quantity
            }
        }

    except HTTPException:

        db.rollback()

        raise

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        db.close()