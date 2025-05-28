import React from 'react';
import { Link } from 'react-router-dom';
import '../Paciente/Navbar.css';
const NavbarA = () => {
  return (
    <nav className="navbar">
  <div className="navbar-logo">MedCitas</div>

  <div className="navbar-content">

    <div className="navbar-left">
      <ul className="navbar-links">
        <li><Link to="/admin">Citas</Link></li>
        <li><Link to="/admin/horarios">Horarios</Link></li>
        <li><Link to="/admin/ajustes">Ajustes</Link></li>
        <li><Link to="/admin/perfil" >Perfil</Link></li>
        <li><Link to="/">Salir</Link></li>
      </ul>
      <div className="navbar-divider" />
    </div>

    <div className="navbar-user">
      👤 Diego Bravo
    </div>
  </div>
</nav>

  );
};

export default NavbarA;
