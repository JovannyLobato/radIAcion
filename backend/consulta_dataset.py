import openmeteo_requests
import pandas as pd
import numpy as np
import requests_cache
from retry_requests import retry

# Setup the Open-Meteo API client with cache and retry on error
cache_session = requests_cache.CachedSession('.cache', expire_after=-1)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)

# Endpoint de archivo histórico con tus coordenadas de Irapuato, GTO
url = "https://archive-api.open-meteo.com/v1/archive"
params = {
    "latitude": 20.6742,
    "longitude": -101.3475,
    "start_date": "2025-01-01",
    "end_date": "2026-10-10",
    "hourly": ["direct_radiation", "direct_normal_irradiance", "direct_radiation_instant"],
}

responses = openmeteo.weather_api(url, params=params)

# Process first location
response = responses[0]
print(f"Coordinates: {response.Latitude()}°N {response.Longitude()}°E")
print(f"Elevation: {response.Elevation()} m asl")
print(f"Timezone difference to GMT+0: {response.UtcOffsetSeconds()}s")

# Process hourly data y limpiar valores NaN (reemplazándolos por 0.0 para las horas nocturnas)
hourly = response.Hourly()
hourly_direct_radiation = np.nan_to_num(hourly.Variables(0).ValuesAsNumpy(), nan=0.0)
hourly_direct_normal_irradiance = np.nan_to_num(hourly.Variables(1).ValuesAsNumpy(), nan=0.0)
hourly_direct_radiation_instant = np.nan_to_num(hourly.Variables(2).ValuesAsNumpy(), nan=0.0)

hourly_data = {
    "date": pd.date_range(
        start=pd.to_datetime(hourly.Time(), unit="s", utc=True),
        end=pd.to_datetime(hourly.TimeEnd(), unit="s", utc=True),
        freq=pd.Timedelta(seconds=hourly.Interval()),
        inclusive="left"
    ),
    "direct_radiation": hourly_direct_radiation,
    "direct_normal_irradiance": hourly_direct_normal_irradiance,
    "direct_radiation_instant": hourly_direct_radiation_instant
}

# Crear el DataFrame y exportar a CSV para el entrenamiento de la IA
hourly_dataframe = pd.DataFrame(data=hourly_data)
csv_filename = "dataset_historico_irapuato.csv"
hourly_dataframe.to_csv(csv_filename, index=False)

print(f"\n¡Dataset histórico generado con éxito! Total de registros: {len(hourly_dataframe)}")
print(f"Guardado en: {csv_filename}")
print("\nVista previa:\n", hourly_dataframe.head())