import { useState, useEffect } from "react";
import { collection, getDocs, query, where, updateDoc, doc, getDoc, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "../servicios/firebase.js";

import './doctor.css'

const Doctor = () => {
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
  const [fechaHoraEdit, setFechaHoraEdit] = useState(""); // Cambiado a fechaHoraEdit para datetime-local

  // Estados para validaciones
  const [cargandoValidacion, setCargandoValidacion] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState("");

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [docId, setDocId] = useState("");

  const [pacientes, setPacientes] = useState([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState("");
  const [descripcionNuevaCita, setDescripcionNuevaCita] = useState("");
  const [fechaNuevaCita, setFechaNuevaCita] = useState(""); // Para el input datetime-local
  const [mensajeNuevo, setMensajeNuevo] = useState("");
  const [busquedaCedula, setBusquedaCedula] = useState("");

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
      if (isNaN(date.getTime())) return ""; // Check for invalid date string
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

  // Cargar pacientes (rol: pacient)
  useEffect(() => {
    const cargarPacientes = async () => {
      const q = query(collection(db, "users"), where("rol", "==", "pacient"));
      const snapshot = await getDocs(q);
      setPacientes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    cargarPacientes();
  }, []);

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
    const storedId = localStorage.getItem("uid");
    if (!storedId) return;

    // Consulta para las citas del doctor logueado
    const q = query(collection(db, "citasmedicas"), where("doctorid", "==", storedId));

    // Suscripción en tiempo real
    const unsubscribe = onSnapshot(q, async (snapshot) => {
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

  // Validar disponibilidad de horario (ahora con fecha y hora)
  const validarDisponibilidadHorario = async (doctorId, nuevaFechaHora, horarioIdAExcluir = null) => {
    try {
      setCargandoValidacion(true);
      setErrorValidacion("");

      // Convertir la nuevaFechaHora a un objeto Date para comparación
      const fechaHoraObjetivo = new Date(nuevaFechaHora);
      if (isNaN(fechaHoraObjetivo.getTime())) {
        return { disponible: false, mensaje: "Formato de fecha y hora inválido." };
      }

      // Validar que la fecha no sea en el pasado
      if (fechaHoraObjetivo < new Date()) {
        return { disponible: false, mensaje: "La fecha y hora de la cita no pueden ser en el pasado." };
      }

      const horariosQuery = query(
        collection(db, "horarios"),
        where("doctorid", "==", doctorId),
        where("fecha", "==", fechaHoraObjetivo) // Busca horarios con la misma fecha y hora
      );

      const horariosSnapshot = await getDocs(horariosQuery);

      // Si encuentra horarios en esa fecha y hora
      if (!horariosSnapshot.empty) {
        // Verificar si alguno está ocupado (excluyendo el horario actual si estamos editando)
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

      // Verifica que el horario exista
      const horarioRef = doc(db, "horarios", citaActual.horarioid);
      const horarioSnap = await getDoc(horarioRef);
      if (!horarioSnap.exists()) {
        setErrorValidacion("El horario asociado a esta cita no existe.");
        return;
      }

      // Convertir la fechaHoraEdit a un objeto Date para validación
      const nuevaFechaHoraObj = new Date(fechaHoraEdit);
      if (isNaN(nuevaFechaHoraObj.getTime())) {
        setErrorValidacion("Formato de fecha y hora inválido.");
        return;
      }

      // Si la fecha y/o hora cambió, validar disponibilidad
      if (fechaHoraEdit && timestampToDateTimeInput(horarioActual?.fecha) !== fechaHoraEdit) {
        const storedId = localStorage.getItem("uid");
        const validacion = await validarDisponibilidadHorario(
          storedId,
          fechaHoraEdit,
          citaActual.horarioid
        );

        if (!validacion.disponible) {
          setErrorValidacion(validacion.mensaje);
          return;
        }

        // Actualizar la fecha y hora en la colección de horarios
        await updateDoc(horarioRef, { fecha: nuevaFechaHoraObj });
      }

      // Actualizar la cita médica (descripción)
      const citaRef = doc(db, "citasmedicas", idCita);
      await updateDoc(citaRef, { descripcion: descripcionEdit });

      // Actualizar estado local de horarios (si la fecha/hora cambió)
      if (fechaHoraEdit && timestampToDateTimeInput(horarioActual?.fecha) !== fechaHoraEdit) {
        setHorariosMap(prev => ({
          ...prev,
          [citaActual.horarioid]: {
            ...prev[citaActual.horarioid],
            fecha: nuevaFechaHoraObj
          }
        }));
      }

      // Actualizar estado local de citas (descripción)
      setCitas(citas.map(c => c.id === idCita ? {
        ...c,
        descripcion: descripcionEdit
      } : c));

      setEditandoCitaId(null);
      alert("Cita actualizada correctamente");

    } catch (error) {
      console.error("Error al guardar edición:", error);
      setErrorValidacion("Error al actualizar la cita.");
    }
  };

  const buscarPacientePorCedula = async () => {
    try {
      const q = query(collection(db, "users"), where("cedula", "==", busquedaCedula));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const pacienteDoc = snapshot.docs[0];
        setPacienteSeleccionado(pacienteDoc.id);
        setMensajeNuevo(`Paciente encontrado: ${pacienteDoc.data().nombre} ${pacienteDoc.data().apellido}`);
      } else {
        setPacienteSeleccionado("");
        setMensajeNuevo("No se encontró paciente con esa cédula.");
      }
    } catch (error) {
      console.error("Error al buscar paciente:", error);
      setMensajeNuevo("Error en la búsqueda.");
    }
  };

  const registrarCita = async () => {
    if (!especialidadSeleccionada || !doctorSeleccionado || !pacienteSeleccionado || !fechaNuevaCita || !descripcionNuevaCita) {
      setMensajeNuevo("Completa todos los campos (especialidad, doctor, paciente, fecha y hora, descripción).");
      return;
    }

    try {
      setMensajeNuevo("");
      setCargandoValidacion(true);

      const nuevaFechaHora = new Date(fechaNuevaCita);

      // Validar la disponibilidad del horario antes de crear la cita
      const storedId = localStorage.getItem("uid");
      // ...
      const validacion = await validarDisponibilidadHorario(
        storedId,
        nuevaFechaHora
      );

      if (!validacion.disponible) {
        setMensajeNuevo(validacion.mensaje);
        setCargandoValidacion(false);
        return;
      }

      // Crear un nuevo horario
      const nuevoHorario = {
        doctorid: doctorSeleccionado,
        fecha: nuevaFechaHora, // Guardar como Timestamp de Firebase
        estado: "ocupado"
      };
      const horarioRef = await addDoc(collection(db, "horarios"), nuevoHorario);

      // Crear cita
      const nuevaCita = {
        doctorid: doctorSeleccionado,
        pacienteid: pacienteSeleccionado,
        horarioid: horarioRef.id,
        descripcion: descripcionNuevaCita,
        estado: "pendiente"
      };
      await addDoc(collection(db, "citasmedicas"), nuevaCita);
      setMensajeNuevo("Cita registrada correctamente.");

      // Limpia los campos y recarga las citas para el doctor seleccionado
      setDescripcionNuevaCita("");
      setFechaNuevaCita("");
      setBusquedaCedula("");
      setPacienteSeleccionado("");
      // Recargar citas para que la nueva aparezca en la tabla
      // Un efecto secundario del cambio de doctorSeleccionado o un re-fetch explícito.
      // Para simplificar, podemos resetear doctorSeleccionado para que el useEffect lo recargue.
      // O llamar directamente a la función que carga las citas para el doctor.
      // Para esta solución, asumiremos que volver a seleccionar el doctor activará la recarga.
      setDoctorSeleccionado(doctorSeleccionado); 
    } catch (error) {
      console.error("Error al registrar cita:", error);
      setMensajeNuevo("Error al registrar cita. Inténtalo de nuevo.");
    } finally {
      setCargandoValidacion(false);
    }
  };

  return (
    <div>
      <h1>Hola {nombre.split(" ")[0]} {apellido.split(" ")[0]} </h1>
      <hr/>

      <h2>Citas</h2>
      <table>
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Fecha y Hora</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {citas.length > 0 ? (
            citas.map(cita => {
              const paciente = pacientesMap[cita.pacienteid];
              const horario = horariosMap[cita.horarioid];

              return (
                <tr key={cita.id}>
                  <td>{paciente ? `${paciente.nombre} ${paciente.apellido}` : cita.pacienteid}</td>
                  <td>
                    {editandoCitaId === cita.id ? (
                      <div>
                        <input
                          type="datetime-local"
                          value={fechaHoraEdit}
                          onChange={e => {
                            setFechaHoraEdit(e.target.value);
                            setErrorValidacion(""); // Limpiar error al cambiar fecha
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
              <td colSpan="5">No hay citas para el doctor seleccionado.</td>
            </tr>
          )}
        </tbody>
      </table>

      <hr/>

    </div>
  );
};

export default Doctor;