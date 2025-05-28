import { Outlet } from "react-router-dom";
import Navbar from "../Paciente/Navbar";

const PacienteLayout = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

export default PacienteLayout;
