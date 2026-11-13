from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Inventory
from schemas import (
    InventoryCreate,
    InventoryResponse,
    InventoryUpdate
)


router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"]
)


# =========================================================
# CREATE INVENTORY
# =========================================================

@router.post(
    "/",
    response_model=InventoryResponse,
    status_code=201
)
def create_inventory(
    inventory: InventoryCreate,
    db: Session = Depends(get_db)
):

    # Check whether this product already exists
    # in this warehouse
    existing_inventory = (
        db.query(Inventory)
        .filter(
            Inventory.product_id == inventory.product_id,
            Inventory.warehouse_id == inventory.warehouse_id
        )
        .first()
    )

    if existing_inventory:
        raise HTTPException(
            status_code=400,
            detail="Inventory already exists for this product and warehouse"
        )

    # Calculate available quantity
    available_quantity = (
        inventory.quantity -
        inventory.reserved_quantity
    )

    if available_quantity < 0:
        raise HTTPException(
            status_code=400,
            detail="Reserved quantity cannot exceed total quantity"
        )

    new_inventory = Inventory(
        product_id=inventory.product_id,
        warehouse_id=inventory.warehouse_id,
        quantity=inventory.quantity,
        reserved_quantity=inventory.reserved_quantity,
        available_quantity=available_quantity
    )

    db.add(new_inventory)
    db.commit()
    db.refresh(new_inventory)

    return new_inventory


# =========================================================
# GET ALL INVENTORY
# =========================================================

@router.get(
    "/",
    response_model=List[InventoryResponse]
)
def get_inventory(
    db: Session = Depends(get_db)
):

    inventory = (
        db.query(Inventory)
        .order_by(Inventory.id.desc())
        .all()
    )

    return inventory


# =========================================================
# GET INVENTORY BY ID
# =========================================================

@router.get(
    "/{inventory_id}",
    response_model=InventoryResponse
)
def get_inventory_item(
    inventory_id: int,
    db: Session = Depends(get_db)
):

    inventory = (
        db.query(Inventory)
        .filter(Inventory.id == inventory_id)
        .first()
    )

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory record not found"
        )

    return inventory


# =========================================================
# UPDATE INVENTORY
# =========================================================

@router.put(
    "/{inventory_id}",
    response_model=InventoryResponse
)
def update_inventory(
    inventory_id: int,
    inventory_data: InventoryUpdate,
    db: Session = Depends(get_db)
):

    inventory = (
        db.query(Inventory)
        .filter(Inventory.id == inventory_id)
        .first()
    )

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory record not found"
        )

    update_data = inventory_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(inventory, key, value)

    # Recalculate available stock
    if (
        "quantity" in update_data or
        "reserved_quantity" in update_data
    ):

        available_quantity = (
            inventory.quantity -
            inventory.reserved_quantity
        )

        if available_quantity < 0:
            raise HTTPException(
                status_code=400,
                detail="Reserved quantity cannot exceed total quantity"
            )

        inventory.available_quantity = available_quantity

    db.commit()
    db.refresh(inventory)

    return inventory


# =========================================================
# DELETE INVENTORY
# =========================================================

@router.delete(
    "/{inventory_id}"
)
def delete_inventory(
    inventory_id: int,
    db: Session = Depends(get_db)
):

    inventory = (
        db.query(Inventory)
        .filter(Inventory.id == inventory_id)
        .first()
    )

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory record not found"
        )

    db.delete(inventory)
    db.commit()

    return {
        "message": "Inventory deleted successfully",
        "inventory_id": inventory_id
    }


# =========================================================
# LOW STOCK INVENTORY
# =========================================================

@router.get(
    "/alerts/low-stock"
)
def low_stock_alerts(
    db: Session = Depends(get_db)
):

    inventory_records = (
        db.query(Inventory)
        .all()
    )

    low_stock = []

    for item in inventory_records:

        product = item.product

        if not product:
            continue

        if item.available_quantity <= product.reorder_level:

            low_stock.append({
                "inventory_id": item.id,
                "product_id": product.id,
                "product_name": product.name,
                "available_quantity": item.available_quantity,
                "reorder_level": product.reorder_level,
                "status": "LOW STOCK"
            })

    return {
        "count": len(low_stock),
        "items": low_stock
    }