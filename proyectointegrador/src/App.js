// src/App.jsx
import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from './components/Autenticacion/login';
import Registro from './components/Autenticacion/Registro'; // Asegúrate de tener este componente
                // Crea este componente

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
