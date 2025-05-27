import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">MedCitas</div>
      <ul className="navbar-links">
        <li><Link to="/paciente">Agendar</Link></li>
        <li><Link to="/perfil">Perfil</Link></li>
        <li><Link to="/">Salir</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
