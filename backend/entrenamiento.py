import os
# Limitar los hilos de TensorFlow
os.environ["TF_NUM_INTRAOP_THREADS"] = "2"
os.environ["TF_NUM_INTEROP_THREADS"] = "2"

import numpy as np
import pandas as pd
import tensorflow as tf
import matplotlib.pyplot as plt  
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Input
from tensorflow.keras.callbacks import EarlyStopping

csv_filename = "dataset_historico_irapuato.csv"
try:
    df = pd.read_csv(csv_filename)
    print(f"Dataset cargado correctamente. Registros totales: {len(df)}")
except FileNotFoundError:
    print(f"No se encontró el archivo '{csv_filename}'. Asegúrate de estar en la carpeta correcta.")
    exit()

variables_objetivo = [
    "direct_radiation",
    "direct_normal_irradiance",
    "direct_radiation_instant"
]

def crear_ventanas(datos, lookback=24):
    X, y = [], []
    for i in range(lookback, len(datos)):
        X.append(datos[i - lookback:i, 0])
        y.append(datos[i, 0])
    return np.array(X), np.array(y)

LOOKBACK = 24
MAX_EPOCHS = 200
BATCH_SIZE = 32

for var in variables_objetivo:
    print(f" Entrenando con Early Stopping para: {var}")
    
    serie_datos = df[var].values.reshape(-1, 1)
    
    scaler = MinMaxScaler(feature_range=(0, 1))
    datos_escalados = scaler.fit_transform(serie_datos)
    
    X, y = crear_ventanas(datos_escalados, LOOKBACK)
    
    split = int(len(X) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]
    
    X_train = np.reshape(X_train, (X_train.shape[0], X_train.shape[1], 1))
    X_test = np.reshape(X_test, (X_test.shape[0], X_test.shape[1], 1))
    
    tf.keras.backend.clear_session()
    
    early_stopping = EarlyStopping(
        monitor='val_loss',
        patience=15,
        restore_best_weights=True,
        verbose=1
    )
    
    model = Sequential([
        Input(shape=(X_train.shape[1], 1)),
        LSTM(50, return_sequences=False),
        Dense(25, activation='relu'),
        Dense(1)
    ])
    
    model.compile(optimizer='adam', loss='mean_squared_error')
    
    history = model.fit(
        X_train, y_train, 
        validation_data=(X_test, y_test), 
        epochs=MAX_EPOCHS, 
        batch_size=BATCH_SIZE, 
        callbacks=[early_stopping], 
        verbose=1
    )
    
    epocas_finales = len(history.history['loss'])
    
    plt.figure(figsize=(10, 5))
    plt.plot(history.history['loss'], label='Pérdida Entrenamiento (Loss)', color='blue', linewidth=2)
    plt.plot(history.history['val_loss'], label='Pérdida Validación (Val Loss)', color='orange', linewidth=2)
    
    mejor_epoca = np.argmin(history.history['val_loss'])
    plt.axvline(x=mejor_epoca, color='red', linestyle='--', label=f'Pesos óptimos (Epoch {mejor_epoca})')
    
    plt.title(f'Curvas de Pérdida del Modelo - Variable: {var}', fontsize=14)
    plt.xlabel('Épocas (Epochs)', fontsize=12)
    plt.ylabel('Pérdida (MSE)', fontsize=12)
    plt.legend(fontsize=11)
    plt.grid(True, linestyle=':', alpha=0.6)
    
    plt.savefig(f"curva_perdida_{var}.png", dpi=300, bbox_inches='tight')
    plt.show()
    
    y_pred_escalado = model.predict(X_test, verbose=0)
    y_test_real = scaler.inverse_transform(y_test.reshape(-1, 1))
    y_pred_real = scaler.inverse_transform(y_pred_escalado)
    
    rmse = np.sqrt(mean_squared_error(y_test_real, y_pred_real))
    mae = mean_absolute_error(y_test_real, y_pred_real)
    
    print(f"\n★ CONFIGURACIÓN ÓPTIMA ENCONTRADA PARA {var}:")
    print(f"   -> Entrenamiento finalizado en la época: {epocas_finales} de {MAX_EPOCHS}")
    print(f"   -> Mejor época guardada: {mejor_epoca}")
    print(f"   -> RMSE Final: {rmse:.2f} W/m²")
    print(f"   -> MAE Final: {mae:.2f} W/m²")
    
    nombre_modelo = f"modelo_{var}.keras"
    model.save(nombre_modelo)
    print(f"   -> ¡Modelo optimizado guardado con éxito como: '{nombre_modelo}'!")

print("\n¡Proceso finalizado! Las imágenes de las curvas se han guardado en tu directorio actual.")

