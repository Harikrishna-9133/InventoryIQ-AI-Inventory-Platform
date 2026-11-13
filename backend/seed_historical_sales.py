from datetime import datetime, timedelta
import random

from sqlalchemy.orm import Session

from database import SessionLocal
from models import Sale, SaleItem


# =========================================================
# CONFIGURATION
# =========================================================

PRODUCT_ID = 1
CUSTOMER_ID = 1

UNIT_PRICE = 65000

# Two years of historical data
START_DATE = datetime(2024, 8, 19)
END_DATE = datetime(2026, 8, 18)

# Reproducible fake data
random.seed(42)


# =========================================================
# GENERATE HISTORICAL SALES
# =========================================================

def generate_historical_sales():

    db: Session = SessionLocal()

    try:

        current_date = START_DATE

        created_sales = 0
        total_units = 0
        total_revenue = 0

        while current_date <= END_DATE:

            # -------------------------------------------------
            # Base demand
            # -------------------------------------------------

            if current_date.weekday() >= 5:
                # Weekend
                quantity = random.randint(4, 10)
            else:
                # Weekday
                quantity = random.randint(8, 20)

            # -------------------------------------------------
            # Occasional high-demand days
            # -------------------------------------------------

            if random.random() < 0.08:
                quantity += random.randint(5, 12)

            total_price = quantity * UNIT_PRICE

            # -------------------------------------------------
            # Create Sale
            # -------------------------------------------------

            sale = Sale(
                customer_id=CUSTOMER_ID,
                total_amount=total_price,
                sale_date=current_date
            )

            db.add(sale)
            db.flush()

            # -------------------------------------------------
            # Create Sale Item
            # -------------------------------------------------

            sale_item = SaleItem(
                sale_id=sale.id,
                product_id=PRODUCT_ID,
                quantity=quantity,
                unit_price=UNIT_PRICE,
                total_price=total_price
            )

            db.add(sale_item)

            created_sales += 1
            total_units += quantity
            total_revenue += total_price

            current_date += timedelta(days=1)

        # Save everything
        db.commit()

        print()
        print("=" * 60)
        print("2-YEAR HISTORICAL SALES CREATED SUCCESSFULLY")
        print("=" * 60)
        print(f"Product ID       : {PRODUCT_ID}")
        print(f"Customer ID      : {CUSTOMER_ID}")
        print(f"Start Date       : {START_DATE.date()}")
        print(f"End Date         : {END_DATE.date()}")
        print(f"Days             : {(END_DATE - START_DATE).days + 1}")
        print(f"Sales Created    : {created_sales}")
        print(f"Total Units Sold : {total_units}")
        print(f"Total Revenue    : Rs.{total_revenue:,.2f}")
        print("=" * 60)

    except Exception as e:

        db.rollback()

        print()
        print("ERROR:")
        print(e)

    finally:

        db.close()


# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":
    generate_historical_sales()