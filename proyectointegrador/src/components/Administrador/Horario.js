import { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, addDoc, orderBy, limit } from "firebase/firestore";
import { db } from "../servicios/firebase";
import './horario.css';

const HorarioD = () => {
  const [especialidades, setEspecialidades] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState("");
  const [doctorSeleccionado, setDoctorSeleccionado] = useState("");
  const [horarios, setHorarios] = useState([]);
  const [nuevaFechaHora, setNuevaFechaHora] = useState("");
  

useEffect(() => {
  const obtenerEspecialidades = async () => {
    try {
      const snap = await getDocs(collection(db, "especialidad"));
      const lista = snap.docs.map(doc => ({
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

useEffect(() => {
  if (doctorSeleccionado) {
    cargarHorarios(doctorSeleccionado);
  } else {
    setHorarios([]); // Limpia los horarios si no hay doctor seleccionado
  }
}, [doctorSeleccionado]);


useEffect(() => {
  const obtenerDoctores = async () => {
    if (!especialidadSeleccionada) return;
    try {
      const q = query(
        collection(db, "users"),
        where("rol", "==", "doctor"),
        where("especialidadid", "==", especialidadSeleccionada)
      );
      const snap = await getDocs(q);
      const lista = snap.docs.map(doc => ({
        id: doc.id,
        nombre: `${doc.data().nombre} ${doc.data().apellido}`
      }));
      setDoctores(lista);
      setDoctorSeleccionado(""); // Reiniciar selección anterior
    } catch (error) {
      console.error("Error al obtener doctores:", error);
    }
  };

  obtenerDoctores();
}, [especialidadSeleccionada]);


  const cargarHorarios = async (doctorId) => {
    try {
      const q = query(
        collection(db, "horarios"),
        where("doctorid", "==", doctorId),
        orderBy("fecha", "desc"),
        limit(30)
      );
      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        fecha: docSnap.data().fecha.toDate()
      }));
      setHorarios(lista);
    } catch (error) {
      console.error("Error al cargar horarios:", error);
    }
  };

const agregarHorario = async () => {
    if (!nuevaFechaHora || !doctorSeleccionado) return;

    try {
      const fecha = new Date(nuevaFechaHora);
      await addDoc(collection(db, "horarios"), {
        doctorid: doctorSeleccionado,
        fecha,
        disponibilidad: true
      });
      alert("Agregado Correctamente");
      setNuevaFechaHora("");
      cargarHorarios(doctorSeleccionado);
    } catch (error) {
      console.error("Error al agregar horario:", error);
    }
  };


  const cambiarEstado = async (horario) => {
    try {
      const ref = doc(db, "horarios", horario.id);
      await updateDoc(ref, { disponibilidad: !horario.disponibilidad });
      cargarHorarios(doctorSeleccionado);
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  const eliminarHorario = async (horario) => {
    try {
      const ref = doc(db, "horarios", horario.id);
      await deleteDoc(ref);
      cargarHorarios(doctorSeleccionado);
    } catch (error) {
      console.error("Error al eliminar horario:", error);
    }
  };

  return (
    <div className="contenedorH">
      <h2>Gestión de Horarios</h2>
      <div className="form-selectores">
        <select value={especialidadSeleccionada} onChange={(e) => setEspecialidadSeleccionada(e.target.value)}>
          <option value="">Seleccione Especialidad</option>
          {especialidades.map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>

        <select value={doctorSeleccionado} onChange={(e) => setDoctorSeleccionado(e.target.value)} disabled={!especialidadSeleccionada}>
          <option value="">Seleccione Doctor</option>
          {doctores.map((d) => (
            <option key={d.id} value={d.id}>{d.nombre}</option>
          ))}
        </select>

        <input
          type="datetime-local"
          value={nuevaFechaHora}
          onChange={(e) => setNuevaFechaHora(e.target.value)}
        />

        <button onClick={agregarHorario} disabled={!doctorSeleccionado || !nuevaFechaHora}>
          Agregar
        </button>
      </div>


      <table>
        <thead>
          <tr>
            <th>Fecha y Hora</th>
            <th>Disponibilidad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {horarios.map((h, i) => (
            <tr key={i}>
              <td>{h.fecha.toLocaleString()}</td>
              <td style={{ color: h.disponibilidad ? "green" : "red" }}>
                {h.disponibilidad ? "Disponible" : "No disponible"}
              </td>
              <td>
                <button onClick={() => cambiarEstado(h)}>Cambiar Estado</button>
                <button onClick={() => eliminarHorario(h)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HorarioD;
