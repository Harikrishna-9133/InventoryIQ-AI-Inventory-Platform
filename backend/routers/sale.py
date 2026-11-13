from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Sale, SaleItem, Product, Inventory
from schemas import SaleCreate, SaleResponse


router = APIRouter(
    prefix="/sales",
    tags=["Sales"]
)


# =========================================================
# CREATE SALE
# =========================================================

@router.post(
    "/",
    response_model=SaleResponse,
    status_code=201
)
def create_sale(
    sale_data: SaleCreate,
    db: Session = Depends(get_db)
):

    if not sale_data.items:
        raise HTTPException(
            status_code=400,
            detail="Sale must contain at least one item"
        )

    # -----------------------------------------------------
    # STEP 1: Validate all products and stock BEFORE
    # creating the sale
    # -----------------------------------------------------

    inventory_updates = []
    total_amount = 0

    for item in sale_data.items:

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

        # Find inventory for this product
        inventory = (
            db.query(Inventory)
            .filter(
                Inventory.product_id == item.product_id
            )
            .first()
        )

        if not inventory:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"No inventory found for "
                    f"product {item.product_id}"
                )
            )

        # Check available stock
        if inventory.available_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Insufficient stock for "
                    f"{product.name}. "
                    f"Available: "
                    f"{inventory.available_quantity}, "
                    f"Requested: {item.quantity}"
                )
            )

        item_total = item.quantity * item.unit_price

        total_amount += item_total

        inventory_updates.append(
            {
                "inventory": inventory,
                "quantity": item.quantity
            }
        )

    # -----------------------------------------------------
    # STEP 2: Create sale
    # -----------------------------------------------------

    sale = Sale(
        customer_id=sale_data.customer_id,
        total_amount=total_amount
    )

    db.add(sale)
    db.flush()

    # -----------------------------------------------------
    # STEP 3: Create sale items
    # -----------------------------------------------------

    for item in sale_data.items:

        item_total = (
            item.quantity *
            item.unit_price
        )

        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item_total
        )

        db.add(sale_item)

    # -----------------------------------------------------
    # STEP 4: Deduct inventory
    # -----------------------------------------------------

    for update in inventory_updates:

        inventory = update["inventory"]
        quantity_sold = update["quantity"]

        inventory.quantity -= quantity_sold

        inventory.available_quantity = (
            inventory.quantity -
            inventory.reserved_quantity
        )

    # -----------------------------------------------------
    # STEP 5: Commit everything together
    # -----------------------------------------------------

    db.commit()
    db.refresh(sale)

    return sale


# =========================================================
# GET ALL SALES
# =========================================================

@router.get(
    "/",
    response_model=List[SaleResponse]
)
def get_sales(
    db: Session = Depends(get_db)
):

    return (
        db.query(Sale)
        .order_by(Sale.id.desc())
        .all()
    )


# =========================================================
# GET SALE BY ID
# =========================================================

@router.get(
    "/{sale_id}",
    response_model=SaleResponse
)
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db)
):

    sale = (
        db.query(Sale)
        .filter(Sale.id == sale_id)
        .first()
    )

    if not sale:
        raise HTTPException(
            status_code=404,
            detail="Sale not found"
        )

    return sale


# =========================================================
# DELETE SALE
# =========================================================

@router.delete(
    "/{sale_id}"
)
def delete_sale(
    sale_id: int,
    db: Session = Depends(get_db)
):

    sale = (
        db.query(Sale)
        .filter(Sale.id == sale_id)
        .first()
    )

    if not sale:
        raise HTTPException(
            status_code=404,
            detail="Sale not found"
        )

    db.delete(sale)
    db.commit()

    return {
        "message": "Sale deleted successfully",
        "sale_id": sale_id
    }