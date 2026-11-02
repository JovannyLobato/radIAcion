import './App.css';
import { Dashboard } from './components/Dashboard';

function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', width: '100%', margin: 0, padding: 0 }}>
      <main style={{ width: '100%' }}>
        <Dashboard />
      </main>
    </div>
  ); 
}

export default App;