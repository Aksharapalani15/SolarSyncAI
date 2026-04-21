import json
import os

# ─────────────────────────────────────────
# STEP 1: LOAD SOLAR DATA (from Member 1)
# ─────────────────────────────────────────

def load_solar_data():
    path = "../member1_solar/output/solar_predictions.json"
    with open(path, "r") as f:
        data = json.load(f)
    print(f"Solar data loaded. {len(data)} days found.")
    return data

# ─────────────────────────────────────────
# STEP 2: LOAD DEVICE DATA (from Member 2)
# ─────────────────────────────────────────

def load_device_data():
    path = "../member2_devices/output/devices.json"
    with open(path, "r") as f:
        data = json.load(f)
    print(f"Device data loaded. {len(data)} devices found.")
    return data

# ─────────────────────────────────────────
# STEP 3: RANK DEVICES BY ENERGY USE
# ─────────────────────────────────────────

def rank_devices(devices):
    print("\nRanking devices by energy consumption...")
    ranked = sorted(devices, key=lambda x: x["monthly_kwh"], reverse=True)
    for i, d in enumerate(ranked):
        print(f"  {i+1}. {d['device']} — {d['monthly_kwh']} kWh/month")
    return ranked

# ─────────────────────────────────────────
# STEP 4: MATCH DEVICES TO PEAK SOLAR HOURS
# ─────────────────────────────────────────

def match_devices_to_solar(solar_data, ranked_devices):
    print("\nMatching devices to solar peak hours...")
    schedule = []

    for day in solar_data:
        date = day["date"]
        peak_hours = day["peak_hours"]
        solar_value = day["predicted_solar"]

        day_schedule = {
            "date": date,
            "solar_level": solar_value,
            "peak_hours": peak_hours,
            "recommended_devices": [],
            "avoid_devices": []
        }

        for device in ranked_devices:
            if device["monthly_kwh"] >= 50:
                day_schedule["recommended_devices"].append({
                    "device": device["device"],
                    "use_during": peak_hours,
                    "reason": "High energy — use only during solar peak",
                    "priority": "HIGH"
                })
            elif device["monthly_kwh"] >= 20:
                day_schedule["recommended_devices"].append({
                    "device": device["device"],
                    "use_during": peak_hours[:2],
                    "reason": "Medium energy — use near peak hours",
                    "priority": "MEDIUM"
                })
            else:
                day_schedule["recommended_devices"].append({
                    "device": device["device"],
                    "use_during": ["Anytime"],
                    "reason": "Low energy — no restriction",
                    "priority": "LOW"
                })

        schedule.append(day_schedule)

    print(f"Schedule created for {len(schedule)} days.")
    return schedule

# ─────────────────────────────────────────
# STEP 5: ESTIMATE COST SAVINGS
# ─────────────────────────────────────────

def estimate_savings(devices, schedule):
    print("\nEstimating cost savings...")

    rate_per_kwh = 6.5  # ₹ per kWh (India average)

    total_monthly_kwh = sum(d["monthly_kwh"] for d in devices)
    total_monthly_cost = total_monthly_kwh * rate_per_kwh

    high_solar_days = sum(
        1 for day in schedule if day["solar_level"] > 5
    )
    total_days = len(schedule)
    solar_ratio = high_solar_days / total_days

    saved_kwh = total_monthly_kwh * solar_ratio * 0.6
    saved_cost = saved_kwh * rate_per_kwh
    new_bill = total_monthly_cost - saved_cost

    savings_summary = {
        "total_devices": len(devices),
        "total_monthly_kwh": round(total_monthly_kwh, 2),
        "original_monthly_bill": round(total_monthly_cost, 2),
        "estimated_savings_kwh": round(saved_kwh, 2),
        "estimated_savings_rupees": round(saved_cost, 2),
        "new_estimated_bill": round(new_bill, 2),
        "high_solar_days": high_solar_days,
        "total_days": total_days
    }

    print(f"  Original Bill     : ₹{savings_summary['original_monthly_bill']}")
    print(f"  Estimated Savings : ₹{savings_summary['estimated_savings_rupees']}")
    print(f"  New Bill          : ₹{savings_summary['new_estimated_bill']}")

    return savings_summary

# ─────────────────────────────────────────
# STEP 6: SAVE OUTPUT FOR MEMBER 4
# ─────────────────────────────────────────

def save_output(schedule, savings_summary):
    os.makedirs("output", exist_ok=True)

    with open("output/schedule.json", "w") as f:
        json.dump(schedule[:7], f, indent=2)
    print("\nSchedule saved → output/schedule.json")

    with open("output/savings_summary.json", "w") as f:
        json.dump(savings_summary, f, indent=2)
    print("Savings saved   → output/savings_summary.json")

    print("\nSample Schedule (Day 1):")
    day = schedule[0]
    print(f"  Date        : {day['date']}")
    print(f"  Solar Level : {day['solar_level']} kWh/m²")
    print(f"  Peak Hours  : {day['peak_hours']}")
    print(f"  Top Device  : {day['recommended_devices'][0]['device']}")
    print(f"  Use During  : {day['recommended_devices'][0]['use_during']}")

# ─────────────────────────────────────────
# RUN ALL STEPS
# ─────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 45)
    print("   SOLAR SYNC AI — OPTIMIZATION ENGINE")
    print("=" * 45)

    solar_data  = load_solar_data()
    device_data = load_device_data()
    ranked      = rank_devices(device_data)
    schedule    = match_devices_to_solar(solar_data, ranked)
    savings     = estimate_savings(device_data, schedule)
    save_output(schedule, savings)

    print("\n✅ Member 3 work complete!")
    print("   Share output/schedule.json with Member 4")
    print("   Share output/savings_summary.json with Member 4")