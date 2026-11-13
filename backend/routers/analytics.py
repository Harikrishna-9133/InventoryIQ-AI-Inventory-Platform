from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import SaleItem, Sale, Product, Inventory


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


# =========================================================
# SALES SUMMARY
# =========================================================

@router.get("/sales-summary")
def sales_summary(
    db: Session = Depends(get_db)
):

    result = (
        db.query(
            func.count(Sale.id).label("total_sales"),
            func.coalesce(
                func.sum(Sale.total_amount),
                0
            ).label("total_revenue")
        )
        .first()
    )

    return {
        "total_sales": result.total_sales,
        "total_revenue": float(result.total_revenue)
    }


# =========================================================
# PRODUCT SALES HISTORY
# =========================================================

@router.get("/product/{product_id}/sales")
def product_sales_history(
    product_id: int,
    db: Session = Depends(get_db)
):

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        return {
            "status": "error",
            "message": "Product not found"
        }

    results = (
        db.query(
            func.date(Sale.sale_date).label("sale_date"),
            func.sum(SaleItem.quantity).label("quantity_sold"),
            func.sum(
                SaleItem.total_price
            ).label("revenue")
        )
        .join(
            Sale,
            Sale.id == SaleItem.sale_id
        )
        .filter(
            SaleItem.product_id == product_id
        )
        .group_by(
            func.date(Sale.sale_date)
        )
        .order_by(
            func.date(Sale.sale_date)
        )
        .all()
    )

    history = []

    for row in results:

        history.append({
            "date": str(row.sale_date),
            "quantity_sold": int(row.quantity_sold),
            "revenue": float(row.revenue)
        })

    return {
        "product_id": product_id,
        "product_name": product.name,
        "history": history
    }


# =========================================================
# INVENTORY SUMMARY
# =========================================================

@router.get("/inventory-summary")
def inventory_summary(
    db: Session = Depends(get_db)
):

    result = (
        db.query(
            func.count(Inventory.id).label(
                "inventory_records"
            ),
            func.coalesce(
                func.sum(Inventory.quantity),
                0
            ).label("total_quantity"),
            func.coalesce(
                func.sum(Inventory.available_quantity),
                0
            ).label("total_available")
        )
        .first()
    )

    return {
        "inventory_records": result.inventory_records,
        "total_quantity": int(result.total_quantity),
        "total_available": int(result.total_available)
    }


# =========================================================
# LOW STOCK ANALYTICS
# =========================================================

@router.get("/low-stock")
def low_stock_analytics(
    db: Session = Depends(get_db)
):

    results = (
        db.query(
            Inventory,
            Product
        )
        .join(
            Product,
            Product.id == Inventory.product_id
        )
        .filter(
            Inventory.available_quantity
            <= Product.reorder_level
        )
        .all()
    )

    items = []

    for inventory, product in results:

        items.append({
            "product_id": product.id,
            "product_name": product.name,
            "available_quantity":
                inventory.available_quantity,
            "reorder_level":
                product.reorder_level,
            "safety_stock":
                product.safety_stock,
            "status": "LOW STOCK"
        })

    return {
        "count": len(items),
        "items": items
    }