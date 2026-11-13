
import argparse
import csv
import zipfile
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from io import TextIOWrapper

from sqlalchemy import func, select, text, insert

from database import SessionLocal
from models import (
    User,
    Customer,
    Supplier,
    Category,
    Product,
    Warehouse,
    Inventory,
    Sale,
    SaleItem,
    PurchaseOrder,
    PurchaseOrderItem,
    Forecast,
    Notification,
)


PROJECT_DIR = Path(__file__).resolve().parent.parent
ZIP_PATH = PROJECT_DIR / "InventoryIQ_Complete_Sample_Dataset_CSV.zip"

REQUIRED_FILES = [
    "warehouses.csv",
    "historical_sales.csv",
    "purchase_order_items.csv",
    "daily_demand.csv",
    "suppliers.csv",
    "products.csv",
    "inventory.csv",
    "purchase_orders.csv",
]

# All these tables must be empty before importing.
# The users table is deliberately excluded.
PROTECTED_TABLES = [
    Customer,
    Supplier,
    Category,
    Product,
    Warehouse,
    Inventory,
    Sale,
    SaleItem,
    PurchaseOrder,
    PurchaseOrderItem,
    Forecast,
    Notification,
]


def load_csv(archive, filename):
    with archive.open(filename) as file:
        return list(
            csv.DictReader(
                TextIOWrapper(file, encoding="utf-8-sig")
            )
        )


def integer(value):
    return int(value)


def number(value):
    return float(value)


def date_value(value):
    return datetime.strptime(value, "%Y-%m-%d")


def require_unique(rows, field, filename):
    values = [row[field] for row in rows]

    if len(values) != len(set(values)):
        raise ValueError(
            f"Duplicate {field} found in {filename}"
        )


def prepare_data():
    if not ZIP_PATH.exists():
        raise FileNotFoundError(
            f"Dataset ZIP not found: {ZIP_PATH}"
        )

    with zipfile.ZipFile(ZIP_PATH) as archive:
        available = set(archive.namelist())

        missing = set(REQUIRED_FILES) - available
        if missing:
            raise ValueError(
                f"Missing CSV files: {sorted(missing)}"
            )

        data = {
            name: load_csv(archive, name)
            for name in REQUIRED_FILES
        }

    products = data["products.csv"]
    suppliers = data["suppliers.csv"]
    warehouses = data["warehouses.csv"]
    inventory = data["inventory.csv"]
    sales = data["historical_sales.csv"]
    orders = data["purchase_orders.csv"]
    order_items = data["purchase_order_items.csv"]
    demand = data["daily_demand.csv"]

    require_unique(products, "product_id", "products.csv")
    require_unique(products, "sku", "products.csv")
    require_unique(suppliers, "supplier_id", "suppliers.csv")
    require_unique(warehouses, "warehouse_id", "warehouses.csv")
    require_unique(orders, "purchase_order_id", "purchase_orders.csv")

    product_ids = {integer(r["product_id"]) for r in products}
    supplier_ids = {integer(r["supplier_id"]) for r in suppliers}
    warehouse_ids = {integer(r["warehouse_id"]) for r in warehouses}
    order_ids = {integer(r["purchase_order_id"]) for r in orders}

    for row in products:
        if integer(row["supplier_id"]) not in supplier_ids:
            raise ValueError("Product references an unknown supplier")

    inventory_pairs = set()
    for row in inventory:
        pair = (
            integer(row["product_id"]),
            integer(row["warehouse_id"]),
        )
        if pair[0] not in product_ids or pair[1] not in warehouse_ids:
            raise ValueError("Inventory contains an unknown product or warehouse")
        if pair in inventory_pairs:
            raise ValueError("Duplicate product/warehouse inventory row")
        inventory_pairs.add(pair)

    for row in sales:
        if integer(row["product_id"]) not in product_ids:
            raise ValueError("Historical sales reference an unknown product")

    for row in orders:
        if integer(row["supplier_id"]) not in supplier_ids:
            raise ValueError("Purchase order references an unknown supplier")

    order_supplier = {
        integer(row["purchase_order_id"]): integer(row["supplier_id"])
        for row in orders
    }

    for row in order_items:
        po_id = integer(row["purchase_order_id"])
        product_id = integer(row["product_id"])
        supplier_id = integer(row["supplier_id"])

        if po_id not in order_ids:
            raise ValueError("Purchase-order item references an unknown order")
        if product_id not in product_ids:
            raise ValueError("Purchase-order item references an unknown product")
        if supplier_id != order_supplier[po_id]:
            raise ValueError(
                f"Supplier mismatch in purchase order {po_id}"
            )

    for row in demand:
        if integer(row["product_id"]) not in product_ids:
            raise ValueError("Daily demand references an unknown product")

    # Group historical rows by sale_id.
    grouped_sales = defaultdict(list)
    for row in sales:
        grouped_sales[integer(row["sale_id"])].append(row)

    for sale_id, rows in grouped_sales.items():
        dates = {r["sale_date"] for r in rows}
        if len(dates) != 1:
            raise ValueError(
                f"Sale {sale_id} has inconsistent dates"
            )

    return data, grouped_sales



