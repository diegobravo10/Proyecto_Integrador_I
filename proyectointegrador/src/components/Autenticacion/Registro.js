import { useState, useEffect } from "react";
import { db, auth } from "../servicios/firebase.js";
import { doc, setDoc } from "firebase/firestore";

const Registro = () => {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState("");
  const [correo, setCorreo] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [edad, setEdad] = useState("");
  const [uid, setUid] = useState("");
  const [rol, setRol] = useState("paciente");  // Por defecto paciente

  useEffect(() => {
    const storedUid = localStorage.getItem("uid");
    const storedEmail = localStorage.getItem("email");

    if (storedUid && storedEmail) {
      setUid(storedUid);
      setCorreo(storedEmail);
    } else if (auth.currentUser) {
      setUid(auth.currentUser.uid);
      setCorreo(auth.currentUser.email);
    } else {
      alert("No hay usuario autenticado.");
      window.location.href = "/";
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre || !apellido || !cedula || !direccion || !telefono || !edad) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    try {
      await setDoc(doc(db, "users", uid), {
        uid,
        correo,
        nombre,
        apellido,
        cedula,
        direccion,
        telefono,
        edad,
        rol,
      });

      alert("Registro exitoso");
      if (rol === "doctor") {
        window.location.href = "/doctor";
      } else {
        window.location.href = "/paciente";
      }
    } catch (error) {
      console.error("Error al registrar:", error);
      alert("Error al guardar los datos.");
    }
  };

  return (
    <div>
      <h2>Registro de usuario</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Correo electrónico:</label>
          <input type="email" value={correo} disabled />
        </div>
        <div>
          <label>UID:</label>
          <input type="text" value={uid} disabled />
        </div>
        <div>
          <label>Nombres:</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div>
          <label>Apellidos:</label>
          <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} />
        </div>
        <div>
          <label>Cédula:</label>
          <input type="text" value={cedula} onChange={(e) => setCedula(e.target.value)} />
        </div>
        <div>
          <label>Dirección:</label>
          <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </div>
        <div>
          <label>Teléfono:</label>
          <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </div>
        <div>
          <label>Edad:</label>
          <input type="number" value={edad} onChange={(e) => setEdad(e.target.value)} />
        </div>
        {/* Opcional: si quieres permitir elegir rol */}
        {/* <div>
          <label>Rol:</label>
          <select value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="paciente">Paciente</option>
            <option value="doctor">Doctor</option>
          </select>
        </div> */}
        <button type="submit">Registrar</button>
      </form>
    </div>
  );
};

export default Registro;
