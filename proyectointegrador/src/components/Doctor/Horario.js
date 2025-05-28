import { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, addDoc, orderBy, limit } from "firebase/firestore";
import { db } from "../servicios/firebase";
import './horario.css'

const Horario = () => {
  const [horarios, setHorarios] = useState([]);
  const [nuevaFechaHora, setNuevaFechaHora] = useState("");
  const [doctorId, setDoctorId] = useState("");

  useEffect(() => {
    const storedId = localStorage.getItem("uid");
    if (!storedId) return;

    setDoctorId(storedId);
    cargarHorarios(storedId);
  }, []);

  const cargarHorarios = async (id) => {
    try {
      const q = query(
        collection(db, "horarios"),
        where("doctorid", "==", id),
        orderBy("fecha", "desc"),
        limit(10)
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
    if (!nuevaFechaHora || !doctorId) return;

    try {
      const fecha = new Date(nuevaFechaHora);
      await addDoc(collection(db, "horarios"), {
        doctorid: doctorId,
        fecha,
        disponibilidad: true
      });
      alert("Agregado Correctamente")
      setNuevaFechaHora("");
      cargarHorarios(doctorId);
    } catch (error) {
      console.error("Error al agregar horario:", error);
    }
  };

  const cambiarEstado = async (horario) => {
    try {
      const ref = doc(db, "horarios", horario.id);
      await updateDoc(ref, {
        disponibilidad: !horario.disponibilidad
      });
      cargarHorarios(doctorId);
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  const eliminarHorario = async (horario) => {
    try {
      const ref = doc(db, "horarios", horario.id);
      await deleteDoc(ref);
      cargarHorarios(doctorId);
    } catch (error) {
      console.error("Error al eliminar horario:", error);
    }
  };

  return (
    <div className="contenedorhorarios">
      <h2>Horarios del Doctor</h2>

      <input
        type="datetime-local"
        value={nuevaFechaHora}
        onChange={(e) => setNuevaFechaHora(e.target.value)}
      />
      <button onClick={agregarHorario}>Agregar</button>

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

export default Horario;
