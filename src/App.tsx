import './App.css'
import {MapaAgricola} from './components/MapaAgricola';
function App() {
    
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', width: '100wh'}}>
      
      {/* Contenedor principal en formato Dashboard */}
      <main style={{ display: 'grid', gap: '20px' }}>
        {/* Sección del Mapa */}
        <section>
          <h2>Mapa de la Región de Estudio</h2>
          <MapaAgricola />
        </section>

      </main>
    </div>
  ); 
}

export default App
