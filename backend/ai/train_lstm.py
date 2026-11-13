import os
import numpy as np
import pandas as pd

from sklearn.preprocessing import MinMaxScaler

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping


# =========================================================
# CONFIGURATION
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_FILE = os.path.join(BASE_DIR, "processed_sales.csv")

MODEL_FILE = os.path.join(BASE_DIR, "inventory_demand_model.keras")
SCALER_FILE = os.path.join(BASE_DIR, "demand_scaler.npy")

LOOKBACK = 30


# =========================================================
# LOAD DATA
# =========================================================

print("=" * 60)
print("LSTM INVENTORY DEMAND FORECASTING")
print("=" * 60)

df = pd.read_csv(DATA_FILE)

df["date"] = pd.to_datetime(df["date"])

df = df.sort_values("date")

demand = df["quantity_sold"].values.reshape(-1, 1)

print()
print(f"Dataset records : {len(df)}")
print(f"Start date      : {df['date'].min().date()}")
print(f"End date        : {df['date'].max().date()}")
print(f"Total demand    : {demand.sum():.0f}")


# =========================================================
# NORMALIZE DATA
# =========================================================

scaler = MinMaxScaler()

scaled_demand = scaler.fit_transform(demand)


# =========================================================
# CREATE SEQUENCES
# =========================================================

X = []
y = []

for i in range(LOOKBACK, len(scaled_demand)):

    X.append(
        scaled_demand[i - LOOKBACK:i, 0]
    )

    y.append(
        scaled_demand[i, 0]
    )


X = np.array(X)
y = np.array(y)


# =========================================================
# RESHAPE FOR LSTM
# =========================================================

X = X.reshape(
    X.shape[0],
    X.shape[1],
    1
)


print()
print(f"Lookback window : {LOOKBACK} days")
print(f"Training samples: {len(X)}")
print(f"Input shape     : {X.shape}")
print(f"Output shape    : {y.shape}")


# =========================================================
# TRAIN / VALIDATION SPLIT
# =========================================================

split_index = int(len(X) * 0.8)

X_train = X[:split_index]
y_train = y[:split_index]

X_test = X[split_index:]
y_test = y[split_index:]


print()
print(f"Training samples  : {len(X_train)}")
print(f"Validation samples: {len(X_test)}")


# =========================================================
# BUILD MODEL
# =========================================================

model = Sequential([
    LSTM(
        64,
        return_sequences=True,
        input_shape=(LOOKBACK, 1)
    ),

    Dropout(0.2),

    LSTM(32),

    Dropout(0.2),

    Dense(16, activation="relu"),

    Dense(1)
])


# =========================================================
# COMPILE
# =========================================================

model.compile(
    optimizer="adam",
    loss="mse",
    metrics=["mae"]
)


model.summary()


# =========================================================
# EARLY STOPPING
# =========================================================

early_stopping = EarlyStopping(
    monitor="val_loss",
    patience=10,
    restore_best_weights=True
)


# =========================================================
# TRAIN
# =========================================================

print()
print("=" * 60)
print("STARTING LSTM TRAINING")
print("=" * 60)

history = model.fit(
    X_train,
    y_train,
    validation_data=(X_test, y_test),
    epochs=50,
    batch_size=16,
    callbacks=[early_stopping],
    verbose=1
)


# =========================================================
# SAVE MODEL
# =========================================================

model.save(MODEL_FILE)


# =========================================================
# SAVE SCALER INFORMATION
# =========================================================

np.save(
    SCALER_FILE,
    np.array([
        scaler.data_min_[0],
        scaler.data_max_[0]
    ])
)


# =========================================================
# COMPLETE
# =========================================================

print()
print("=" * 60)
print("LSTM TRAINING COMPLETED")
print("=" * 60)

print(f"Model saved to : {MODEL_FILE}")
print(f"Scaler saved to: {SCALER_FILE}")

print()
print(
    f"Final training loss   : "
    f"{history.history['loss'][-1]:.6f}"
)

print(
    f"Final validation loss : "
    f"{history.history['val_loss'][-1]:.6f}"
)

print("=" * 60)