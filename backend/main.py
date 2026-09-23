from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import openmeteo_requests
import pandas as pd
import requests_cache
from retry_requests import retry

app = FastAPI()

# Permitir conexiones desde el frontend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/radiacion")
def get_radiacion():
    cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
    retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
    openmeteo = openmeteo_requests.Client(session=retry_session)

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": 20.6742,
        "longitude": -101.3475,
        "hourly": ["direct_normal_irradiance", "direct_radiation", "direct_radiation_instant"],
    }
    
    responses = openmeteo.weather_api(url, params=params)
    response = responses[0]

    hourly = response.Hourly()
    
    # Generar fechas en formato de cadena (string) para JSON
    times = pd.date_range(
        start=pd.to_datetime(hourly.Time(), unit="s", utc=True),
        end=pd.to_datetime(hourly.TimeEnd(), unit="s", utc=True),
        freq=pd.Timedelta(seconds=hourly.Interval()),
        inclusive="left"
    ).strftime('%Y-%m-%d %H:%M').tolist()
    
    return {
        "fechas": times,
        "direct_normal_irradiance": hourly.Variables(0).ValuesAsNumpy().tolist(),
        "direct_radiation": hourly.Variables(1).ValuesAsNumpy().tolist(),
        "direct_radiation_instant": hourly.Variables(2).ValuesAsNumpy().tolist(),
    }

