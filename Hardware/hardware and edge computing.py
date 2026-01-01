import network
import socket
import json
import time
import machine
import utime
import onewire
import ds18x20
import urandom
from machine import Pin, I2C

# ---------- UART → Arduino ----------
uart = machine.UART(0, baudrate=9600, tx=Pin(0), rx=Pin(1))

# ---------- ECG Sensor ----------
ecg_pin = machine.ADC(26)

# ---------- DS18B20 Sensor (NO SCAN USED) ----------
ds_pin = Pin(2)
ow = onewire.OneWire(ds_pin)
ds = ds18x20.DS18X20(ow)

# We assume ONE DS18B20 connected
temp_present = True
print("DS18B20: using single-device mode")

# ---------- Fake HR & SPO2 ----------
def fake_hr(): return 60 + urandom.getrandbits(5)
def fake_spo2(): return 95 + urandom.getrandbits(3)

# ---------- Web UI ----------
HTML = """<!DOCTYPE html>
<html>
<body>
<h2>PicoW Health Monitor</h2>
<input id="aadhaar" placeholder="Enter Aadhaar"><br><br>
<button onclick="go()">Start</button>
<pre id="out"></pre>
<script>
async function go(){
 let a=document.getElementById('aadhaar').value;
 if(!a){ alert("Enter Aadhaar"); return; }
 document.getElementById('out').innerText="Measuring 30 sec...";
 let r=await fetch('/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({aadhaar:a})});
 let j=await r.json();
 document.getElementById('out').innerText = JSON.stringify(j,null,2);
}
</script>
</body>
</html>
"""

# ---------- Measurement ----------
def measure_30_seconds():
    ecg_vals = []
    temp_vals = []
    hr_vals = []
    sp_vals = []

    for i in range(30):

        # ECG
        ecg_vals.append(ecg_pin.read_u16())

        # Temperature
        if temp_present:
            try:
                ds.convert_temp()
                utime.sleep_ms(750)
                t = ds.read_temp(None)      # ⭐ FIXED
            except:
                t = 0
        else:
            t = 0

        temp_vals.append(t)

        # Fake HR & SpO2
        hr_vals.append(fake_hr())
        sp_vals.append(fake_spo2())

        time.sleep(1)

    return {
        "ecg_avg": int(sum(ecg_vals)/len(ecg_vals)),
        "temperature": round(sum(temp_vals)/len(temp_vals), 2),
        "heart_rate": int(sum(hr_vals)/len(hr_vals)),
        "spo2": int(sum(sp_vals)/len(sp_vals))
    }

# ---------- Access Point ----------
ap = network.WLAN(network.AP_IF)
ap.active(True)
ap.config(essid="PicoW_Health", password="12345678")
print("AP Ready:", ap.ifconfig())

# ---------- Web Server ----------
addr = socket.getaddrinfo("0.0.0.0", 80)[0][-1]
s = socket.socket()
s.bind(addr)
s.listen(2)
print("Web UI running…")

while True:
    cl, addr = s.accept()
    req = cl.recv(2048).decode()

    if req.startswith("GET /"):
        cl.send("HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n")
        cl.send(HTML)

    elif "POST /data" in req:
        body = req.split("\r\n\r\n", 1)[1]
        d = json.loads(body)
        aadhaar = d["aadhaar"]

        results = measure_30_seconds()

        # Send to Arduino
        msg = "{},{},{},{},{}\n".format(
            aadhaar,
            results["heart_rate"],
            results["spo2"],
            results["temperature"],
            results["ecg_avg"]
        )
        uart.write(msg)
        print("Sent to Arduino:", msg)

        # Send back to browser
        cl.send("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n")
        cl.send(json.dumps(results))

    cl.close()