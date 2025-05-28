import { Outlet } from "react-router-dom";
import NavbarD from "../Doctor/Navbard";

const DoctorLayout = () => (
  <>
    <NavbarD />
    <Outlet />
  </>
);

export default DoctorLayout;
