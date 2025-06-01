import React, { useState, useEffect } from 'react';
import './paciente.css';
import { collection, getDocs, addDoc, query, where, onSnapshot} from "firebase/firestore";
import { db } from "../servicios/firebase";

const Paciente = () => {
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [appointments, setAppointments] = useState([]); // Para mostrar citas existentes
  const [appointment, setAppointment] = useState({
    specialtyId: '',
    doctorId: '',
    horarioId: '',
    descripcion: ''
  });

// Obtener el ID del paciente actual
const currentPatientId = localStorage.getItem('uid'); // Reemplaza con el ID real del paciente logueado

useEffect(() => {
  const fetchData = async () => {
    try {
      // Cargar especialidades
      const specialtiesSnapshot = await getDocs(collection(db, "especialidad"));
      const specialtiesList = specialtiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSpecialties(specialtiesList);

      // Cargar doctores
      const usersSnapshot = await getDocs(collection(db, "users"));
      const doctorsList = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.rol === 'doctor');
      setDoctors(doctorsList);

      // SUSCRIBIRSE a cambios en las citas médicas del paciente
      const citasQuery = query(
        collection(db, "citasmedicas"), 
        where("pacienteid", "==", currentPatientId)
      );

      // Mapa para cachear horarios
      const horariosMap = new Map();

      // Suscribirse a horarios (para obtener siempre la última info)
      const horariosUnsub = onSnapshot(collection(db, "horarios"), (snapshot) => {
        snapshot.forEach((doc) => {
          horariosMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
        actualizarCitas(); // Intentar actualizar citas si ya tenemos algunas
      });

      // Suscribirse a cambios en las citas del paciente
      let citasDocs = [];
      const citasUnsub = onSnapshot(citasQuery, (snapshot) => {
        citasDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        actualizarCitas();
      });

      // Función para actualizar citas combinadas con horarios
      const actualizarCitas = () => {
        const citasActualizadas = citasDocs.map(cita => ({
          ...cita,
          horarioInfo: horariosMap.get(cita.horarioid) || {}
        }));
        console.log("Citas actualizadas:", citasActualizadas);
        setAppointments(citasActualizadas);
      };

      // Cleanup para cancelar la suscripción al desmontar
      return () => {
        horariosUnsub();
        citasUnsub();
      };

    } catch (error) {
      console.error("Error al obtener datos de Firebase:", error);
    }
  };

  fetchData();
}, []);


  useEffect(() => {
    const filtered = doctors.filter(doc => doc.especialidadid === appointment.specialtyId);
    setFilteredDoctors(filtered);
    setAppointment(prev => ({ ...prev, doctorId: '', horarioId: '' }));
    setAvailableSchedules([]);
  }, [appointment.specialtyId, doctors]);

  // Función para obtener horarios disponibles del doctor seleccionado
  const fetchAvailableSchedules = async (doctorId) => {
    if (!doctorId) {
      setAvailableSchedules([]);
      return;
    }

    try {
      // Obtener todos los horarios disponibles (disponibilidad = true) para el doctor
      const horariosQuery = query(
        collection(db, "horarios"),
        where("doctorid", "==", doctorId),
        where("disponibilidad", "==", true)
      );
      const horariosSnapshot = await getDocs(horariosQuery);

      // Obtener horarios ya ocupados
      const citasQuery = query(
        collection(db, "citasmedicas"),
        where("doctorid", "==", doctorId)
      );
      const citasSnapshot = await getDocs(citasQuery);
      const horariosOcupados = citasSnapshot.docs.map(doc => doc.data().horarioid);

      // Filtrar horarios disponibles que no estén ocupados y que sean fechas futuras
      const horariosDisponibles = horariosSnapshot.docs
        .filter(doc => !horariosOcupados.includes(doc.id))
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(horario => {
          // Verificar que la fecha sea futura
          return isDateFuture(horario.fecha);
        });

      setAvailableSchedules(horariosDisponibles);

    } catch (error) {
      console.error("Error al obtener horarios disponibles:", error);
      setAvailableSchedules([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAppointment(prev => ({ ...prev, [name]: value }));

    // Si cambia el doctor, actualizar horarios disponibles
    if (name === 'doctorId') {
      fetchAvailableSchedules(value);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Crear la cita médica en Firebase
      const citaData = {
        pacienteid: currentPatientId,
        doctorid: appointment.doctorId,
        horarioid: appointment.horarioId,
        descripcion: appointment.descripcion,
        estado: 'pendiente' // Estado inicial
      };

      await addDoc(collection(db, "citasmedicas"), citaData);
      
      alert('Cita médica agendada con éxito. Estado: Pendiente de confirmación.');
      
      // Limpiar formulario y actualizar lista de citas
      setAppointment({
        specialtyId: '',
        doctorId: '',
        horarioId: '',
        descripcion: ''
      });
      setAvailableSchedules([]);

    } catch (error) {
      console.error("Error al agendar cita médica:", error);
      alert('Error al agendar la cita. Intenta nuevamente.');
    }
  };

  // Función para obtener el nombre del doctor
  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(doc => doc.id === doctorId);
    return doctor ? `${doctor.nombre} ${doctor.apellido}` : 'Doctor no encontrado';
  };

  // Función para obtener el nombre de la especialidad
  const getSpecialtyName = (specialtyId) => {
    const specialty = specialties.find(spec => spec.id === specialtyId);
    return specialty ? specialty.nombre : 'Especialidad no encontrada';
  };

  // Función para verificar si una fecha es futura
  const isDateFuture = (timestamp) => {
    try {
      let date;
      
      // Si es un timestamp de Firebase (objeto con seconds y nanoseconds)
      if (timestamp && timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      }
      // Si es un timestamp como número
      else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      }
      // Si es un array [año, mes, día, hora, minuto] o [año, mes, día]
      else if (Array.isArray(timestamp) && timestamp.length >= 3) {
        // Los meses en JavaScript van de 0-11, por eso restamos 1
        const year = timestamp[0];
        const month = timestamp[1] - 1;
        const day = timestamp[2];
        const hour = timestamp[3] || 0;
        const minute = timestamp[4] || 0;
        date = new Date(year, month, day, hour, minute);
      }
      // Si ya es un objeto Date válido
      else if (timestamp instanceof Date) {
        date = timestamp;
      }
      // Intentar como string
      else {
        date = new Date(timestamp);
      }
      
      // Verificar si la fecha es válida y es futura
      if (isNaN(date.getTime())) {
        return false;
      }
      
      const now = new Date();
      return date > now;
    } catch (error) {
      console.error('Error al verificar fecha futura:', error);
      return false;
    }
  };

  // Función para obtener el color y texto del estado
  const getStatusStyle = (estado) => {
    const statusMap = {
      'confirmado': {
        backgroundColor: '#28a745',
        color: 'white',
        text: 'Confirmado'
      },
      'pendiente': {
        backgroundColor: '#ffc107',
        color: 'black',
        text: 'Pendiente'
      },
      'rechazado': {
        backgroundColor: '#dc3545',
        color: 'white',
        text: 'Rechazado'
      }
    };
    
    // Normalizar el estado (quitar espacios y convertir a minúsculas)
    const normalizedEstado = estado ? estado.toString().trim().toLowerCase() : '';
    
    return statusMap[normalizedEstado] || {
      backgroundColor: '#6c757d',
      color: 'white',
      text: estado || 'Sin estado'
    };
  };
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    
    try {
      let date;
      
      // Si es un timestamp de Firebase (objeto con seconds y nanoseconds)
      if (timestamp && timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      }
      // Si es un timestamp como número
      else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      }
      // Si es un array [año, mes, día, hora, minuto] o [año, mes, día]
      else if (Array.isArray(timestamp) && timestamp.length >= 3) {
        // Los meses en JavaScript van de 0-11, por eso restamos 1
        const year = timestamp[0];
        const month = timestamp[1] - 1;
        const day = timestamp[2];
        const hour = timestamp[3] || 0;
        const minute = timestamp[4] || 0;
        date = new Date(year, month, day, hour, minute);
      }
      // Si ya es un objeto Date válido
      else if (timestamp instanceof Date) {
        date = timestamp;
      }
      // Intentar como string
      else {
        date = new Date(timestamp);
      }
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      // Formatear fecha con hora si está disponible
      const dateOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      
      const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      
      const formattedDate = date.toLocaleDateString('es-ES', dateOptions);
      
      // Si tiene información de hora (no es medianoche), incluirla
      if (date.getHours() !== 0 || date.getMinutes() !== 0) {
        const formattedTime = date.toLocaleTimeString('es-ES', timeOptions);
        return `${formattedDate} - ${formattedTime}`;
      }
      
      return formattedDate;
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Error en fecha';
    }
  };

  return (
    <div className="ajuste-container">
      <h2>Agendar Cita Médica</h2>
      
      <form onSubmit={onSubmit}>
        <div className="ajuste-form-group">
          <label>Especialidad:</label>
          <select
            required
            name="specialtyId"
            value={appointment.specialtyId}
            onChange={handleChange}
          >
            <option value="">Selecciona una especialidad</option>
            {specialties.map(spec => (
              <option key={spec.id} value={spec.id}>{spec.nombre}</option>
            ))}
          </select>
        </div>

        <div className="ajuste-form-group">
          <label>Médico:</label>
          <select
            required
            name="doctorId"
            value={appointment.doctorId}
            onChange={handleChange}
            disabled={!appointment.specialtyId}
          >
            <option value="">Selecciona un médico</option>
            {filteredDoctors.map(doc => (
              <option key={doc.id} value={doc.id}>{doc.nombre} {doc.apellido}</option>
            ))}
          </select>
        </div>

        <div className="ajuste-form-group">
          <label>Horario Disponible:</label>
          <select
            required
            name="horarioId"
            value={appointment.horarioId}
            onChange={handleChange}
            disabled={availableSchedules.length === 0}
          >
            <option value="">Selecciona un horario</option>
            {availableSchedules.map((horario) => (
              <option key={horario.id} value={horario.id}>
                {formatDate(horario.fecha)}
              </option>
            ))}
          </select>
        </div>

        <div className="ajuste-form-group">
          <label>Descripción (opcional):</label>
          <textarea
            name="descripcion"
            value={appointment.descripcion}
            onChange={handleChange}
            placeholder="Describe brevemente el motivo de la consulta..."
            rows="3"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div className="ajuste-form-group text-center">
          <div style={{ display: 'inline-block' }}>
            <button 
              type="submit" 
              className="ajuste-btn-guardar"
              disabled={!appointment.horarioId}
            >
              Agendar Cita Médica
            </button>
          </div>
        </div>
      </form>

      {/* Tabla de horarios disponibles */}
      {availableSchedules.length > 0 && (
        <div className="ajuste-form-group">
          <h4>Horarios Disponibles para el Doctor Seleccionado</h4>
          <table className="table table-bordered mt-3">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Estado</th>
                <th>Selección</th>
              </tr>
            </thead>
            <tbody>
              {availableSchedules.map((horario) => (
                <tr key={horario.id}>
                  <td>{formatDate(horario.fecha)}</td>
                  <td>
                    <span style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '3px 8px',
                      borderRadius: '3px',
                      fontSize: '12px'
                    }}>
                      Disponible
                    </span>
                  </td>
                  <td>
                    {appointment.horarioId === horario.id ? 
                      <strong style={{ color: '#007bff' }}>✓ Seleccionado</strong> : 
                      '-'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sección para mostrar las citas médicas del paciente */}
      <div className="ajuste-form-group mt-5">
        <h3>Mis Citas Médicas</h3>
        {appointments.length === 0 ? (
          <p>No tienes citas médicas agendadas.</p>
        ) : (
          <table className="table table-bordered mt-3">
            <thead>
              <tr>
                <th>Médico</th>
                <th>Fecha y Hora</th>
                <th>Descripción</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((cita) => {
                const statusStyle = getStatusStyle(cita.estado);
                return (
                  <tr key={cita.id}>
                    <td>{getDoctorName(cita.doctorid)}</td>
                    <td>{cita.horarioInfo ? formatDate(cita.horarioInfo.fecha) : 'No disponible'}</td>
                    <td>{cita.descripcion || 'Sin descripción'}</td>
                    <td>
                      <span 
                        style={{
                          backgroundColor: statusStyle.backgroundColor,
                          color: statusStyle.color,
                          padding: '5px 10px',
                          borderRadius: '5px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        {statusStyle.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Paciente;