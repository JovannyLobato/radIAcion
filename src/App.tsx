import './App.css'
import {MapaAgricola} from './components/MapaAgricola';
import { GraficaRadiacion } from './components/GraficaRadiacion'; 
function App() {
    
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', width: '100wh'}}>
      
      {/* Contenedor principal*/}
      <main style={{ display: 'grid', gap: '20px' }}>
        {/* Sección del Mapa */}
        <section>
          <MapaAgricola />
          <GraficaRadiacion />
        </section>

      </main>
    </div>
  ); 
}

export default App
