'''import firebase_admin
from firebase_admin import credentials, db
import pandas as pd
import time

# ---------------- Firebase Setup ----------------
cred = credentials.Certificate("firebase_key.json")  # Keep this file in same directory
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://iot---health-monitoring-app-default-rtdb.firebaseio.com/'
})

# ---------------- Parameters ----------------
CSV_FILE = "sensor_data.csv"
BATCH_INTERVAL = 10  # 5 minutes
last_sent_index = 0   # Keep track of already sent rows

print("🚀 Firebase uploader started...")

while True:
    try:
        # Read the CSV file
        df = pd.read_csv(CSV_FILE)

        # Select only new rows since last upload
        new_data = df.iloc[last_sent_index:]

        if not new_data.empty:
            for idx, row in new_data.iterrows():
                # Clean Aadhaar (remove apostrophe)
                adhar_number = str(row["adhar_number"]).strip().replace("'", "")

                # Create data dictionary
                data = {
                    "timestamp": row["timestamp"],
                    "heart_rate": int(row["heart_rate"]),
                    "spo2": int(row["spo2"]),
                    "temperature": float(row["temperature"]),
                    "ecg_avg": int(row["ecg_avg"])
                }

                # Push under each Aadhaar node
                db.reference(f"patients/{adhar_number}/records").push(data)
                print(f"✅ Sent to Firebase (Aadhaar: {adhar_number}) — {data}")

            # Update last sent index
            last_sent_index = len(df)
        else:
            print("⏳ No new data to send...")

    except Exception as e:
        print("❌ Error:", e)

    # Wait for next upload
    time.sleep(BATCH_INTERVAL)
'''

import firebase_admin
from firebase_admin import credentials, db
import pandas as pd
import time

# ---------------- Firebase Setup ----------------
cred = credentials.Certificate("firebase_key.json")  # Keep this file in same directory
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://iot---health-monitoring-app-default-rtdb.firebaseio.com/'
})

# ---------------- Parameters ----------------
CSV_FILE = "sensor_data.csv"
BATCH_INTERVAL = 300  # 5 minutes (in seconds)
last_sent_index = 0   # Keep track of already sent rows

print("🚀 Firebase uploader started...")

while True:
    try:
        # Read the CSV file
        df = pd.read_csv(CSV_FILE)

        # Select only new rows since last upload
        new_data = df.iloc[last_sent_index:]

        if not new_data.empty:
            for idx, row in new_data.iterrows():
                # Clean Aadhaar (remove apostrophe)
                adhar_number = str(row["adhar_number"]).strip().replace("'", "")

                # Create data dictionary
                data = {
                    "timestamp": row["timestamp"],
                    "heart_rate": int(row["heart_rate"]),
                    "spo2": int(row["spo2"]),
                    "temperature": round(float(row["temperature"]), 2),  # ✅ keep 2-decimal precision
                    "ecg_avg": int(row["ecg_avg"])
                }

                # Push under Aadhaar node → records
                db.reference(f"patients/{adhar_number}/records").push(data)
                print(f"✅ Sent to Firebase (Aadhaar: {adhar_number}) — {data}")

            # Update last sent index
            last_sent_index = len(df)
        else:
            print("⏳ No new data to send...")

    except Exception as e:
        print("❌ Error:", e)

    # Wait before next upload
    time.sleep(BATCH_INTERVAL)
