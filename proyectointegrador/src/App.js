import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Layouts
import AdminLayout from './components/Administrador/AdminLayout';
import DoctorLayout from './components/Doctor/DoctorLayout';
import PacienteLayout from './components/Paciente/PacienteLayout';

// Auth
import Login from './components/Autenticacion/login';
import Registro from './components/Autenticacion/Registro';

// Paciente
import Paciente from './components/Paciente/paciente';
import PerfilP from './components/Paciente/Perfil';

// Doctor
import Doctor from './components/Doctor/doctor';  
import Perfil from './components/Doctor/Perfil';
import Horario from './components/Doctor/Horariod';

// Administrador
import Admin from './components/Administrador/Admin';
import Ajustes from './components/Administrador/Ajuste';
import Horarios from './components/Administrador/Horario';
import PerfilD from "./components/Administrador/perfil";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          {/* Auth */}
          <Route path="/" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Paciente con subrutas */}
          <Route path="/paciente" element={<PacienteLayout />}>
            <Route index element={<Paciente />} />
            <Route path="perfil" element={<PerfilP />} />
            {/* Puedes agregar más subrutas si lo deseas */}
          </Route>

          {/* Doctor con subrutas */}
          <Route path="/doctor" element={<DoctorLayout />}>
            <Route index element={<Doctor />} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="horario" element={<Horario />} />
          </Route>

          {/* Admin con subrutas */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Admin />} />
            <Route path="ajustes" element={<Ajustes />} />
            <Route path="horarios" element={<Horarios />} /> 
            <Route path="perfil" element={<PerfilD />} /> 
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
