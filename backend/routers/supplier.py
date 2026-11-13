from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Supplier
from schemas import SupplierCreate, SupplierResponse, SupplierUpdate


router = APIRouter(
    prefix="/suppliers",
    tags=["Suppliers"]
)


# CREATE SUPPLIER
@router.post(
    "/",
    response_model=SupplierResponse,
    status_code=201
)
def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db)
):

    existing_supplier = (
        db.query(Supplier)
        .filter(Supplier.email == supplier.email)
        .first()
    )

    if existing_supplier:
        raise HTTPException(
            status_code=400,
            detail="Supplier email already exists"
        )

    new_supplier = Supplier(
        **supplier.model_dump()
    )

    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)

    return new_supplier


# GET ALL SUPPLIERS
@router.get(
    "/",
    response_model=List[SupplierResponse]
)
def get_suppliers(
    db: Session = Depends(get_db)
):

    suppliers = (
        db.query(Supplier)
        .order_by(Supplier.id.desc())
        .all()
    )

    return suppliers


# GET ONE SUPPLIER
@router.get(
    "/{supplier_id}",
    response_model=SupplierResponse
)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):

    supplier = (
        db.query(Supplier)
        .filter(Supplier.id == supplier_id)
        .first()
    )

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    return supplier


# UPDATE SUPPLIER
@router.put(
    "/{supplier_id}",
    response_model=SupplierResponse
)
def update_supplier(
    supplier_id: int,
    supplier_data: SupplierUpdate,
    db: Session = Depends(get_db)
):

    supplier = (
        db.query(Supplier)
        .filter(Supplier.id == supplier_id)
        .first()
    )

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    update_data = supplier_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(supplier, key, value)

    db.commit()
    db.refresh(supplier)

    return supplier


# DELETE SUPPLIER
@router.delete(
    "/{supplier_id}"
)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):

    supplier = (
        db.query(Supplier)
        .filter(Supplier.id == supplier_id)
        .first()
    )

    if not supplier:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    db.delete(supplier)
    db.commit()

    return {
        "message": "Supplier deleted successfully",
        "supplier_id": supplier_id
    }