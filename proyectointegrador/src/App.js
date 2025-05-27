import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Login from './components/Autenticacion/login';
import Registro from './components/Autenticacion/Registro';
import Doctor from './components/Doctor/doctor';  
import Paciente from './components/Paciente/paciente';
import Navbar from './components/Paciente/Navbar';
import NavbarD from './components/Doctor/Navbard';
import Ajuste from './components/Doctor/Ajuste';

function AppContent() {
  const location = useLocation();
  const pathname = location.pathname;

  const showNavbarPaciente = pathname.startsWith("/paciente");
  const showNavbarDoctor = ["/doctor", "/ajustes", "/horarios"].some(path => pathname.startsWith(path));


  return (
    <>
      {showNavbarPaciente && <Navbar />}
      {showNavbarDoctor && <NavbarD />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/doctor" element={<Doctor />} />
        <Route path="/paciente" element={<Paciente />} />
        <Route path="/ajustes" element={<Ajuste />} />
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
