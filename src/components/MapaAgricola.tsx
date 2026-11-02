import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents } from 'react-leaflet';
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

function ManejadorClics({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapaProps {
  posicion: [number, number];
  onSelectPosicion: (nuevaPosicion: [number, number]) => void;
}

export const MapaAgricola = ({ posicion, onSelectPosicion }: MapaProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [inputLat, setInputLat] = useState<string>(posicion[0].toString());
  const [inputLng, setInputLng] = useState<string>(posicion[1].toString());

  useEffect(() => {
    setInputLat(posicion[0].toFixed(6));
    setInputLng(posicion[1].toFixed(6));
  }, [posicion]);

  // 3. useEffect que se dispara cada vez que cambia 'posicion'
  useEffect(() => {
    setLoading(true);
    const [lat, lng] = posicion;

    fetch(`http://127.0.0.1:8000/api/weather?latitude=${lat}&longitude=${lng}`)
      .then((res) => res.json())
      .then((data) => {
        setWeather(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching weather:', err);
        setLoading(false);
      });
  }, [posicion]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);

    if (!isNaN(lat) && !isNaN(lng)) {
      onSelectPosicion([lat, lng]);
    } else {
      alert('Por favor ingresa coordenadas válidas.');
    }
  };

  return (
    <div style={{ height: '50vh', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>

      <form onSubmit={handleBuscar} style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Latitud:</label>
          <input
            type="number"
            step="any"
            value={inputLat}
            onChange={(e) => setInputLat(e.target.value)}
            placeholder="ej. 20.6800"
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', width: '140px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Longitud:</label>
          <input
            type="number"
            step="any"
            value={inputLng}
            onChange={(e) => setInputLng(e.target.value)}
            placeholder="ej. -101.3601"
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', width: '140px' }}
          />
        </div>

        <button
          type="submit"
          style={{
            alignSelf: 'flex-end',
            padding: '9px 18px',
            backgroundColor: '#2e7d32',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            transition: 'background-color 0.2s',
          }}
        >
          Cargar Coordenadas
        </button>
      </form>

      <MapContainer 
        center={CENTRO_AREA} 
        zoom={11} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        /> 

        {/* Escucha los clics del usuario en el mapa */}
        <ManejadorClics onSelect={(lat, lng) => onSelectPosicion([lat, lng])} />

          {/*
          <Polygon 
          positions={LIMITE_AREA_IRAPUATO} 
          pathOptions={{ color: '#2e7d32', fillColor: '#4caf50', fillOpacity: 0.25, weight: 2 }} 
        />
          */}
        

        {/* El marcador se mueve a la posición clickeada */}
        <Marker position={posicion}>
          <Popup>
            <strong>Punto Seleccionado</strong> <br />
            Lat: {posicion[0].toFixed(4)}, Lng: {posicion[1].toFixed(4)} <br />
            <hr />
            {loading ? (
              <em>Consultando datos del punto...</em>
            ) : weather ? (
              <>
                Temp. Aire: {weather.current_temperature} °C <br />
                Temp. Suelo: {weather.current_soil_temp} °C
              </>
            ) : (
              <em>Error al consultar la API</em>
            )}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};