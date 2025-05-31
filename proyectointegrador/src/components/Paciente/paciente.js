import React, { useState, useEffect } from 'react';
import './paciente.css'; // Asegúrate de que aquí tengas los mismos estilos que en perfil

const Paciente = () => {
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [appointment, setAppointment] = useState({
    specialtyId: '',
    doctorId: '',
    date: '',
    time: ''
  });

  useEffect(() => {
    setSpecialties([
      { id: 'cardiologia', name: 'Cardiología' },
      { id: 'dermatologia', name: 'Dermatología' }
    ]);
    setDoctors([
      { id: 'doc1', name: 'Dr. Pérez', specialtyId: 'cardiologia' },
      { id: 'doc2', name: 'Dra. Gómez', specialtyId: 'dermatologia' }
    ]);
  }, []);

  useEffect(() => {
    const filtered = doctors.filter(doc => doc.specialtyId === appointment.specialtyId);
    setFilteredDoctors(filtered);
    setAppointment(prev => ({ ...prev, doctorId: '', time: '' }));
  }, [appointment.specialtyId, doctors]);

  const onDateChange = () => {
    setAvailableTimes(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAppointment(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    alert('Cita agendada con éxito');
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
            <option value="">Selecciona</option>
            {specialties.map(spec => (
              <option key={spec.id} value={spec.id}>{spec.name}</option>
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
          >
            <option value="">Selecciona</option>
            {filteredDoctors.map(doc => (
              <option key={doc.id} value={doc.id}>{doc.name}</option>
            ))}
          </select>
        </div>

        <div className="ajuste-form-group">
          <label>Fecha:</label>
          <input
            type="date"
            required
            name="date"
            value={appointment.date}
            onChange={(e) => {
              handleChange(e);
              onDateChange();
            }}
          />
        </div>

        <div className="ajuste-form-group">
          <label>Hora:</label>
          <select
            required
            name="time"
            value={appointment.time}
            onChange={handleChange}
          >
            <option value="">Selecciona</option>
            {availableTimes.map((time, idx) => (
              <option key={idx} value={time}>{time}</option>
            ))}
          </select>
        </div>

        <div className="ajuste-form-group text-center">
          <button type="submit" className="ajuste-btn-guardar">
            Agendar
          </button>
        </div>
      </form>

      {availableTimes.length > 0 && (
        <div className="ajuste-form-group">
          <h4>Horario disponible</h4>
          <table className="table table-bordered mt-3 text-center">
            <thead>
              <tr>
                {availableTimes.map((time, idx) => (
                  <th key={idx}>{time}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {availableTimes.map((time, idx) => (
                  <td key={idx}>
                    {appointment.time === time ? <strong>Seleccionado</strong> : 'Libre'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Paciente;
