import os

os.environ["TF_NUM_INTRAOP_THREADS"] = "2"
os.environ["TF_NUM_INTEROP_THREADS"] = "2"

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from pathlib import Path

import numpy as np
import pandas as pd
import requests_cache
import openmeteo_requests
import joblib

from retry_requests import retry
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tensorflow.keras.models import load_model


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
ZONA_HORARIA = ZoneInfo("America/Mexico_City")

# Cargar modelos una sola vez al iniciar la API
modelos = {
    "direct_normal_irradiance": load_model(
        BASE_DIR / "modelo_direct_normal_irradiance.keras",
        compile=False
    ),
    "direct_radiation_instant": load_model(
        BASE_DIR / "modelo_direct_radiation_instant.keras",
        compile=False
    ),
    "direct_radiation": load_model(
        BASE_DIR / "modelo_direct_radiation.keras",
        compile=False
    ),
}

# Cargar los escaladores del entrenamiento
escaladores = {
    "direct_normal_irradiance": joblib.load(
        BASE_DIR / "scaler_direct_normal_irradiance.pkl"
    ),
    "direct_radiation_instant": joblib.load(
        BASE_DIR / "scaler_direct_radiation_instant.pkl"
    ),
    "direct_radiation": joblib.load(
        BASE_DIR / "scaler_direct_radiation.pkl"
    ),
}


def predecir_siguiente_dia(datos, modelo, scaler):
    """
    Recibe una serie histórica y devuelve 24 predicciones horarias.
    El modelo recibe las últimas 24 horas y predice un valor por paso.
    """

    datos = np.asarray(datos, dtype=np.float32).reshape(-1, 1)

    if len(datos) < 24:
        raise ValueError(
            "Se necesitan al menos 24 valores históricos."
        )

    if not np.isfinite(datos[-24:]).all():
        raise ValueError(
            "Los últimos 24 valores contienen datos faltantes."
        )

    # Normalizar usando el escalador original del entrenamiento
    ventana = scaler.transform(datos[-24:]).reshape(24)

    predicciones = []

    for _ in range(24):
        entrada = ventana.reshape(1, 24, 1)

        # Predicción normalizada de la siguiente hora
        prediccion_escalada = float(
            modelo.predict(entrada, verbose=0)[0, 0]
        )

        # Regresar a las unidades originales
        prediccion_real = float(
            scaler.inverse_transform(
                np.array([[prediccion_escalada]])
            )[0, 0]
        )

        predicciones.append(prediccion_real)

        # Desplazar la ventana y agregar el nuevo valor predicho
        ventana = np.append(
            ventana[1:],
            prediccion_escalada
        )

    return predicciones


@app.get("/api/radiacion")
def get_radiacion(
    latitude: float = 20.6742,
    longitude: float = -101.3475
):
    # Configurar Open-Meteo
    cache_session = requests_cache.CachedSession(
        str(BASE_DIR / ".cache"),
        expire_after=3600
    )

    retry_session = retry(
        cache_session,
        retries=5,
        backoff_factor=0.2
    )

    openmeteo = openmeteo_requests.Client(
        session=retry_session
    )

    # Últimos siete días completos, hasta ayer
    hoy = datetime.now(ZONA_HORARIA).date()
    fecha_final = hoy - timedelta(days=1)
    fecha_inicial = fecha_final - timedelta(days=6)

    url = "https://archive-api.open-meteo.com/v1/archive"

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": [
            "direct_normal_irradiance",
            "direct_radiation",
            "direct_radiation_instant"
        ],
        "start_date": fecha_inicial.isoformat(),
        "end_date": fecha_final.isoformat(),
        "timezone": "America/Mexico_City"
    }

    responses = openmeteo.weather_api(url, params=params)
    response = responses[0]
    hourly = response.Hourly()

    # Generar las fechas históricas en la zona horaria solicitada
    fechas_datetime = pd.date_range(
        start=pd.to_datetime(hourly.Time(), unit="s", utc=True),
        end=pd.to_datetime(hourly.TimeEnd(), unit="s", utc=True),
        freq=pd.Timedelta(seconds=hourly.Interval()),
        inclusive="left"
    )

    fechas_datetime = fechas_datetime.tz_convert(
        "America/Mexico_City"
    )

    fechas = fechas_datetime.strftime(
        "%Y-%m-%d %H:%M"
    ).tolist()

    # Obtener las series históricas en el mismo orden solicitado
    irradiancia_normal = hourly.Variables(0).ValuesAsNumpy()
    radiacion_directa = hourly.Variables(1).ValuesAsNumpy()
    radiacion_instantanea = hourly.Variables(2).ValuesAsNumpy()

    series = {
        "direct_normal_irradiance": irradiancia_normal,
        "direct_radiation": radiacion_directa,
        "direct_radiation_instant": radiacion_instantanea,
    }

    # Predecir las siguientes 24 horas para cada variable
    predicciones = {}

    for variable, datos in series.items():
        predicciones[variable] = predecir_siguiente_dia(
            datos=datos,
            modelo=modelos[variable],
            scaler=escaladores[variable]
        )

    # Crear las fechas correspondientes a las predicciones
    ultima_fecha = fechas_datetime[-1]
    inicio_prediccion = ultima_fecha + pd.Timedelta(hours=1)

    fechas_prediccion = pd.date_range(
        start=inicio_prediccion,
        periods=24,
        freq="h"
    ).strftime("%Y-%m-%d %H:%M").tolist()

    return {
        "fecha_inicial": fecha_inicial.isoformat(),
        "fecha_final": fecha_final.isoformat(),
        "fechas": fechas,

        "direct_normal_irradiance": irradiancia_normal.tolist(),
        "direct_radiation": radiacion_directa.tolist(),
        "direct_radiation_instant": radiacion_instantanea.tolist(),

        "fechas_prediccion": fechas_prediccion,
        "predicciones": predicciones
    }