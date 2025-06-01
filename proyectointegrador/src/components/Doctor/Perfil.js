import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, query, collection, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../servicios/firebase";
//import { FaSearch } from "react-icons/fa";
//import { FaPlus } from "react-icons/fa";

import { Timestamp } from "firebase/firestore";



import './Ajuste.css';
const Perfil = () => {
  const [correo, setCorreo] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [cedula, setCedula] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [espid, setEspid] = useState("");
  const [nuevaEspecialidad, setNuevaEspecialidad] = useState("");
  const [docId, setDocId] = useState("");
  const [busquedaCedula, setBusquedaCedula] = useState("");
  const [resultadoBusqueda, setResultadoBusqueda] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState("");


const buscarPorCedula = async () => {
  try {
    const q = query(collection(db, "users"), where("cedula", "==", busquedaCedula));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      alert("No se encontró ningún usuario con esa cédula.");
      setResultadoBusqueda(null);
      return;
    }

    const resultados = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setResultadoBusqueda(resultados[0]); // Asumimos que solo uno tendrá esa cédula

  } catch (error) {
    console.error("Error al buscar:", error);
  }
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
            setCorreo(datos.correo || "");
            setNombre(datos.nombre || "");
            setApellido(datos.apellido || "");
            setCedula(datos.cedula || "");
            setDireccion(datos.direccion || "");
            setTelefono(datos.telefono || "");

            const espe = doc(db, "especialidad", datos.especialidadid);
            const docEspe = await getDoc(espe);
            const datEsp = docEspe.data();

            setEspid(datEsp.nombre || "")

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

    // Convertir fechaNacimiento (string) a Timestamp de Firebase
    const fechaComoTimestamp = fechaNacimiento
    ? Timestamp.fromDate(new Date(fechaNacimiento + "T12:00:00"))  // Añade hora del mediodía
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


  const guardarCambiosAdmin = async () => {
  if (!resultadoBusqueda || !especialidadSeleccionada) {
    alert("Seleccione una especialidad válida.");
    return;
  }

  try {
    const userRef = doc(db, "users", resultadoBusqueda.id);
    await updateDoc(userRef, {
      especialidadid: especialidadSeleccionada,
      rol: "doctor"
    });
    alert("Especialidad y rol actualizados correctamente.");
     setResultadoBusqueda(null);
    setBusquedaCedula("");
    setEspecialidadSeleccionada("");
  } catch (error) {
    console.error("Error al guardar cambios administrativos:", error);
    alert("Ocurrió un error al guardar los cambios.");
  }
};

const agregarEspecialidad = async () => {
  if (!nuevaEspecialidad.trim()) {
    alert("Ingrese un nombre válido para la especialidad.");
    return;
  }

  try {
    await addDoc(collection(db, "especialidad"), {
      nombre: nuevaEspecialidad.trim()
    });
    alert("Especialidad agregada correctamente.");
    setNuevaEspecialidad(""); // Limpiar el input
  } catch (error) {
    console.error("Error al agregar especialidad:", error);
    alert("Ocurrió un error al agregar la especialidad.");
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
                <input type="email" value={correo} disabled/>
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
            <label>Especialidad:</label>
            <input type="text" value={espid} disabled />
        </div>
        <div className="ajuste-form-group">
            <label>Teléfono:</label>
            <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </div>

        <div className="ajuste-form-group">
            <label>Fecha de Nacimiento:</label>
            <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
        </div>
        <button className="ajuste-btn-guardar" onClick={handleGuardar}>
        Guardar Cambios
      </button>
        </div>
    </div>

{/* 
    <div className="ajuste-container">
        <h2 className="admin-title">Cambios Administrativos</h2>
        <p className="instrucciones-admin">
            Ingrese la <strong>cédula</strong> del usuario y seleccione la <strong>especialidad</strong> para asignarlo como <strong>doctor</strong>.
        </p>
        <div className="search-section">
              <input
                className="cedula-input"
                placeholder="Cédula"
                value={busquedaCedula}
                onChange={(e) => setBusquedaCedula(e.target.value)}
              />
              <button className="search-button" onClick={buscarPorCedula}>
                <FaSearch />
                Buscar
              </button>
        </div>

        {resultadoBusqueda && (
            <div className="result-card">
                <h3 className="result-title">Información del Usuario</h3>
                <div className="user-details">
                    <p><strong>Nombre:</strong> {resultadoBusqueda.nombre}</p>
                    <p><strong>Apellido:</strong> {resultadoBusqueda.apellido}</p>
                    <p><strong>Correo:</strong> {resultadoBusqueda.correo}</p>

                </div>

               <div className="action-section">
                    <label htmlFor="change-type" className="select-label">Especialidad:</label>
                    <div>
                    <select
                        id="change-type"
                        className="change-type-select"
                        value={especialidadSeleccionada}
                        onChange={(e) => setEspecialidadSeleccionada(e.target.value)}
                    >
                        <option value="">Seleccione la especialidad</option>
                        {especialidades.map((esp) => (
                        <option key={esp.id} value={esp.id}>
                            {esp.nombre}
                        </option>
                        ))}
                    </select>
                     </div>
                    <button className="save-button" onClick={guardarCambiosAdmin}>
                        Guardar Cambios
                    </button>
                </div>

            </div>
        )}

        </div>

        <div className="ajuste-container">

        <h2> <FaPlus style={{ marginLeft: "8px", color: "#28a745" }} /> Agregar Especialidades </h2>
        <div className="agregar-especialidad">
            <input
                placeholder="Especialidad"
                value={nuevaEspecialidad}
                onChange={(e) => setNuevaEspecialidad(e.target.value)}
            />
            <button onClick={agregarEspecialidad}>Agregar</button>
        </div>


        </div>
        */}
    </>
  );
};

export default Perfil;
