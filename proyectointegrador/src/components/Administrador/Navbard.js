import React from 'react';
import { useEffect, useState } from "react";
import { doc, getDoc} from "firebase/firestore";
import { db } from "../servicios/firebase";
import { Link } from 'react-router-dom';
import '../Paciente/Navbar.css';
const NavbarA = () => {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [docId, setDocId] = useState("");

 useEffect(() => {
    const storedId = localStorage.getItem("uid");
    if (storedId) {
      setDocId(storedId);
      const cargarDatos = async () => {
        try {
          const userRef = doc(db, "users", storedId);
          const docSnap = await getDoc(userRef);
         
          if (docSnap.exists()) {
            const datos = docSnap.data();
            setNombre(datos.nombre || "");
            setApellido(datos.apellido || "");


          } else {
            console.warn("No se encontró el usuario");
          }
        } catch (error) {
          console.error("Error al obtener datos:", error);
        }
      };

      cargarDatos();
    }
  }, []);

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
      👤 <span> {nombre.split(" ")[0]} {apellido.split(" ")[0]} </span>
    </div>

  </div>
</nav>

  );
};

export default NavbarA;
