import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Centro geográfico exacto del rectángulo (Promedio de las esquinas)
const CENTRO_AREA: [number, number] = [20.680000, -101.360139];

// Vértices del polígono en orden perimetral (SO -> NO -> NE -> SE)
const LIMITE_PARCELA_IRAPUATO: [number, number][] = [
  [20.620667, -101.428139], // Inferior izquierda (SO)
  [20.739333, -101.428139], // Superior izquierda (NO)
  [20.739333, -101.292139], // Superior derecha (NE)
  [20.620667, -101.292139], // Inferior derecha (SE)
];

export const MapaAgricola = () => {
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
          positions={LIMITE_PARCELA_IRAPUATO} 
          pathOptions={{ color: '#2e7d32', fillColor: '#4caf50', fillOpacity: 0.25, weight: 2 }} 
        />

        <Marker position={CENTRO_AREA}>
          <Popup>
            <strong>Zona Agrícola Irapuato</strong> <br />
            Centro: 20.6800, -101.3601 <br />
            <em>Región delimitada por coordenadas GPS de estudio</em>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};