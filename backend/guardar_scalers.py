import pandas as pd
import joblib
from sklearn.preprocessing import MinMaxScaler

df = pd.read_csv("dataset_historico_irapuato.csv")

variables = [
    "direct_radiation",
    "direct_normal_irradiance",
    "direct_radiation_instant"
]

for var in variables:
    datos = df[var].values.reshape(-1, 1)

    scaler = MinMaxScaler(feature_range=(0, 1))
    scaler.fit_transform(datos)

    nombre = f"scaler_{var}.pkl"
    joblib.dump(scaler, nombre)

    print(f"Escalador guardado: {nombre}")

print("Todos los escaladores se guardaron correctamente.")
