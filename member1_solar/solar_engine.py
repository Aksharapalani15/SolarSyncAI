import requests
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from prophet import Prophet
import json
import os

# ─────────────────────────────────────────
# STEP 1: FETCH SOLAR DATA FROM NASA API
# ─────────────────────────────────────────

def get_solar_data(lat, lon):
    print("Fetching solar data from NASA...")
    url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    params = {
        "parameters": "ALLSKY_SFC_SW_DWN",
        "community": "RE",
        "longitude": lon,
        "latitude": lat,
        "start": "20230101",
        "end": "20231231",
        "format": "JSON"
    }
    response = requests.get(url, params=params)
    data = response.json()
    values = data['properties']['parameter']['ALLSKY_SFC_SW_DWN']
    df = pd.DataFrame(list(values.items()), columns=['date', 'solar_radiation'])
    print("Data fetched successfully!")
    return df

# ─────────────────────────────────────────
# STEP 2: CLEAN THE DATA
# ─────────────────────────────────────────

def clean_data(df):
    print("Cleaning data...")
    df['date'] = pd.to_datetime(df['date'], format='%Y%m%d')
    df = df[df['solar_radiation'] > 0]
    df = df.dropna()
    print(f"Clean data ready. Total records: {len(df)}")
    return df

# ─────────────────────────────────────────
# STEP 3: PLOT SOLAR GRAPH
# ─────────────────────────────────────────

def plot_solar(df):
    print("Generating solar graph...")
    plt.figure(figsize=(12, 4))
    plt.plot(df['date'], df['solar_radiation'], color='orange')
    plt.title('Daily Solar Radiation (2023)')
    plt.xlabel('Date')
    plt.ylabel('kWh/m²/day')
    plt.grid(True)
    plt.tight_layout()
    os.makedirs('output', exist_ok=True)
    plt.savefig('output/solar_graph.png')
    plt.show()
    print("Graph saved to output/solar_graph.png")

# ─────────────────────────────────────────
# STEP 4: TRAIN PREDICTION MODEL
# ─────────────────────────────────────────

def train_model(df):
    print("Training prediction model...")
    model_df = df.rename(columns={'date': 'ds', 'solar_radiation': 'y'})
    model = Prophet(daily_seasonality=True)
    model.fit(model_df)
    print("Model trained successfully!")
    return model

# ─────────────────────────────────────────
# STEP 5: PREDICT NEXT 30 DAYS
# ─────────────────────────────────────────

def predict_future(model, days=30):
    print(f"Predicting next {days} days...")
    future = model.make_future_dataframe(periods=days)
    forecast = model.predict(future)
    return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]

# ─────────────────────────────────────────
# STEP 6: FIND PEAK SOLAR HOURS
# ─────────────────────────────────────────

def get_peak_hours(forecast_value):
    if forecast_value > 5:
        peak_hours = ["10AM", "11AM", "12PM", "1PM", "2PM"]
    elif forecast_value > 3:
        peak_hours = ["11AM", "12PM", "1PM"]
    else:
        peak_hours = ["12PM"]
    return peak_hours

# ─────────────────────────────────────────
# STEP 7: FINAL OUTPUT FOR MEMBER 3
# ─────────────────────────────────────────

def solar_output(lat, lon):
    df = get_solar_data(lat, lon)
    df = clean_data(df)
    plot_solar(df)
    model = train_model(df)
    forecast = predict_future(model, days=30)

    results = []
    for _, row in forecast.tail(30).iterrows():
        results.append({
            "date": str(row['ds'].date()),
            "predicted_solar": round(row['yhat'], 2),
            "peak_hours": get_peak_hours(row['yhat'])
        })

    os.makedirs('output', exist_ok=True)
    with open('output/solar_predictions.json', 'w') as f:
        json.dump(results, f, indent=2)

    print("\nDone! Output saved to output/solar_predictions.json")
    print("\nSample Output (first 3 days):")
    for r in results[:3]:
        print(r)

    return results

# ─────────────────────────────────────────
# RUN
# ─────────────────────────────────────────

if __name__ == "__main__":
    # Change to your city coordinates
    # Chennai: 13.08, 80.27
    # Mumbai:  19.07, 72.87
    # Delhi:   28.61, 77.20

    LATITUDE = 13.08
    LONGITUDE = 80.27

    solar_output(LATITUDE, LONGITUDE)