#include <lmic.h>
#include <hal/hal.h>
#include <SPI.h>
#include <SoftwareSerial.h>

// ---------------- LoRaWAN Keys ----------------
static const u1_t PROGMEM APPEUI[8] = { 0xAE, 0xAE, 0xAE, 0xAE, 0xAE, 0xAE, 0xAE, 0xAE };
void os_getArtEui(u1_t* buf) { memcpy_P(buf, APPEUI, 8); }

static const u1_t PROGMEM DEVEUI[8] = { 0xE9, 0xE3, 0x06, 0xD0, 0x7E, 0xD5, 0xB3, 0x70 };
void os_getDevEui(u1_t* buf) { memcpy_P(buf, DEVEUI, 8); }

static const u1_t PROGMEM APPKEY[16] = { 0x04, 0x2D, 0x98, 0x44, 0x0C, 0x46, 0x55, 0x84, 0x51, 0xC3, 0x22, 0x1E, 0x25, 0x2C, 0xA1, 0x2D };
void os_getDevKey(u1_t* buf) { memcpy_P(buf, APPKEY, 16); }

// ---------------- LoRa Pin Configuration ----------------
const lmic_pinmap lmic_pins = {
    .nss = 10,
    .rxtx = LMIC_UNUSED_PIN,
    .rst = 9,
    .dio = {2, 6, 7},
};

// ---------------- Variables ----------------
const unsigned TX_INTERVAL = 10; // seconds
static osjob_t sendjob;

SoftwareSerial picoSerial(3, 4);  // RX, TX

String adhar_number = ""; 
int heartRate = 0, spo2 = 0, ecg = 0;
float temperature = 0.0;

// ---------------- Function to Read Data from Raspberry Pi Pico ----------------
bool readSensorDataFromPico() {
    if (picoSerial.available()) {
        String line = picoSerial.readStringUntil('\n');
        line.trim();

        if (line.length() > 0) {
            Serial.print("✅ Received from Pico: ");
            Serial.println(line);

            // Expected format: Aadhaar,HR,SpO2,Temp,ECG
            int comma1 = line.indexOf(',');
            if (comma1 < 0) return false;

            adhar_number = line.substring(0, comma1);
            String remaining = line.substring(comma1 + 1);

            // Parse remaining values
            float values[4];
            int i = 0;
            char tempStr[50];
            remaining.toCharArray(tempStr, sizeof(tempStr));
            char *token = strtok(tempStr, ",");

            while (token && i < 4) {
                values[i++] = atof(token);
                token = strtok(NULL, ",");
            }

            if (i == 4) {
                heartRate   = (int)values[0];
                spo2        = (int)values[1];
                temperature = values[2];   // keep decimal
                ecg         = (int)values[3];
                return true;
            }
        }
    }
    return false;
}

// ---------------- LMIC Event Handler ----------------
void onEvent(ev_t ev) {
    switch(ev) {
        case EV_JOINING:  Serial.println(F("EV_JOINING")); break;
        case EV_JOINED:
            Serial.println(F("EV_JOINED"));
            LMIC_setLinkCheckMode(0);
            do_send(&sendjob);
            break;
        case EV_TXCOMPLETE:
            Serial.println(F("EV_TXCOMPLETE"));
            os_setTimedCallback(&sendjob, os_getTime() + sec2osticks(TX_INTERVAL), do_send);
            break;
        default:
            Serial.print(F("Event: ")); Serial.println((unsigned)ev); break;
    }
}

// ---------------- Send Function ----------------
void do_send(osjob_t *j) {
    if (LMIC.devaddr == 0) {
        Serial.println(F("Not joined yet, skipping send"));
        return;
    }

    if (LMIC.opmode & OP_TXRXPEND) {
        Serial.println(F("OP_TXRXPEND, not sending"));
    } else {
        if (!readSensorDataFromPico()) {
            Serial.println(F("⚠ No data from Pico, retrying soon..."));
            os_setTimedCallback(&sendjob, os_getTime() + sec2osticks(5), do_send);
            return;
        }

        // ✅ Build payload with 2 decimal precision temperature
        byte payload[30];
        int index = 0;

        payload[index++] = 0xAA;
        payload[index++] = 0x55;

        // Aadhaar (ASCII 12 bytes)
        for (int i = 0; i < adhar_number.length() && i < 12; i++) {
            payload[index++] = adhar_number.charAt(i);
        }
        while (index < 14) payload[index++] = 0x00;

        // HR, SpO2
        payload[index++] = (heartRate >> 8) & 0xFF;
        payload[index++] = heartRate & 0xFF;
        payload[index++] = (spo2 >> 8) & 0xFF;
        payload[index++] = spo2 & 0xFF;

        // ✅ Convert temperature with 2 decimals → multiply by 100
        int temp_scaled = (int)(temperature * 100);
        payload[index++] = (temp_scaled >> 8) & 0xFF;
        payload[index++] = temp_scaled & 0xFF;

        // ECG
        payload[index++] = (ecg >> 8) & 0xFF;
        payload[index++] = ecg & 0xFF;

        payload[index++] = 0x55;
        payload[index++] = 0xAA;

        Serial.print(F("📡 Sending to TTN | Temp: "));
        Serial.println(temperature, 2);

        LMIC_setTxData2(1, payload, index, 0);
    }
}

// ---------------- Setup ----------------
void setup() {
    Serial.begin(9600);
    picoSerial.begin(9600);

    Serial.println(F("Starting LoRa + Pico integration (with decimal temp)..."));

    os_init();
    LMIC_reset();
    LMIC_setClockError(MAX_CLOCK_ERROR * 1 / 100);
    LMIC_startJoining();
}

// ---------------- Loop ----------------
void loop() {
    os_runloop_once();

    static uint32_t lastPrint = 0;
    if (millis() - lastPrint > 5000) {
        lastPrint = millis();
        Serial.print(F("LMIC.devaddr: "));
        Serial.println(LMIC.devaddr, HEX);
    }
}
