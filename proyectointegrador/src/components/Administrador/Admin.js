import { useState, useEffect } from "react";
import { collection, getDocs, query, where, updateDoc, doc, getDoc, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "../servicios/firebase.js";

import './doctor.css'

const Admin = () => {
  const [especialidades, setEspecialidades] = useState([]);
  const [citas, setCitas] = useState([]);

  // Datos relacionados para mostrar nombres, especialidades y horarios
  const [pacientesMap, setPacientesMap] = useState({});
  const [horariosMap, setHorariosMap] = useState({});
  const [doctoresMap, setDoctoresMap] = useState({});
  const [especialidadesMap, setEspecialidadesMap] = useState({});

  const [editandoCitaId, setEditandoCitaId] = useState(null);
  const [descripcionEdit, setDescripcionEdit] = useState("");
  const [fechaHoraEdit, setFechaHoraEdit] = useState("");

  // Estados para validaciones
  const [cargandoValidacion, setCargandoValidacion] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState("");

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [docId, setDocId] = useState("");

  const [doctores, setDoctores] = useState([]);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState("");
  const [doctorSeleccionado, setDoctorSeleccionado] = useState("");

  // Cargar datos del usuario logeado
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

  // Función helper para convertir Timestamp a string (Fecha y Hora)
  const formatearFecha = (timestamp) => {
    if (!timestamp) return "";

    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    if (timestamp && timestamp.seconds) {
      const fecha = new Date(timestamp.seconds * 1000);
      return fecha.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    if (timestamp instanceof Date) {
      return timestamp.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return "";
  };

  // Función helper para convertir Timestamp a formato YYYY-MM-DDTHH:MM para input datetime-local
  const timestampToDateTimeInput = (timestamp) => {
    if (!timestamp) return "";

    let date;
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return "";
    }

    if (isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Cargar todas las especialidades
  useEffect(() => {
    const cargarEspecialidades = async () => {
      const snapshot = await getDocs(collection(db, "especialidad"));
      const especialidadesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEspecialidades(especialidadesData);
      
      // Crear mapa de especialidades para búsqueda rápida
      const especialidadesMap = {};
      especialidadesData.forEach(esp => {
        especialidadesMap[esp.id] = esp;
      });
      setEspecialidadesMap(especialidadesMap);
    };
    cargarEspecialidades();
  }, []);

  // Cargar todos los doctores
  useEffect(() => {
    const cargarDoctores = async () => {
      const q = query(collection(db, "users"), where("rol", "==", "doctor"));
      const snapshot = await getDocs(q);
      const doctoresData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDoctores(doctoresData);
    };
    cargarDoctores();
  }, []);

  // Cargar pacientes (rol: pacient)
  useEffect(() => {
    const cargarPacientes = async () => {
      const q = query(collection(db, "users"), where("rol", "==", "pacient"));
      const snapshot = await getDocs(q);
      const pacientesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Crear mapa de pacientes para búsqueda rápida
      const pacientesMap = {};
      pacientesData.forEach(paciente => {
        pacientesMap[paciente.id] = paciente;
      });
      setPacientesMap(pacientesMap);
    };
    cargarPacientes();
  }, []);

  // Cargar todas las citas con sus datos relacionados
  useEffect(() => {
    const cargarTodasLasCitas = async () => {
      try {
        // Cargar todas las citas
        const citasSnapshot = await getDocs(collection(db, "citasmedicas"));
        const citasData = citasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCitas(citasData);

        // Extraer ids únicos
        const pacienteIds = [...new Set(citasData.map(c => c.pacienteid))];
        const horarioIds = [...new Set(citasData.map(c => c.horarioid))];
        const doctorIds = [...new Set(citasData.map(c => c.doctorid))];

        // Cargar pacientes (optimizado - solo los necesarios)
        if (pacienteIds.length > 0) {
          const pacientesPromises = pacienteIds.map(id => getDoc(doc(db, "users", id)));
          const pacientesDocs = await Promise.all(pacientesPromises);
          const pacientesMapTemp = {};
          pacientesDocs.forEach(docSnap => {
            if (docSnap.exists()) {
              pacientesMapTemp[docSnap.id] = docSnap.data();
            }
          });
          // Combinar con pacientes ya cargados
          setPacientesMap(prev => ({ ...prev, ...pacientesMapTemp }));
        }

        // Cargar horarios
        if (horarioIds.length > 0) {
          const horariosPromises = horarioIds.map(id => getDoc(doc(db, "horarios", id)));
          const horariosDocs = await Promise.all(horariosPromises);
          const horariosMap = {};
          horariosDocs.forEach(docSnap => {
            if (docSnap.exists()) {
              horariosMap[docSnap.id] = docSnap.data();
            }
          });
          setHorariosMap(horariosMap);
        }

        // Cargar doctores
        if (doctorIds.length > 0) {
          const doctoresPromises = doctorIds.map(id => getDoc(doc(db, "users", id)));
          const doctoresDocs = await Promise.all(doctoresPromises);
          const doctoresMap = {};
          doctoresDocs.forEach(docSnap => {
            if (docSnap.exists()) {
              doctoresMap[docSnap.id] = docSnap.data();
            }
          });
          setDoctoresMap(doctoresMap);
        }

      } catch (error) {
        console.error("Error al cargar las citas:", error);
      }
    };

    cargarTodasLasCitas();
  }, []);

  // Suscripción en tiempo real a la colección de citas
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "citasmedicas"), async (citasSnapshot) => {
      const citasData = citasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCitas(citasData);

      // Extraer ids únicos
      const pacienteIds = [...new Set(citasData.map(c => c.pacienteid))];
      const horarioIds = [...new Set(citasData.map(c => c.horarioid))];
      const doctorIds = [...new Set(citasData.map(c => c.doctorid))];

      // Cargar pacientes (optimizado - solo los necesarios)
      if (pacienteIds.length > 0) {
        const pacientesPromises = pacienteIds.map(id => getDoc(doc(db, "users", id)));
        const pacientesDocs = await Promise.all(pacientesPromises);
        const pacientesMapTemp = {};
        pacientesDocs.forEach(docSnap => {
          if (docSnap.exists()) {
            pacientesMapTemp[docSnap.id] = docSnap.data();
          }
        });
        setPacientesMap(prev => ({ ...prev, ...pacientesMapTemp }));
      }

      // Cargar horarios
      if (horarioIds.length > 0) {
        const horariosPromises = horarioIds.map(id => getDoc(doc(db, "horarios", id)));
        const horariosDocs = await Promise.all(horariosPromises);
        const horariosMap = {};
        horariosDocs.forEach(docSnap => {
          if (docSnap.exists()) {
            horariosMap[docSnap.id] = docSnap.data();
          }
        });
        setHorariosMap(horariosMap);
      }

      // Cargar doctores
      if (doctorIds.length > 0) {
        const doctoresPromises = doctorIds.map(id => getDoc(doc(db, "users", id)));
        const doctoresDocs = await Promise.all(doctoresPromises);
        const doctoresMap = {};
        doctoresDocs.forEach(docSnap => {
          if (docSnap.exists()) {
            doctoresMap[docSnap.id] = docSnap.data();
          }
        });
        setDoctoresMap(doctoresMap);
      }
    });

    // Limpia el listener al desmontar el componente
    return () => unsubscribe();
  }, []);

  // Actualizar estado de cita
  const actualizarEstadoCita = async (idCita, nuevoEstado) => {
    const citaRef = doc(db, "citasmedicas", idCita);
    await updateDoc(citaRef, { estado: nuevoEstado });
    setCitas(citas.map(c => c.id === idCita ? { ...c, estado: nuevoEstado } : c));
  };

  // Validar disponibilidad de horario
  const validarDisponibilidadHorario = async (doctorId, nuevaFechaHora, horarioIdAExcluir = null) => {
    try {
      setCargandoValidacion(true);
      setErrorValidacion("");

      const fechaHoraObjetivo = new Date(nuevaFechaHora);
      if (isNaN(fechaHoraObjetivo.getTime())) {
        return { disponible: false, mensaje: "Formato de fecha y hora inválido." };
      }

      if (fechaHoraObjetivo < new Date()) {
        return { disponible: false, mensaje: "La fecha y hora de la cita no pueden ser en el pasado." };
      }

      const horariosQuery = query(
        collection(db, "horarios"),
        where("doctorid", "==", doctorId),
        where("fecha", "==", fechaHoraObjetivo)
      );

      const horariosSnapshot = await getDocs(horariosQuery);

      if (!horariosSnapshot.empty) {
        const horariosOcupados = horariosSnapshot.docs.filter(docSnap => {
          const horario = docSnap.data();
          return docSnap.id !== horarioIdAExcluir && horario.estado === "ocupado";
        });

        if (horariosOcupados.length > 0) {
          return { disponible: false, mensaje: "El doctor ya tiene una cita programada a esa fecha y hora." };
        }
      }

      return { disponible: true, mensaje: "" };
    } catch (error) {
      console.error("Error al validar disponibilidad:", error);
      return { disponible: false, mensaje: "Error al validar disponibilidad." };
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

      const nuevaFechaHoraObj = new Date(fechaHoraEdit);
      if (isNaN(nuevaFechaHoraObj.getTime())) {
        setErrorValidacion("Formato de fecha y hora inválido.");
        return;
      }

      if (fechaHoraEdit && timestampToDateTimeInput(horarioActual?.fecha) !== fechaHoraEdit) {
        const validacion = await validarDisponibilidadHorario(
          citaActual.doctorid,
          fechaHoraEdit,
          citaActual.horarioid
        );

        if (!validacion.disponible) {
          setErrorValidacion(validacion.mensaje);
          return;
        }

        const horarioRef = doc(db, "horarios", citaActual.horarioid);
        await updateDoc(horarioRef, { fecha: nuevaFechaHoraObj });
      }

      const citaRef = doc(db, "citasmedicas", idCita);
      await updateDoc(citaRef, { descripcion: descripcionEdit });

      if (fechaHoraEdit && timestampToDateTimeInput(horarioActual?.fecha) !== fechaHoraEdit) {
        setHorariosMap(prev => ({
          ...prev,
          [citaActual.horarioid]: {
            ...prev[citaActual.horarioid],
            fecha: nuevaFechaHoraObj
          }
        }));
      }

      setCitas(citas.map(c => c.id === idCita ? {
        ...c,
        descripcion: descripcionEdit
      } : c));

      setEditandoCitaId(null);

    } catch (error) {
      console.error("Error al guardar edición:", error);
      setErrorValidacion("Error al actualizar la cita.");
    }
  };

  const buscarPacientePorCedula = async () => {
    // Esta función ya no es necesaria, pero la mantenemos por si acaso
    console.log("Función de búsqueda de paciente no utilizada en esta vista");
  };

  const registrarCita = async () => {
    // Esta función ya no es necesaria, pero la mantenemos por si acaso
    console.log("Función de registro de cita no utilizada en esta vista");
  };

  // Filtrar doctores por especialidad seleccionada
  const doctoresFiltrados = especialidadSeleccionada 
    ? doctores.filter(d => d.especialidadid === especialidadSeleccionada)
    : doctores;

  // Filtrar citas según los selects
  const citasFiltradas = citas.filter(cita => {
    const doctor = doctoresMap[cita.doctorid];
    
    // Filtro por especialidad
    if (especialidadSeleccionada && doctor?.especialidadid !== especialidadSeleccionada) {
      return false;
    }
    
    // Filtro por doctor
    if (doctorSeleccionado && cita.doctorid !== doctorSeleccionado) {
      return false;
    }
    
    return true;
  });

  return (
    <div>
      <h1>Hola {nombre.split(" ")[0]} {apellido.split(" ")[0]} </h1>
      
      <div className="inicioescoger">
        <label>Especialidad:</label>
        <select
          value={especialidadSeleccionada}
          onChange={e => {
            setEspecialidadSeleccionada(e.target.value);
            setDoctorSeleccionado(""); // Reset doctor selection when specialty changes
          }}
        >
          <option value="">-- Todas las especialidades --</option>
          {especialidades.map(e => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>

        <label>Doctor:</label>
        <select
          value={doctorSeleccionado}
          onChange={e => setDoctorSeleccionado(e.target.value)}
        >
          <option value="">-- Todos los doctores --</option>
          {doctoresFiltrados.map(d => (
            <option key={d.id} value={d.id}>{d.nombre} {d.apellido}</option>
          ))}
        </select>
        
      </div>
      <div className="parrafoMai">
        Por favor, seleccionar primero la especialidad y luego el doctor
      </div>
      
      
      <h2>Citas Médicas {especialidadSeleccionada || doctorSeleccionado ? '(Filtradas)' : '(Todas)'}</h2>
      <table>
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Doctor</th>
            <th>Especialidad</th>
            <th>Fecha y Hora</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {citasFiltradas.length > 0 ? (
            citasFiltradas.map(cita => {
              const paciente = pacientesMap[cita.pacienteid];
              const doctor = doctoresMap[cita.doctorid];
              const especialidad = doctor ? especialidadesMap[doctor.especialidadid] : null;
              const horario = horariosMap[cita.horarioid];

              return (
                <tr key={cita.id}>
                  <td>{paciente ? `${paciente.nombre} ${paciente.apellido}` : cita.pacienteid}</td>
                  <td>{doctor ? `${doctor.nombre} ${doctor.apellido}` : cita.doctorid}</td>
                  <td>{especialidad ? especialidad.nombre : "Sin especialidad"}</td>
                  <td>
                    {editandoCitaId === cita.id ? (
                      <div>
                        <input
                          type="datetime-local"
                          value={fechaHoraEdit}
                          onChange={e => {
                            setFechaHoraEdit(e.target.value);
                            setErrorValidacion("");
                          }}
                        />
                        {errorValidacion && (
                          <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                            {errorValidacion}
                          </div>
                        )}
                      </div>
                    ) : (
                      horario ? (
                        formatearFecha(horario.fecha) || "Sin horario"
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
                  <td className={
                      cita.estado === "confirmado" ? "texto-confirmado" :
                      cita.estado === "rechazado" ? "texto-rechazado" :
                      cita.estado === "pendiente" ? "texto-pendiente" :
                      ""
                    }>
                      {cita.estado}
                    </td>

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
                          setFechaHoraEdit(horario ? timestampToDateTimeInput(horario.fecha) : "");
                          setErrorValidacion("");
                        }}>Modificar</button>

                        <button onClick={() => actualizarEstadoCita(cita.id, "confirmado")}>Confirmar</button>
                        <button onClick={() => actualizarEstadoCita(cita.id, "rechazado")}>Rechazar</button>
                      </>
                    )}
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan="7">No hay citas {especialidadSeleccionada || doctorSeleccionado ? 'que coincidan con los filtros seleccionados' : 'registradas'}.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Admin;