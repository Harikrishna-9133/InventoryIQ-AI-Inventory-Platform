from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Warehouse
from schemas import WarehouseCreate, WarehouseResponse, WarehouseUpdate


router = APIRouter(
    prefix="/warehouses",
    tags=["Warehouses"]
)


# CREATE WAREHOUSE
@router.post(
    "/",
    response_model=WarehouseResponse,
    status_code=201
)
def create_warehouse(
    warehouse: WarehouseCreate,
    db: Session = Depends(get_db)
):
    existing_warehouse = (
        db.query(Warehouse)
        .filter(Warehouse.name == warehouse.name)
        .first()
    )

    if existing_warehouse:
        raise HTTPException(
            status_code=400,
            detail="Warehouse name already exists"
        )

    new_warehouse = Warehouse(
        **warehouse.model_dump()
    )

    db.add(new_warehouse)
    db.commit()
    db.refresh(new_warehouse)

    return new_warehouse


# GET ALL WAREHOUSES
@router.get(
    "/",
    response_model=List[WarehouseResponse]
)
def get_warehouses(
    db: Session = Depends(get_db)
):
    return (
        db.query(Warehouse)
        .order_by(Warehouse.id.desc())
        .all()
    )


# GET ONE WAREHOUSE
@router.get(
    "/{warehouse_id}",
    response_model=WarehouseResponse
)
def get_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db)
):
    warehouse = (
        db.query(Warehouse)
        .filter(Warehouse.id == warehouse_id)
        .first()
    )

    if not warehouse:
        raise HTTPException(
            status_code=404,
            detail="Warehouse not found"
        )

    return warehouse


# UPDATE WAREHOUSE
@router.put(
    "/{warehouse_id}",
    response_model=WarehouseResponse
)
def update_warehouse(
    warehouse_id: int,
    warehouse_data: WarehouseUpdate,
    db: Session = Depends(get_db)
):
    warehouse = (
        db.query(Warehouse)
        .filter(Warehouse.id == warehouse_id)
        .first()
    )

    if not warehouse:
        raise HTTPException(
            status_code=404,
            detail="Warehouse not found"
        )

    update_data = warehouse_data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(warehouse, key, value)

    db.commit()
    db.refresh(warehouse)

    return warehouse


# DELETE WAREHOUSE
@router.delete(
    "/{warehouse_id}"
)
def delete_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db)
):
    warehouse = (
        db.query(Warehouse)
        .filter(Warehouse.id == warehouse_id)
        .first()
    )

    if not warehouse:
        raise HTTPException(
            status_code=404,
            detail="Warehouse not found"
        )

    db.delete(warehouse)
    db.commit()

    return {
        "message": "Warehouse deleted successfully",
        "warehouse_id": warehouse_id
    }