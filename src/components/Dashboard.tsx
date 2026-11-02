import { useState } from 'react';
import { MapaAgricola } from './MapaAgricola';
import { GraficaRadiacion } from './GraficaRadiacion';

const CENTRO_IRAPUATO: [number, number] = [20.680000, -101.360139];

export const Dashboard = () => {
  const [coordenadas, setCoordenadas] = useState<[number, number]>(CENTRO_IRAPUATO);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc', 
      width: '100%',
      margin: 0,
      padding: '20px',
      boxSizing: 'border-box',
      fontFamily: 'system-ui, -apple-system, sans-serif' 
    }}>
      <header style={{ 
        marginBottom: '24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap',
        gap: '12px',
        width: '100%'
      }}>
        <div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          padding: '8px 14px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          fontSize: '13px',
          color: '#334155',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <strong>Ubicación:</strong> {coordenadas[0].toFixed(4)}°, {coordenadas[1].toFixed(4)}°
        </div>
      </header>

      {/* Contenedor Principal: Grid de 2 columnas responsive */}
      <main style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
        gap: '24px', 
        alignItems: 'start',
        width: '100%'
      }}>
        
        {/* Tarjeta del Mapa */}
        <section style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '12px', 
          border: '1px solid #e2e8f0', 
          padding: '20px', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' 
        }}>
          <h2 style={{ fontSize: '16px', margin: '0 0 12px 0', color: '#1e293b' }}>
            Mapas y Ubicación
          </h2>
          <MapaAgricola 
            posicion={coordenadas} 
            onSelectPosicion={(nuevaPos) => setCoordenadas(nuevaPos)} 
          />
        </section>

        {/* Tarjeta de la Gráfica */}
        <section style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '12px', 
          border: '1px solid #e2e8f0', 
          padding: '20px', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' 
        }}>
          <h2 style={{ fontSize: '16px', margin: '0 0 12px 0', color: '#1e293b' }}>
            Análisis de Radiación Solar
          </h2>
          <GraficaRadiacion coordenadas={coordenadas} />
        </section>

      </main>
    </div>
  );
};