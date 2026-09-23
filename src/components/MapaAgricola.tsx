import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const CENTRO_AREA: [number, number] = [20.680000, -101.360139];

const LIMITE_AREA_IRAPUATO: [number, number][] = [
  [20.620667, -101.428139],
  [20.739333, -101.428139],
  [20.739333, -101.292139],
  [20.620667, -101.292139],
];

interface WeatherData {
  current_temperature: number;
  current_soil_temp: number;
}

export const MapaAgricola = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/weather')
      .then((res) => res.json())
      .then((data) => setWeather(data))
      .catch((err) => console.error('Error fetching weather:', err));
  }, []);

  return (
    <div style={{ height: '90vh', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer 
        center={CENTRO_AREA} 
        zoom={11} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        /> 

        <Polygon 
          positions={LIMITE_AREA_IRAPUATO} 
          pathOptions={{ color: '#2e7d32', fillColor: '#4caf50', fillOpacity: 0.25, weight: 2 }} 
        />

        <Marker position={CENTRO_AREA}>
          <Popup>
            <strong>Zona Agrícola Irapuato</strong> <br />
            Centro: 20.6800, -101.3601 <br />
            {weather ? (
              <>
                <hr />
                Temp. Aire: {weather.current_temperature} °C <br />
                Temp. Suelo: {weather.current_soil_temp} °C
              </>
            ) : (
              <em>Cargando datos climáticos...</em>
            )}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};