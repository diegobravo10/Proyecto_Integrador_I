import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../servicios/firebase";
import { Timestamp } from "firebase/firestore";

import './Ajuste.css';
const PerfilD = () => {
  const [correo, setCorreo] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [docId, setDocId] = useState("");
  const [especialidades, setEspecialidades] = useState([]);


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

            console.log("fechaNacimiento recuperada:", datos.fechaNacimiento);

            if (datos.fechaNacimiento && datos.fechaNacimiento.toDate) {
                    const fecha = datos.fechaNacimiento.toDate();
                    const yyyy = fecha.getFullYear();
                    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
                    const dd = String(fecha.getDate()).padStart(2, '0');
                    setFechaNacimiento(`${yyyy}-${mm}-${dd}`);
            } else {
                    setFechaNacimiento("");
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


useEffect(() => {
  const obtenerEspecialidades = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "especialidad"));
      const lista = querySnapshot.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre
      }));
      setEspecialidades(lista);
    } catch (error) {
      console.error("Error al obtener especialidades:", error);
    }
  };

  obtenerEspecialidades();
}, []);


const handleGuardar = async () => {
  if (!docId) return;

  try {
    const userRef = doc(db, "users", docId);

    const fechaComoTimestamp = fechaNacimiento
    ? Timestamp.fromDate(new Date(fechaNacimiento + "T12:00:00"))  
    : null;


    await updateDoc(userRef, {
      nombre,
      apellido,
      cedula,
      direccion,
      telefono,
      fechaNacimiento: fechaComoTimestamp,
    });

    alert("Datos actualizados correctamente");
  } catch (error) {
    console.error("Error al guardar:", error);
    alert("Ocurrió un error al guardar los cambios.");
  }
};







  return (
    <>
     <div className="ajuste-container">
        
        <div>
        <h2>Datos Personales</h2>

       <div className="ajuste-form-group-row">
            <div className="ajuste-form-left">
                <label>Correo electrónico:</label>
                <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)}/>
            </div>
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
            <label>Fecha de Nacimiento:</label>
            <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
        </div>
        <div className="ajuste-form-right">
                <button className="ajuste-btn-guardar" onClick={handleGuardar}>
                Guardar Cambios
                </button>
        </div>
        </div>
    </div>
    </>
  );
};

export default PerfilD;
