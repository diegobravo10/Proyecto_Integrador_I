import { Outlet } from "react-router-dom";
import NavbarA from "../Administrador/Navbard";

const AdminLayout = () => (
  <>
    <NavbarA />
    <Outlet />
  </>
);

export default AdminLayout;