def import_dataset(apply_changes):
    data, grouped_sales = prepare_data()

    print("\nDataset validation successful.")
    for filename, rows in data.items():
        print(f"{filename}: {len(rows)} rows")

    print(f"Unique sales: {len(grouped_sales)}")
    print(f"Sale items: {len(data['historical_sales.csv'])}")

    def bulk_insert(session, model, rows, batch_size=500):
        """Insert rows in batches to reduce database round trips."""
        if not rows:
            return

        total = len(rows)

        for start in range(0, total, batch_size):
            batch = rows[start:start + batch_size]
            session.execute(insert(model), batch)

            completed = min(start + len(batch), total)
            print(
                f"  {model.__tablename__}: "
                f"{completed}/{total} records"
            )

    with SessionLocal.begin() as session:

        # Never mix this sample dataset with existing business data.
        for model in PROTECTED_TABLES:
            count = session.scalar(
                select(func.count()).select_from(model)
            )

            if count:
                raise RuntimeError(
                    f"STOP: {model.__tablename__} already contains "
                    f"{count} records. No import performed."
                )

        user_count = session.scalar(
            select(func.count()).select_from(User)
        )

        print(f"\nExisting user records preserved: {user_count}")

        if not apply_changes:
            print("\nDRY RUN SUCCESSFUL. No records changed.")
            return

        print("\nStarting optimized bulk import...")

        # 1. Suppliers
        supplier_rows = [
            {
                "id": integer(r["supplier_id"]),
                "name": r["supplier_name"],
                "email": r["email"],
                "phone": r["phone"],
                "address": r["city"],
            }
            for r in data["suppliers.csv"]
        ]

        bulk_insert(session, Supplier, supplier_rows)

        # 2. Categories
        category_names = sorted({
            r["category"].strip()
            for r in data["products.csv"]
        })

        categories = [
            Category(name=name)
            for name in category_names
        ]

        session.add_all(categories)
        session.flush()

        category_map = {
            category.name: category.id
            for category in categories
        }

        print(f"Categories inserted: {len(categories)}")

        # 3. Products
        product_rows = [
            {
                "id": integer(r["product_id"]),
                "sku": r["sku"],
                "name": r["product_name"],
                "price": number(r["selling_price"]),
                "supplier_id": integer(r["supplier_id"]),
                "category_id": category_map[r["category"].strip()],
                "reorder_level": integer(r["reorder_level"]),
                "safety_stock": 0,
            }
            for r in data["products.csv"]
        ]

        bulk_insert(session, Product, product_rows)

        # 4. Warehouses
        warehouse_rows = [
            {
                "id": integer(r["warehouse_id"]),
                "name": r["warehouse_name"],
                "location": r["city"],
            }
            for r in data["warehouses.csv"]
        ]

        bulk_insert(session, Warehouse, warehouse_rows)

        # 5. Inventory
        inventory_rows = [
            {
                "product_id": integer(r["product_id"]),
                "warehouse_id": integer(r["warehouse_id"]),
                "quantity": integer(r["quantity"]),
                "reserved_quantity": integer(r["reserved_quantity"]),
                "available_quantity": integer(r["available_quantity"]),
            }
            for r in data["inventory.csv"]
        ]

        bulk_insert(session, Inventory, inventory_rows)

        # 6. Sales: one row per sale_id
        sales_rows = []
        sale_item_rows = []

        for sale_id, rows in grouped_sales.items():
            sales_rows.append({
                "id": sale_id,
                "customer_id": None,
                "total_amount": sum(
                    number(r["sales_revenue"]) for r in rows
                ),
                "sale_date": date_value(rows[0]["sale_date"]),
            })

            for r in rows:
                sale_item_rows.append({
                    "sale_id": sale_id,
                    "product_id": integer(r["product_id"]),
                    "quantity": integer(r["quantity_sold"]),
                    "unit_price": number(r["unit_selling_price"]),
                    "total_price": number(r["sales_revenue"]),
                })

        bulk_insert(session, Sale, sales_rows)
        bulk_insert(session, SaleItem, sale_item_rows)

        # 7. Purchase orders
        order_rows = [
            {
                "id": integer(r["purchase_order_id"]),
                "supplier_id": integer(r["supplier_id"]),
                "status": r["status"],
                "total_amount": number(r["total_amount"]),
                "order_date": date_value(r["order_date"]),
                "expected_delivery": None,
            }
            for r in data["purchase_orders.csv"]
        ]

        bulk_insert(session, PurchaseOrder, order_rows)

        # 8. Purchase-order items
        order_item_rows = [
            {
                "purchase_order_id": integer(r["purchase_order_id"]),
                "product_id": integer(r["product_id"]),
                "quantity": integer(r["quantity"]),
                "unit_price": number(r["unit_price"]),
                "total_price": number(r["total_price"]),
            }
            for r in data["purchase_order_items.csv"]
        ]

        bulk_insert(session, PurchaseOrderItem, order_item_rows)

        # 9. Reset PostgreSQL sequences for explicitly assigned IDs.
        for table in (
            "suppliers",
            "products",
            "warehouses",
            "sales",
            "purchase_orders",
        ):
            session.execute(text(f"""
                SELECT setval(
                    pg_get_serial_sequence(:table_name, 'id'),
                    COALESCE(MAX(id), 1),
                    MAX(id) IS NOT NULL
                )
                FROM {table}
            """), {"table_name": table})

        print("\nAll records inserted. Committing transaction...")

    # The transaction has committed successfully.
    print("\nIMPORT SUCCESSFUL.")

    # Verify counts after commit.
    with SessionLocal() as verify:
        for model in PROTECTED_TABLES:
            count = verify.scalar(
                select(func.count()).select_from(model)
            )
            print(f"{model.__tablename__}: {count}")

        final_users = verify.scalar(
            select(func.count()).select_from(User)
        )

        print(f"users: {final_users}")

    print("\nExisting users were preserved.")


        
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Safely import InventoryIQ sample CSV data."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually import data. Without this flag, runs a dry-run.",
    )
    args = parser.parse_args()

    try:
        import_dataset(args.apply)
    except Exception as error:
        print(f"\nIMPORT STOPPED: {error}")
        raise
