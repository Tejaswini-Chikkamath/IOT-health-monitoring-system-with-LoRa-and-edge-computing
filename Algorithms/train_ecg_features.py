# train_ecg_features.py
# Trains a small dense NN on ECG feature CSV and exports JSON weights for Pico.
# Usage: python train_ecg_features.py

import os
import json
from collections import Counter

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE
import joblib
import tensorflow as tf

# --------- Config ----------
CSV = "C:/Users/sachi/Desktop/CAPSTONE1/ecg_features.csv"     # produced by preprocess_mitbih.py
OUTDIR = "."                 # output JSONs here
FEATURE_ORDER = [
    "mean_rr","std_rr","rmssd","pnn50","hr_bpm",
    "qrs_width","r_amp","p_tot","p_low","p_mid","p_high",
    "skew","kurtosis"
]
ECG_MODEL_WEIGHTS = os.path.join(OUTDIR, "ecg_model_weights.json")
ECG_SCALER_JSON   = os.path.join(OUTDIR, "ecg_scaler.json")
ECG_MAPPING_JSON  = os.path.join(OUTDIR, "ecg_mapping.json")
TRAIN_REPORT = os.path.join(OUTDIR, "ecg_train_report.txt")

# --------- Load data ----------
df = pd.read_csv(CSV)
# Keep only rows that have all features
df = df.dropna(subset=FEATURE_ORDER + ["label"]).reset_index(drop=True)
print("Rows after dropna:", len(df))

# Optionally collapse/clean labels — keep classes with enough samples
vc = df['label'].value_counts()
print("Label counts:", vc.to_dict())

# Keep labels with >= N samples to avoid tiny classes (adjust N as needed)
MIN_SAMPLES = 20
keep_labels = vc[vc >= MIN_SAMPLES].index.tolist()
df = df[df['label'].isin(keep_labels)].reset_index(drop=True)
print("Rows after filtering small classes:", len(df))
print("Remaining classes:", df['label'].nunique(), df['label'].unique())

# --------- Features & labels ----------
X = df[FEATURE_ORDER].values.astype(np.float32)
y = df['label'].values.astype(str)

le = LabelEncoder()
y_enc = le.fit_transform(y)
mapping = {int(i): label for i, label in enumerate(le.classes_)}
with open(ECG_MAPPING_JSON, "w") as f:
    json.dump(mapping, f)
print("Saved mapping:", ECG_MAPPING_JSON)

# --------- Scale ----------
scaler = StandardScaler()
Xs = scaler.fit_transform(X)
# Save scaler json for Pico (mean + scale arrays)
scaler_json = {"mean": scaler.mean_.tolist(), "scale": scaler.scale_.tolist()}
with open(ECG_SCALER_JSON, "w") as f:
    json.dump(scaler_json, f)
# also save binary scaler (optional)
joblib.dump(scaler, os.path.join(OUTDIR, "ecg_scaler.pkl"))
print("Saved scaler JSON:", ECG_SCALER_JSON)

# --------- Train/test split ----------
X_train, X_test, y_train, y_test = train_test_split(
    Xs, y_enc, test_size=0.2, stratify=y_enc, random_state=42
)
print("Train/test sizes:", X_train.shape, X_test.shape)

# --------- SMOTE to balance ----------
sm = SMOTE(random_state=42)
X_train_res, y_train_res = sm.fit_resample(X_train, y_train)
print("After SMOTE class counts:", Counter(y_train_res))

# --------- Build model ----------
num_features = X_train_res.shape[1]
num_classes = len(le.classes_)
tf.random.set_seed(42)

model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(num_features,)),
    tf.keras.layers.Dense(64, activation='relu', name='dense'),
    tf.keras.layers.Dense(32, activation='relu', name='dense_1'),
    tf.keras.layers.Dense(num_classes, activation='softmax', name='dense_2')
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
print(model.summary())

# --------- Train ----------
EPOCHS = 30
BATCH = 128
history = model.fit(X_train_res, y_train_res, validation_data=(X_test, y_test),
                    epochs=EPOCHS, batch_size=BATCH, verbose=2)

# --------- Evaluate ----------
loss, acc = model.evaluate(X_test, y_test, verbose=0)
print("Test accuracy:", acc)

# --------- Export weights to JSON (Pico format) ----------
weights_json = {}
for layer in model.layers:
    if isinstance(layer, tf.keras.layers.Dense):
        w, b = layer.get_weights()
        # Convert numpy arrays to nested lists
        weights_json[layer.name] = {"weights": w.tolist(), "bias": b.tolist()}

with open(ECG_MODEL_WEIGHTS, "w") as f:
    json.dump(weights_json, f)
print("Wrote ECG weights JSON:", ECG_MODEL_WEIGHTS)

# --------- Save train report ----------
with open(TRAIN_REPORT, "w") as f:
    f.write(f"Test acc: {acc}\n")
    f.write(f"Classes: {mapping}\n")
    f.write(f"Train distribution after SMOTE: {Counter(y_train_res)}\n")
print("Wrote train report:", TRAIN_REPORT)

# Done
print("Training + export complete.")
