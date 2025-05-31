import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../servicios/firebase";
import { Timestamp } from "firebase/firestore";
import './Ajuste.css';

const Perfil = () => {
  const [docId, setDocId] = useState("");
  const [correo, setCorreo] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");

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
            setCorreo(datos.correo || "");
            setNombre(datos.nombre || "");
            setApellido(datos.apellido || "");
            setCedula(datos.cedula || "");
            setDireccion(datos.direccion || "");
            setTelefono(datos.telefono || "");

            if (datos.fechaNacimiento && datos.fechaNacimiento.toDate) {
              const fecha = datos.fechaNacimiento.toDate();
              const yyyy = fecha.getFullYear();
              const mm = String(fecha.getMonth() + 1).padStart(2, '0');
              const dd = String(fecha.getDate()).padStart(2, '0');
              setFechaNacimiento(`${yyyy}-${mm}-${dd}`);
            }
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

  const handleGuardar = async () => {
    if (!docId) return;

    try {
      const fechaComoTimestamp = fechaNacimiento
        ? Timestamp.fromDate(new Date(fechaNacimiento + "T12:00:00"))
        : null;

      await updateDoc(doc(db, "users", docId), {
        nombre,
        apellido,
        cedula,
        direccion,
        telefono,
        fechaNacimiento: fechaComoTimestamp,
      });

      alert("Datos actualizados correctamente.");
    } catch (error) {
      console.error("Error al actualizar datos:", error);
      alert("Error al guardar los cambios.");
    }
  };

  return (
    <div className="ajuste-container">
      <h2>Perfil del Paciente</h2>
      <div className="ajuste-form-group">
        <label>Correo electrónico:</label>
        <input type="email" value={correo} disabled />
      </div>
      <div className="ajuste-form-group">
        <label>Nombres:</label>
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div className="ajuste-form-group">
        <label>Apellidos:</label>
        <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} />
      </div>
      <div className="ajuste-form-group">
        <label>Cédula:</label>
        <input type="text" value={cedula} onChange={(e) => setCedula(e.target.value)} />
      </div>
      <div className="ajuste-form-group">
        <label>Dirección:</label>
        <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
      </div>
      <div className="ajuste-form-group">
        <label>Teléfono:</label>
        <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
      </div>
      <div className="ajuste-form-group">
        <label>Fecha de nacimiento:</label>
        <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
      </div>
      <button className="ajuste-btn-guardar" onClick={handleGuardar}>
        Guardar Cambios
      </button>
    </div>
  );
};

export default Perfil;
