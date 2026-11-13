import os
import numpy as np
import pandas as pd
from keras.models import load_model


# =========================================================
# CONFIGURATION
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_FILE = os.path.join(BASE_DIR, "processed_sales.csv")
MODEL_FILE = os.path.join(BASE_DIR, "inventory_demand_model.keras")
SCALER_FILE = os.path.join(BASE_DIR, "demand_scaler.npy")

LOOKBACK = 30


# =========================================================
# LOAD MODEL
# =========================================================

print("=" * 60)
print("INVENTORY DEMAND FORECAST")
print("=" * 60)

print("\nLoading trained LSTM model...")

model = load_model(MODEL_FILE)

print("Model loaded successfully.")


# =========================================================
# LOAD SCALER
# =========================================================

scaler_values = np.load(SCALER_FILE)

data_min = scaler_values[0]
data_max = scaler_values[1]


# =========================================================
# LOAD SALES DATA
# =========================================================

df = pd.read_csv(DATA_FILE)

df["date"] = pd.to_datetime(df["date"])

df = df.sort_values("date")

demand = df["quantity_sold"].values.astype(float)


# =========================================================
# NORMALIZATION FUNCTIONS
# =========================================================

def scale(value):
    return (value - data_min) / (data_max - data_min)


def inverse_scale(value):
    return value * (data_max - data_min) + data_min


# =========================================================
# PREPARE LAST 30 DAYS
# =========================================================

last_30_days = demand[-LOOKBACK:]

scaled_values = np.array([
    scale(value) for value in last_30_days
])


# =========================================================
# FORECAST FUNCTION
# =========================================================

def forecast_demand(days=7):

    sequence = scaled_values.copy()

    predictions = []

    for _ in range(days):

        X = sequence[-LOOKBACK:]

        X = X.reshape(
            1,
            LOOKBACK,
            1
        )

        prediction = model.predict(
            X,
            verbose=0
        )[0][0]

        predicted_quantity = inverse_scale(
            prediction
        )

        predicted_quantity = max(
            0,
            predicted_quantity
        )

        predictions.append(
            predicted_quantity
        )

        sequence = np.append(
            sequence,
            prediction
        )

    return predictions


# =========================================================
# GENERATE 7-DAY FORECAST
# =========================================================

predictions = forecast_demand(7)


# =========================================================
# DISPLAY RESULTS
# =========================================================

last_date = df["date"].max()

forecast_dates = pd.date_range(
    start=last_date + pd.Timedelta(days=1),
    periods=7
)


print()
print("=" * 60)
print("NEXT 7 DAYS DEMAND FORECAST")
print("=" * 60)

total_forecast = 0

for date, prediction in zip(
    forecast_dates,
    predictions
):

    print(
        f"{date.date()} : "
        f"{prediction:.2f} units"
    )

    total_forecast += prediction


print()
print(
    f"Total forecast demand: "
    f"{total_forecast:.2f} units"
)

print(
    f"Average daily demand: "
    f"{total_forecast / 7:.2f} units"
)

print("=" * 60)
print("FORECAST COMPLETED")
print("=" * 60)