from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import (
    PurchaseOrder,
    PurchaseOrderItem,
    Product,
    Supplier,
    Inventory
)
from schemas import (
    PurchaseOrderCreate,
    PurchaseOrderResponse,
    ReceivePurchaseOrder
)
from email_service import send_email_to_admin_and_supplier



router = APIRouter(
    prefix="/purchase-orders",
    tags=["Purchase Orders"]
)


# =========================================================
# CREATE PURCHASE ORDER
# =========================================================

@router.post(
    "/",
    response_model=PurchaseOrderResponse,
    status_code=201
)
def create_purchase_order(
    order_data: PurchaseOrderCreate,
    db: Session = Depends(get_db)
):

    supplier = (
        db.query(Supplier)
        .filter(Supplier.id == order_data.supplier_id)
        .first()
    )

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    if not order_data.items:
        raise HTTPException(
            status_code=400,
            detail="Purchase order must contain at least one item"
        )

    total_amount = 0

    purchase_order = PurchaseOrder(
        supplier_id=order_data.supplier_id,
        status="pending",
        total_amount=0
    )

    db.add(purchase_order)
    db.flush()

    for item in order_data.items:

        if item.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail="Quantity must be greater than zero"
            )

        if item.unit_price < 0:
            raise HTTPException(
                status_code=400,
                detail="Unit price cannot be negative"
            )

        product = (
            db.query(Product)
            .filter(Product.id == item.product_id)
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item.product_id} not found"
            )

        item_total = item.quantity * item.unit_price
        total_amount += item_total

        purchase_item = PurchaseOrderItem(
            purchase_order_id=purchase_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item_total
        )

        db.add(purchase_item)

    purchase_order.total_amount = total_amount

    db.commit()
    db.refresh(purchase_order)

    # Dispatch email notification directly to Admin and Supplier
    subject = f"[PURCHASE ORDER] New Order #{purchase_order.id} Placed with {supplier.name}"
    body = (
        f"A new Purchase Order #{purchase_order.id} has been submitted.\n\n"
        f"Supplier: {supplier.name}\n"
        f"Supplier Email: {supplier.email or 'N/A'}\n"
        f"Total Amount: ${purchase_order.total_amount:.2f}\n"
        f"Items Count: {len(order_data.items)}\n"
        f"Status: {purchase_order.status}\n"
    )
    send_email_to_admin_and_supplier(
        subject=subject,
        message_body=body,
        supplier_email=supplier.email,
        db=db,
        notification_type="PURCHASE_ORDER"
    )

    return purchase_order


# =========================================================
# GET ALL PURCHASE ORDERS
# =========================================================

@router.get(
    "/",
    response_model=List[PurchaseOrderResponse]
)
def get_purchase_orders(
    db: Session = Depends(get_db)
):

    return (
        db.query(PurchaseOrder)
        .order_by(PurchaseOrder.id.desc())
        .all()
    )


# =========================================================
# GET PURCHASE ORDER
# =========================================================

@router.get(
    "/{order_id}",
    response_model=PurchaseOrderResponse
)
def get_purchase_order(
    order_id: int,
    db: Session = Depends(get_db)
):

    order = (
        db.query(PurchaseOrder)
        .filter(PurchaseOrder.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Purchase order not found"
        )

    return order

# =========================================================
# RECEIVE PURCHASE ORDER
# =========================================================

@router.post(
    "/{order_id}/receive",
    response_model=PurchaseOrderResponse
)
def receive_purchase_order(
    order_id: int,
    receive_data: ReceivePurchaseOrder,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Find purchase order
    # -----------------------------------------------------

    purchase_order = (
        db.query(PurchaseOrder)
        .filter(PurchaseOrder.id == order_id)
        .first()
    )

    if not purchase_order:
        raise HTTPException(
            status_code=404,
            detail="Purchase order not found"
        )

    # -----------------------------------------------------
    # Prevent receiving the same order twice
    # -----------------------------------------------------

    if purchase_order.status == "received":
        raise HTTPException(
            status_code=400,
            detail="Purchase order has already been received"
        )

    # -----------------------------------------------------
    # Verify warehouse
    # -----------------------------------------------------

    from models import Warehouse

    warehouse = (
        db.query(Warehouse)
        .filter(
            Warehouse.id == receive_data.warehouse_id
        )
        .first()
    )

    if not warehouse:
        raise HTTPException(
            status_code=404,
            detail="Warehouse not found"
        )

    # -----------------------------------------------------
    # Add purchased quantities to inventory
    # -----------------------------------------------------

    for item in purchase_order.items:

        inventory = (
            db.query(Inventory)
            .filter(
                Inventory.product_id == item.product_id,
                Inventory.warehouse_id == receive_data.warehouse_id
            )
            .first()
        )

        if inventory:

            inventory.quantity += item.quantity

            inventory.available_quantity = (
                inventory.quantity -
                inventory.reserved_quantity
            )

        else:

            new_inventory = Inventory(
                product_id=item.product_id,
                warehouse_id=receive_data.warehouse_id,
                quantity=item.quantity,
                reserved_quantity=0,
                available_quantity=item.quantity
            )

            db.add(new_inventory)

    # -----------------------------------------------------
    # Change purchase order status
    # -----------------------------------------------------

    purchase_order.status = "received"

    db.commit()
    db.refresh(purchase_order)

    return purchase_order