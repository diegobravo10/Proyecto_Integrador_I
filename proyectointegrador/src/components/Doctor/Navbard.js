import React from 'react';
import { getAuth, signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc} from "firebase/firestore";
import { db } from "../servicios/firebase";
import '../Paciente/Navbar.css';
const NavbarD = () => {

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [docId, setDocId] = useState("");
  const auth = getAuth();
  const navigate = useNavigate();

  // Función para cerrar sesión
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigate("/"); // Asegúrate de que esta ruta exista
      })
      .catch((error) => {
        console.error("Error al cerrar sesión:", error);
      });
  };

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
        <li><Link to="/doctor">Citas</Link></li>
        <li><Link to="/doctor/horario">Horarios</Link></li>
        <li><Link to="/doctor/perfil">Perfil</Link></li>

        <li>
              <button onClick={handleLogout} className="logout-button">
                Salir
              </button>
            </li>
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

export default NavbarD;
