import os
import json
import joblib
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.utils import to_categorical
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.utils import resample
from collections import Counter
import inspect

from imblearn.over_sampling import SMOTE
import tf2onnx
import onnx

DATA_PATH = "C:/Users/sachi/Desktop/CAPSTONE1/human_vital_signs_dataset.csv"
OUTPUT_DIR = "C:/Users/sachi/Desktop/CAPSTONE1"
os.makedirs(OUTPUT_DIR, exist_ok=True)

features = ['Heart Rate', 'Body Temperature', 'Oxygen Saturation', 'Age']
target = 'Diseases'

data = pd.read_csv(DATA_PATH)
data = data.dropna(subset=features + [target])

class_counts_orig = data[target].value_counts()
min_samples = 5

largest_non_normal = 0
if 'Normal' in class_counts_orig.index:
    counts_ex_normal = class_counts_orig.drop('Normal', errors='ignore')
    if not counts_ex_normal.empty:
        largest_non_normal = counts_ex_normal.max()
else:
    largest_non_normal = class_counts_orig.max()

if largest_non_normal == 0:
    target_normal_count = class_counts_orig.get('Normal', 0)
else:
    target_normal_count = int(min(class_counts_orig.get('Normal', 0), largest_non_normal * 5))

normal_df = data[data[target] == 'Normal']
others_df = data[data[target] != 'Normal']

if len(normal_df) > target_normal_count and target_normal_count > 0:
    normal_down = resample(normal_df, replace=False, n_samples=target_normal_count, random_state=42)
else:
    normal_down = normal_df.copy()

data = pd.concat([others_df, normal_down]).sample(frac=1, random_state=42).reset_index(drop=True)

class_counts = data[target].value_counts()
valid_classes = class_counts[class_counts >= min_samples].index
data = data[data[target].isin(valid_classes)].reset_index(drop=True)

le = LabelEncoder()
y_labels = le.fit_transform(data[target])
disease_mapping = {int(i): label for i, label in enumerate(le.classes_)}
with open(os.path.join(OUTPUT_DIR, "disease_mapping.json"), "w") as f:
    json.dump(disease_mapping, f)

X = data[features].values
y = y_labels

X_train, X_test, y_train_labels, y_test_labels = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

joblib.dump(scaler, os.path.join(OUTPUT_DIR, "scaler_disease.pkl"))
with open(os.path.join(OUTPUT_DIR, "scaler_disease.json"), "w") as f:
    json.dump({"mean": scaler.mean_.tolist(), "scale": scaler.scale_.tolist()}, f)

smote_kwargs = {"random_state": 42}
if "n_jobs" in inspect.signature(SMOTE).parameters:
    smote_kwargs["n_jobs"] = -1

sm = SMOTE(**smote_kwargs)
X_train_res, y_train_res = sm.fit_resample(X_train_scaled, y_train_labels)

y_train_res_cat = to_categorical(y_train_res, num_classes=len(le.classes_))
y_test_cat = to_categorical(y_test_labels, num_classes=len(le.classes_))

print("Original train class counts:", Counter(y_train_labels))
print("After SMOTE train class counts:", Counter(y_train_res))
print("Test class counts (unchanged):", Counter(y_test_labels))

num_features = X_train_res.shape[1]
num_classes = y_train_res_cat.shape[1]

tf.random.set_seed(42)
model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(num_features,)),
    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.Dense(32, activation='relu'),
    tf.keras.layers.Dense(num_classes, activation='softmax')
])
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

batch_size = 256
train_dataset = tf.data.Dataset.from_tensor_slices((X_train_res.astype(np.float32), y_train_res_cat.astype(np.float32))) \
    .shuffle(buffer_size=1024).batch(batch_size)
val_dataset = tf.data.Dataset.from_tensor_slices((X_test_scaled.astype(np.float32), y_test_cat.astype(np.float32))) \
    .batch(batch_size)

model.fit(train_dataset, epochs=30, validation_data=val_dataset, verbose=1)

loss, acc = model.evaluate(val_dataset, verbose=0)
print("Final Test Accuracy:", acc)

y_pred_probs = model.predict(X_test_scaled.astype(np.float32), batch_size= batch_size)
y_pred = np.argmax(y_pred_probs, axis=1)
y_true = y_test_labels

report = classification_report(y_true, y_pred, target_names=le.classes_, digits=4)
cm = confusion_matrix(y_true, y_pred)

print("Classification Report:\n", report)
print("Confusion Matrix:\n", cm.tolist())

with open(os.path.join(OUTPUT_DIR, "classification_report.txt"), "w") as f:
    f.write(report)
np.savetxt(os.path.join(OUTPUT_DIR, "confusion_matrix.csv"), cm, fmt='%d', delimiter=",")

spec = tf.TensorSpec([None, num_features], tf.float32, name="input")
onnx_model, _ = tf2onnx.convert.from_keras(model, input_signature=[spec], opset=13)
onnx_path = os.path.join(OUTPUT_DIR, "disease_model.onnx")
onnx.save_model(onnx_model, onnx_path)
print("Model saved as", onnx_path)

# ==== EXPORT WEIGHTS TO JSON FOR PICO ====
weights_json = {}

for layer in model.layers:
    if isinstance(layer, tf.keras.layers.Dense):
        w, b = layer.get_weights()
        weights_json[layer.name] = {
            "weights": w.tolist(),
            "bias": b.tolist()
        }

with open(os.path.join(OUTPUT_DIR, "model_weights.json"), "w") as f:
    json.dump(weights_json, f)

print("Exported model_weights.json")
