import os
import pandas as pd
import numpy as np

from sqlalchemy import func

from database import SessionLocal
from models import Sale, SaleItem


# =========================================================
# CONFIGURATION
# =========================================================

PRODUCT_ID = 1


# =========================================================
# LOAD SALES FROM DATABASE
# =========================================================

def load_sales_data(product_id: int):

    db = SessionLocal()

    try:

        results = (
            db.query(
                func.date(Sale.sale_date).label("sale_date"),
                func.sum(SaleItem.quantity).label("quantity_sold")
            )
            .join(
                SaleItem,
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

        records = []

        for row in results:

            records.append({
                "date": row.sale_date,
                "quantity_sold": int(row.quantity_sold)
            })

        return pd.DataFrame(records)

    finally:

        db.close()


# =========================================================
# PREPROCESS DATA
# =========================================================

def prepare_dataset(product_id: int):

    df = load_sales_data(product_id)

    if df.empty:
        raise ValueError(
            f"No sales data found for product {product_id}"
        )

    # Convert date
    df["date"] = pd.to_datetime(df["date"])

    # Sort chronologically
    df = df.sort_values("date")

    # -----------------------------------------------------
    # Fill missing dates
    # -----------------------------------------------------

    full_dates = pd.date_range(
        start=df["date"].min(),
        end=df["date"].max(),
        freq="D"
    )

    df = (
        df.set_index("date")
        .reindex(full_dates, fill_value=0)
        .rename_axis("date")
        .reset_index()
    )

    # -----------------------------------------------------
    # Convert demand to numeric
    # -----------------------------------------------------

    df["quantity_sold"] = (
        pd.to_numeric(
            df["quantity_sold"],
            errors="coerce"
        )
        .fillna(0)
        .astype(float)
    )

    # -----------------------------------------------------
    # Add useful time features
    # -----------------------------------------------------

    df["day_of_week"] = df["date"].dt.dayofweek
    df["month"] = df["date"].dt.month
    df["day_of_month"] = df["date"].dt.day

    # -----------------------------------------------------
    # Save processed dataset
    # -----------------------------------------------------

    base_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(base_dir, "processed_sales.csv")

    df.to_csv(
        output_file,
        index=False
    )

    return df


# =========================================================
# MAIN
# =========================================================

if __name__ == "__main__":

    print("=" * 60)
    print("AI SALES DATA PREPROCESSING")
    print("=" * 60)

    df = prepare_dataset(PRODUCT_ID)

    print()
    print(f"Product ID       : {PRODUCT_ID}")
    print(f"Records          : {len(df)}")
    print(f"Start Date       : {df['date'].min().date()}")
    print(f"End Date         : {df['date'].max().date()}")
    print(
        f"Total Units      : {df['quantity_sold'].sum():.0f}"
    )
    print(
        f"Average Daily    : {df['quantity_sold'].mean():.2f}"
    )

    print()
    print("First 10 records:")
    print(df.head(10).to_string(index=False))

    print()
    print("Last 10 records:")
    print(df.tail(10).to_string(index=False))

    print()
    print("Processed dataset saved to:")
    print("ai/processed_sales.csv")

    print("=" * 60)