from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)

# ─────────────────────────────────────────
# LOAD ALL JSON DATA
# ─────────────────────────────────────────

def load_json(path):
    try:
        with open(path, "r") as f:
            return json.load(f)
    except:
        return []

def get_all_data():
    solar    = load_json("../member1_solar/output/solar_predictions.json")
    devices  = load_json("../member2_devices/output/devices.json")
    schedule = load_json("../member3_optimizer/output/schedule.json")
    savings  = load_json("../member3_optimizer/output/savings_summary.json")
    return solar, devices, schedule, savings

# ─────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────

@app.route("/")
def index():
    solar, devices, schedule, savings = get_all_data()
    return render_template("index.html",
        solar=solar,
        devices=devices,
        schedule=schedule,
        savings=savings
    )

@app.route("/api/solar")
def api_solar():
    solar = load_json("../member1_solar/output/solar_predictions.json")
    return jsonify(solar)

@app.route("/api/devices")
def api_devices():
    devices = load_json("../member2_devices/output/devices.json")
    return jsonify(devices)

@app.route("/api/schedule")
def api_schedule():
    schedule = load_json("../member3_optimizer/output/schedule.json")
    return jsonify(schedule)

@app.route("/api/savings")
def api_savings():
    savings = load_json("../member3_optimizer/output/savings_summary.json")
    return jsonify(savings)

# ─────────────────────────────────────────
# BILL COMPARISON
# ─────────────────────────────────────────

bills = []

@app.route("/api/add_bill", methods=["POST"])
def add_bill():
    data = request.json
    bills.append({
        "month": data.get("month"),
        "amount": data.get("amount")
    })
    return jsonify({"status": "saved", "bills": bills})

@app.route("/api/bills")
def get_bills():
    return jsonify(bills)

# ─────────────────────────────────────────
# RUN
# ─────────────────────────────────────────

if __name__ == "__main__":
    print("Solar Sync AI Dashboard running!")
    print("Open browser: http://127.0.0.1:5000")
    app.run(debug=True)
