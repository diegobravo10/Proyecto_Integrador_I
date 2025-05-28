import { useState, useEffect } from "react";
import { collection, getDocs, query, where, updateDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../servicios/firebase.js";

const Admin = () => {
  const [especialidades, setEspecialidades] = useState([]);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState("");
  
  const [doctores, setDoctores] = useState([]);
  const [doctorSeleccionado, setDoctorSeleccionado] = useState("");

  const [citas, setCitas] = useState([]);

  // Datos relacionados para mostrar nombres y horarios
  const [pacientesMap, setPacientesMap] = useState({});
  const [horariosMap, setHorariosMap] = useState({});

  const [editandoCitaId, setEditandoCitaId] = useState(null);
  const [descripcionEdit, setDescripcionEdit] = useState("");
  const [fechaEdit, setFechaEdit] = useState("");
  
  // Estados para validaciones
  const [cargandoValidacion, setCargandoValidacion] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState("");

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
  

  // Función helper para convertir Timestamp a string
  const formatearFecha = (timestamp) => {
    if (!timestamp) return "";
    
    // Si ya es un string, devolverlo tal como está
    if (typeof timestamp === 'string') return timestamp;
    
    // Si es un Timestamp de Firebase
    if (timestamp && timestamp.seconds) {
      const fecha = new Date(timestamp.seconds * 1000);
      return fecha.toLocaleDateString('es-ES');
    }
    
    // Si es un objeto Date
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString('es-ES');
    }
    
    return "";
  };

  // Función helper para convertir Timestamp a formato YYYY-MM-DD para input date
  const timestampToDateInput = (timestamp) => {
    if (!timestamp) return "";
    
    if (typeof timestamp === 'string') return timestamp;
    
    if (timestamp && timestamp.seconds) {
      const fecha = new Date(timestamp.seconds * 1000);
      return fecha.toISOString().split('T')[0];
    }
    
    if (timestamp instanceof Date) {
      return timestamp.toISOString().split('T')[0];
    }
    
    return "";
  };

  // 1. Cargar especialidades
  useEffect(() => {
    const cargarEspecialidades = async () => {
      const snapshot = await getDocs(collection(db, "especialidad"));
      setEspecialidades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    cargarEspecialidades();
  }, []);

  // 2. Cuando cambia especialidad, cargar doctores
  useEffect(() => {
    if (!especialidadSeleccionada) {
      setDoctores([]);
      setDoctorSeleccionado("");
      return;
    }
    const cargarDoctores = async () => {
      const q = query(collection(db, "users"), where("especialidadid", "==", especialidadSeleccionada));
      const snapshot = await getDocs(q);
      setDoctores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setDoctorSeleccionado(""); 
      setCitas([]);
      setPacientesMap({});
      setHorariosMap({});
    };
    cargarDoctores();
  }, [especialidadSeleccionada]);

  // 3. Cuando cambia doctor, cargar citas + datos pacientes y horarios
  useEffect(() => {
    if (!doctorSeleccionado) {
      setCitas([]);
      setPacientesMap({});
      setHorariosMap({});
      return;
    }
    const cargarCitasConDatos = async () => {
      const q = query(collection(db, "citasmedicas"), where("doctorid", "==", doctorSeleccionado));
      const snapshot = await getDocs(q);
      const citasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCitas(citasData);

      // Extraer ids únicos pacientes y horarios
      const pacienteIds = [...new Set(citasData.map(c => c.pacienteid))];
      const horarioIds = [...new Set(citasData.map(c => c.horarioid))];

      // Cargar pacientes
      const pacientesPromises = pacienteIds.map(id => getDoc(doc(db, "users", id)));
      const pacientesDocs = await Promise.all(pacientesPromises);
      const pacientes = {};
      pacientesDocs.forEach(docSnap => {
        if (docSnap.exists()) {
          pacientes[docSnap.id] = docSnap.data();
        }
      });
      setPacientesMap(pacientes);

      // Cargar horarios
      const horariosPromises = horarioIds.map(id => getDoc(doc(db, "horarios", id)));
      const horariosDocs = await Promise.all(horariosPromises);
      const horarios = {};
      horariosDocs.forEach(docSnap => {
        if (docSnap.exists()) {
          horarios[docSnap.id] = docSnap.data();
        }
      });
      setHorariosMap(horarios);
    };
    cargarCitasConDatos();
  }, [doctorSeleccionado]);

  // Actualizar estado de cita
  const actualizarEstadoCita = async (idCita, nuevoEstado) => {
    const citaRef = doc(db, "citasmedicas", idCita);
    await updateDoc(citaRef, { estado: nuevoEstado });
    setCitas(citas.map(c => c.id === idCita ? { ...c, estado: nuevoEstado } : c));
  };

  // Validar disponibilidad de horario
  const validarDisponibilidadHorario = async (doctorId, nuevaFecha, horarioIdActual) => {
    try {
      setCargandoValidacion(true);
      
      // Buscar horarios del doctor en la misma fecha
      const horariosQuery = query(
        collection(db, "horarios"), 
        where("doctorid", "==", doctorId),
        where("fecha", "==", nuevaFecha)
      );
      
      const horariosSnapshot = await getDocs(horariosQuery);
      
      // Si encuentra horarios en esa fecha
      if (!horariosSnapshot.empty) {
        // Verificar si alguno está ocupado (excluyendo el horario actual)
        const horariosOcupados = horariosSnapshot.docs.filter(docSnap => {
          const horario = docSnap.data();
          return docSnap.id !== horarioIdActual && horario.estado === "ocupado";
        });
        
        if (horariosOcupados.length > 0) {
          return { disponible: false, mensaje: "El doctor ya tiene una cita programada en esa fecha" };
        }
      }
      
      return { disponible: true, mensaje: "" };
    } catch (error) {
      console.error("Error al validar disponibilidad:", error);
      return { disponible: false, mensaje: "Error al validar disponibilidad" };
    } finally {
      setCargandoValidacion(false);
    }
  };

  // Guardar edición de cita
  const guardarEdicion = async (idCita) => {
    try {
      setErrorValidacion("");
      const citaActual = citas.find(c => c.id === idCita);
      const horarioActual = horariosMap[citaActual.horarioid];
      
      // Si la fecha cambió, validar disponibilidad
      if (fechaEdit && timestampToDateInput(horarioActual?.fecha) !== fechaEdit) {
        const validacion = await validarDisponibilidadHorario(
          doctorSeleccionado, 
          fechaEdit, 
          citaActual.horarioid
        );
        
        if (!validacion.disponible) {
          setErrorValidacion(validacion.mensaje);
          return;
        }
        
        // Actualizar la fecha en la colección de horarios
        const horarioRef = doc(db, "horarios", citaActual.horarioid);
        await updateDoc(horarioRef, { fecha: fechaEdit });
        
        // Actualizar el estado local de horarios
        setHorariosMap(prev => ({
          ...prev,
          [citaActual.horarioid]: {
            ...prev[citaActual.horarioid],
            fecha: fechaEdit
          }
        }));
      }
      
      // Actualizar la cita médica
      const citaRef = doc(db, "citasmedicas", idCita);
      await updateDoc(citaRef, { descripcion: descripcionEdit });
      
      // Actualizar estado local
      setCitas(citas.map(c => c.id === idCita ? { 
        ...c, 
        descripcion: descripcionEdit 
      } : c));
      
      setEditandoCitaId(null);
      alert("Cita actualizada correctamente");
      
    } catch (error) {
      console.error("Error al guardar edición:", error);
      setErrorValidacion("Error al actualizar la cita");
    }
  };

  return (
    <div>
      <h1>Hola {nombre.split(" ")[0]} {apellido.split(" ")[0]} </h1>

      <label>Especialidad:</label>
      <select
        value={especialidadSeleccionada}
        onChange={e => setEspecialidadSeleccionada(e.target.value)}
      >
        <option value="">-- Seleccione especialidad --</option>
        {especialidades.map(e => (
          <option key={e.id} value={e.id}>{e.nombre}</option>
        ))}
      </select>

      <label>Doctor:</label>
      <select
        value={doctorSeleccionado}
        onChange={e => setDoctorSeleccionado(e.target.value)}
        disabled={!especialidadSeleccionada}
      >
        <option value="">-- Seleccione doctor --</option>
        {doctores.map(d => (
          <option key={d.id} value={d.id}>{d.nombre} {d.apellido}</option>
        ))}
      </select>

      <table>
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Fecha</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {citas.map(cita => {
            const paciente = pacientesMap[cita.pacienteid];
            const horario = horariosMap[cita.horarioid];

            return (
              <tr key={cita.id}>
                <td>{paciente ? `${paciente.nombre} ${paciente.apellido}` : cita.pacienteid}</td>
                <td>
                  {editandoCitaId === cita.id ? (
                    <div>
                      <input 
                        type="date" 
                        value={fechaEdit} 
                        onChange={e => {
                          setFechaEdit(e.target.value);
                          setErrorValidacion(""); // Limpiar error al cambiar fecha
                        }}
                      />
                      {errorValidacion && (
                        <div style={{color: 'red', fontSize: '12px', marginTop: '4px'}}>
                          {errorValidacion}
                        </div>
                      )}
                    </div>
                  ) : (
                    horario ? (
                      formatearFecha(horario.fecha) || 
                      formatearFecha(horario.hora) || 
                      "Sin horario"
                    ) : "Sin horario"
                  )}
                </td>
                <td>
                  {editandoCitaId === cita.id ? (
                    <input
                      type="text"
                      value={descripcionEdit}
                      onChange={e => setDescripcionEdit(e.target.value)}
                    />
                  ) : (
                    cita.descripcion
                  )}
                </td>
                <td>{cita.estado}</td>
                <td>
                  {editandoCitaId === cita.id ? (
                    <>
                      <button 
                        onClick={() => guardarEdicion(cita.id)}
                        disabled={cargandoValidacion}
                      >
                        {cargandoValidacion ? "Validando..." : "Guardar"}
                      </button>
                      <button 
                        onClick={() => {
                          setEditandoCitaId(null);
                          setErrorValidacion("");
                        }}
                        disabled={cargandoValidacion}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => {
                        setEditandoCitaId(cita.id);
                        setDescripcionEdit(cita.descripcion);
                        setFechaEdit(horario ? timestampToDateInput(horario.fecha) : "");
                        setErrorValidacion("");
                      }}>Modificar</button>

                      <button onClick={() => actualizarEstadoCita(cita.id, "confirmado")}>Confirmar</button>
                      <button onClick={() => actualizarEstadoCita(cita.id, "rechazado")}>Rechazar</button>
                    </>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Admin;