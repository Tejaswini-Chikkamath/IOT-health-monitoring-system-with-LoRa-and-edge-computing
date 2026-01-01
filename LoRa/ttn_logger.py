'''import paho.mqtt.client as mqtt
import json
import base64
import csv
from datetime import datetime

# ---------------- MQTT TTN Configuration ----------------
TTN_BROKER = "eu1.cloud.thethings.network"
TTN_PORT = 1883  # Non-TLS (use 8883 for secure)
TTN_USERNAME = "capstone-lora-app-4@ttn"
TTN_PASSWORD = "NNSXS.BDF4ZLPU7WOEPYEU6BZJ62C4AJM24PHBK42XXHA.SBLWSTQ5X77GNH653XWIL3QSJ7SNFMN5OVV34NUQYMHON7LQOHHA"

DEVICE_ID = "demo-device"  # 🔁 Replace with your actual device ID
TOPIC = f"v3/{TTN_USERNAME}/devices/{DEVICE_ID}/up"

CSV_FILE = "sensor_data.csv"

# ---------------- CSV Setup ----------------
with open(CSV_FILE, "a", newline="") as f:
    writer = csv.writer(f)
    if f.tell() == 0:
        writer.writerow(["timestamp", "adhar_number", "heart_rate", "spo2", "temperature", "ecg_avg"])

# ---------------- Decode Payload ----------------
def decode_payload(payload_raw):
    """Decode TTN base64 payload into sensor values according to new Arduino format."""
    try:
        bytes_ = base64.b64decode(payload_raw)
        if len(bytes_) < 24:  # Minimum expected bytes (start + Aadhaar + 4 values + end)
            print("⚠ Invalid payload length:", len(bytes_))
            return None

        # Start bytes: bytes_[0], bytes_[1] (ignore)
        # Aadhaar number: bytes_[2] to bytes_[13] (12 bytes ASCII)
        adhar_number = "".join(chr(b) for b in bytes_[2:14] if b != 0x00)

        heart_rate  = (bytes_[14] << 8) | bytes_[15]
        spo2        = (bytes_[16] << 8) | bytes_[17]
        temperature = ((bytes_[18] << 8) | bytes_[19]) / 10.0
        ecg_avg     = (bytes_[20] << 8) | bytes_[21]

        return {
            "adhar_number": adhar_number,
            "heart_rate": heart_rate,
            "spo2": spo2,
            "temperature": temperature,
            "ecg_avg": ecg_avg
        }

    except Exception as e:
        print("❌ Error decoding payload:", e)
        return None

# ---------------- MQTT Callbacks ----------------
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Connected to TTN MQTT broker.")
        client.subscribe(TOPIC)
        print(f"📡 Subscribed to topic: {TOPIC}")
    else:
        print(f"❌ Connection failed with code {rc}")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        raw_payload = payload["uplink_message"]["frm_payload"]

        decoded = decode_payload(raw_payload)
        if decoded:
            # ✅ Add apostrophe before Aadhaar number to keep it as text in Excel
            decoded["adhar_number"] = "'" + decoded["adhar_number"]

            timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            data_row = [timestamp] + list(decoded.values())

            # Save to CSV
            with open(CSV_FILE, "a", newline="") as f:
                writer = csv.writer(f)
                writer.writerow(data_row)

            print(f"💾 Saved data at {timestamp}: {decoded}")
        else:
            print("⚠ Could not decode payload.")

    except Exception as e:
        print("❌ Error processing message:", e)

# ---------------- MQTT Client Setup ----------------
client = mqtt.Client()
client.username_pw_set(TTN_USERNAME, TTN_PASSWORD)
client.on_connect = on_connect
client.on_message = on_message

print("🔄 Connecting to TTN...")
client.connect(TTN_BROKER, TTN_PORT, 60)

print("🟢 Listening for TTN uplinks. Press Ctrl+C to stop.")
client.loop_forever()
'''

import paho.mqtt.client as mqtt
import json
import base64
import csv
from datetime import datetime

# ---------------- MQTT TTN Configuration ----------------
TTN_BROKER = "eu1.cloud.thethings.network"
TTN_PORT = 1883  # Non-TLS (use 8883 for secure)
TTN_USERNAME = "capstone-lora-app-4@ttn"
TTN_PASSWORD = "NNSXS.BDF4ZLPU7WOEPYEU6BZJ62C4AJM24PHBK42XXHA.SBLWSTQ5X77GNH653XWIL3QSJ7SNFMN5OVV34NUQYMHON7LQOHHA"

DEVICE_ID = "demo-device"  # 🔁 Replace with your actual device ID
TOPIC = f"v3/{TTN_USERNAME}/devices/{DEVICE_ID}/up"

CSV_FILE = "sensor_data.csv"

# ---------------- CSV Setup ----------------
with open(CSV_FILE, "a", newline="") as f:
    writer = csv.writer(f)
    if f.tell() == 0:
        writer.writerow(["timestamp", "adhar_number", "heart_rate", "spo2", "temperature", "ecg_avg"])

# ---------------- Decode Payload ----------------
def decode_payload(payload_raw):
    """Decode TTN base64 payload into sensor values according to new Arduino format."""
    try:
        bytes_ = base64.b64decode(payload_raw)
        if len(bytes_) < 24:  # Minimum expected bytes (start + Aadhaar + 4 values + end)
            print("⚠ Invalid payload length:", len(bytes_))
            return None

        # Start bytes: bytes_[0], bytes_[1] (ignore)
        # Aadhaar number: bytes_[2] to bytes_[13] (12 bytes ASCII)
        adhar_number = "".join(chr(b) for b in bytes_[2:14] if b != 0x00)

        heart_rate  = (bytes_[14] << 8) | bytes_[15]
        spo2        = (bytes_[16] << 8) | bytes_[17]
        temperature = ((bytes_[18] << 8) | bytes_[19]) / 100.0  # ✅ 2 decimal precision
        ecg_avg     = (bytes_[20] << 8) | bytes_[21]

        return {
            "adhar_number": adhar_number,
            "heart_rate": heart_rate,
            "spo2": spo2,
            "temperature": round(temperature, 2),  # ✅ store as 2-decimal float
            "ecg_avg": ecg_avg
        }

    except Exception as e:
        print("❌ Error decoding payload:", e)
        return None

# ---------------- MQTT Callbacks ----------------
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Connected to TTN MQTT broker.")
        client.subscribe(TOPIC)
        print(f"📡 Subscribed to topic: {TOPIC}")
    else:
        print(f"❌ Connection failed with code {rc}")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        raw_payload = payload["uplink_message"]["frm_payload"]

        decoded = decode_payload(raw_payload)
        if decoded:
            # ✅ Keep Aadhaar number as text (avoid Excel truncation)
            decoded["adhar_number"] = "'" + decoded["adhar_number"]

            timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            data_row = [timestamp] + list(decoded.values())

            # Save to CSV
            with open(CSV_FILE, "a", newline="") as f:
                writer = csv.writer(f)
                writer.writerow(data_row)

            print(f"💾 Saved data at {timestamp}: {decoded}")
        else:
            print("⚠ Could not decode payload.")

    except Exception as e:
        print("❌ Error processing message:", e)

# ---------------- MQTT Client Setup ----------------
client = mqtt.Client()
client.username_pw_set(TTN_USERNAME, TTN_PASSWORD)
client.on_connect = on_connect
client.on_message = on_message

print("🔄 Connecting to TTN...")
client.connect(TTN_BROKER, TTN_PORT, 60)

print("🟢 Listening for TTN uplinks. Press Ctrl+C to stop.")
client.loop_forever()
