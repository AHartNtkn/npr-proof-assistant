import { ModeSwitcher } from './components/ModeSwitcher';
import { GraphCanvas } from './components/GraphCanvas';
import './App.css';

function App() {
  return (
    <div className="app">
      <ModeSwitcher />
      <GraphCanvas />
    </div>
  );
}

export default App
