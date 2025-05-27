import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Login from './components/Autenticacion/login';
import Registro from './components/Autenticacion/Registro';
import Doctor from './components/Frame/doctor';  
import Paciente from './components/Frame/paciente';
import Navbar from './components/Frame/Navbar';

function AppContent() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/" || location.pathname === "/registro";

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/doctor" element={<Doctor />} />
        <Route path="/paciente" element={<Paciente />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <div className="App">
      <Router>
        <AppContent />
      </Router>
    </div>
  );
}

export default App;
