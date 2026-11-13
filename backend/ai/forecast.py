
import os
from functools import lru_cache

import numpy as np
import pandas as pd


# =========================================================
# CONFIGURATION
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_FILE = os.path.join(BASE_DIR, "processed_sales.csv")
MODEL_FILE = os.path.join(BASE_DIR, "inventory_demand_model.keras")
SCALER_FILE = os.path.join(BASE_DIR, "demand_scaler.npy")

LOOKBACK = 30


# =========================================================
# LOAD AI ASSETS ONLY WHEN FORECAST IS REQUESTED
# =========================================================

@lru_cache(maxsize=1)
def load_forecast_assets():

    print("Loading LSTM forecasting assets...")

    # TensorFlow/Keras is imported only when needed
    from keras.models import load_model

    model = load_model(MODEL_FILE)

    scaler_values = np.load(SCALER_FILE)

    data_min = float(scaler_values[0])
    data_max = float(scaler_values[1])

    df = pd.read_csv(DATA_FILE)

    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")

    demand = df["quantity_sold"].values.astype(float)

    if len(demand) < LOOKBACK:
        raise ValueError("At least 30 days of sales data are required.")

    if data_max == data_min:
        raise ValueError("Invalid scaler values: maximum equals minimum.")

    last_30_days = demand[-LOOKBACK:]

    scaled_values = (
        (last_30_days - data_min) /
        (data_max - data_min)
    )

    print("LSTM forecasting assets loaded successfully.")

    return model, data_min, data_max, df, scaled_values


# =========================================================
# FORECAST FUNCTION
# =========================================================

def forecast_demand(days=7):

    if days < 1:
        raise ValueError("Forecast days must be at least 1.")

    model, data_min, data_max, df, scaled_values = (
        load_forecast_assets()
    )

    sequence = scaled_values.copy()
    predictions = []

    for _ in range(days):

        X = sequence[-LOOKBACK:]

        X = X.reshape(1, LOOKBACK, 1)

        prediction = model.predict(
            X,
            verbose=0
        )[0][0]

        predicted_quantity = (
            prediction * (data_max - data_min) + data_min
        )

        predicted_quantity = max(0, float(predicted_quantity))

        predictions.append(predicted_quantity)

        sequence = np.append(sequence, prediction)

    return predictions
