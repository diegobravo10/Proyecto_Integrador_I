import React, { useState, useEffect } from 'react';
import './paciente.css';
import { collection, getDocs, addDoc, query, where, onSnapshot} from "firebase/firestore";
import { db } from "../servicios/firebase";
import Swal from 'sweetalert2';


const Paciente = () => {
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointment, setAppointment] = useState({
    specialtyId: '',
    doctorId: '',
    horarioId: '',
    descripcion: ''
  });
const [shownAppointments, setShownAppointments] = useState(new Set());


// Obtener el ID del paciente actual
const currentPatientId = localStorage.getItem('uid'); 

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
    } catch (error) {
      console.error("Error al obtener datos de Firebase:", error);
    }
  };

  fetchData();
}, []);


useEffect(() => {
  if (doctors.length === 0) return;

  const citasQuery = query(
    collection(db, "citasmedicas"),
    where("pacienteid", "==", currentPatientId)
  );
  const horariosMap = new Map();
  let citasDocs = [];

  const horariosUnsub = onSnapshot(collection(db, "horarios"), (snapshot) => {
    snapshot.forEach((doc) => {
      horariosMap.set(doc.id, { id: doc.id, ...doc.data() });
    });
    actualizarCitas();
  });

  const citasUnsub = onSnapshot(citasQuery, (snapshot) => {
    citasDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    actualizarCitas();
  });

  function actualizarCitas() {
    const nuevasCitas = citasDocs.map(cita => ({
      ...cita,
      horarioInfo: horariosMap.get(cita.horarioid) || {}
    }));

    nuevasCitas.forEach(cita => {
      const doctorName = getDoctorName(cita.doctorid);
      const fechaFormateada = cita.horarioInfo ? formatDate(cita.horarioInfo.fecha) : 'Fecha no disponible';
      if (
        (cita.estado === 'confirmado' || cita.estado === 'rechazado') &&
        !shownAppointments.has(cita.id) &&
        cita.horarioInfo &&
        isDateFuture(cita.horarioInfo.fecha)
      ) {
        if (!doctorName || !cita.horarioInfo || !cita.horarioInfo.fecha) {
          return;
        }

        if (cita.estado === 'confirmado') {
          Swal.fire({
            icon: 'success',
            title: '¡Cita Confirmada!',
            html: `
              <p><strong>Doctor:</strong> ${doctorName}</p>
              <p><strong>Fecha:</strong> ${fechaFormateada}</p>
              <p>Gracias por confiar en nosotros. Si necesitas cambiar tu cita, contáctanos.</p>
            `,
            confirmButtonText: 'OK',
          });
        } else if (cita.estado === 'rechazado') {
          Swal.fire({
            icon: 'error',
            title: 'Cita Rechazada',
            html: `
              <p>Lo sentimos, tu cita medica con ${doctorName} para el día ${fechaFormateada} ha sido rechazada.</p>
              <p>Por favor, contacta con nosotros para reprogramar o para más información.</p>
            `,
            confirmButtonText: 'OK',
          });
        }

        setShownAppointments(prev => new Set(prev).add(cita.id));
      }
    });

    setAppointments(nuevasCitas);
  }

  return () => {
    horariosUnsub();
    citasUnsub();
  };
}, [doctors]); 

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

    if (name === 'doctorId') {
      fetchAvailableSchedules(value);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const citaData = {
        pacienteid: currentPatientId,
        doctorid: appointment.doctorId,
        horarioid: appointment.horarioId,
        descripcion: appointment.descripcion,
        estado: 'pendiente' 
      };

      await addDoc(collection(db, "citasmedicas"), citaData);
      
      alert('Cita médica agendada con éxito. Estado: Pendiente de confirmación.');
      
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



  const isDateFuture = (timestamp) => {
    try {
      let date;
      

      if (timestamp && timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      }

      else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      }

      else if (Array.isArray(timestamp) && timestamp.length >= 3) {
        const year = timestamp[0];
        const month = timestamp[1] - 1;
        const day = timestamp[2];
        const hour = timestamp[3] || 0;
        const minute = timestamp[4] || 0;
        date = new Date(year, month, day, hour, minute);
      }

      else if (timestamp instanceof Date) {
        date = timestamp;
      }

      else {
        date = new Date(timestamp);
      }
      
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
      

      if (timestamp && timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      }
 
      else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      }
      else if (Array.isArray(timestamp) && timestamp.length >= 3) {
        const year = timestamp[0];
        const month = timestamp[1] - 1;
        const day = timestamp[2];
        const hour = timestamp[3] || 0;
        const minute = timestamp[4] || 0;
        date = new Date(year, month, day, hour, minute);
      }
      else if (timestamp instanceof Date) {
        date = timestamp;
      }

      else {
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
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
            {appointments.length > 0 ? (
              appointments
                .sort((a, b) => {
                  const horarioA = a.horarioInfo;
                  const horarioB = b.horarioInfo;
                  
    
                  if (!horarioA && !horarioB) return 0;
                  if (!horarioA) return 1;
                  if (!horarioB) return -1;
                  
   
                  let fechaA, fechaB;
                  
                  if (horarioA.fecha) {
                    if (horarioA.fecha.seconds) {
                      fechaA = new Date(horarioA.fecha.seconds * 1000);
                    } else if (typeof horarioA.fecha === 'number') {
                      fechaA = new Date(horarioA.fecha);
                    } else if (Array.isArray(horarioA.fecha) && horarioA.fecha.length >= 3) {
                      const year = horarioA.fecha[0];
                      const month = horarioA.fecha[1] - 1;
                      const day = horarioA.fecha[2];
                      const hour = horarioA.fecha[3] || 0;
                      const minute = horarioA.fecha[4] || 0;
                      fechaA = new Date(year, month, day, hour, minute);
                    } else if (horarioA.fecha instanceof Date) {
                      fechaA = horarioA.fecha;
                    } else {
                      fechaA = new Date(horarioA.fecha);
                    }
                  } else {
                    fechaA = new Date(0); 
                  }
                  
                  if (horarioB.fecha) {
                    if (horarioB.fecha.seconds) {
                      fechaB = new Date(horarioB.fecha.seconds * 1000);
                    } else if (typeof horarioB.fecha === 'number') {
                      fechaB = new Date(horarioB.fecha);
                    } else if (Array.isArray(horarioB.fecha) && horarioB.fecha.length >= 3) {
                      const year = horarioB.fecha[0];
                      const month = horarioB.fecha[1] - 1;
                      const day = horarioB.fecha[2];
                      const hour = horarioB.fecha[3] || 0;
                      const minute = horarioB.fecha[4] || 0;
                      fechaB = new Date(year, month, day, hour, minute);
                    } else if (horarioB.fecha instanceof Date) {
                      fechaB = horarioB.fecha;
                    } else {
                      fechaB = new Date(horarioB.fecha);
                    }
                  } else {
                    fechaB = new Date(0); 
                  }
   
                  if (isNaN(fechaA.getTime())) fechaA = new Date(0);
                  if (isNaN(fechaB.getTime())) fechaB = new Date(0);

                  return fechaB- fechaA;
                })
                .map((cita) => {
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
                })
            ) : (
              <tr>
                <td colSpan="4">No tienes citas médicas agendadas.</td>
              </tr>
            )}
          </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Paciente;