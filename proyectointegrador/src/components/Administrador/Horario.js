import { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "../servicios/firebase";
import './horario.css';

const HorarioD = () => {
  const [horarios, setHorarios] = useState([]);
  const [nuevaFechaHora, setNuevaFechaHora] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [doctorId, setDoctorId] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("uid");
    if (id) {
      setDoctorId(id);
      cargarHorarios(id);
    } else {
      setError("No se encontró doctorId en el localStorage.");
    }
  }, []);

const procesarFecha = (fechaFirestore) => {
  try {
    if (!fechaFirestore) return null;

    if (fechaFirestore.seconds) {
      return new Date(fechaFirestore.seconds * 1000);
    }

    if (typeof fechaFirestore.toDate === 'function') {
      return fechaFirestore.toDate();
    }

    if (typeof fechaFirestore === 'string') {
      return new Date(fechaFirestore);
    }

    if (fechaFirestore instanceof Date) {
      return fechaFirestore;
    }

    return null;
  } catch (error) {
    console.error("Error al procesar fecha:", fechaFirestore, error);
    return null;
  }
};




  const cargarHorarios = async (id) => {
    try {
      setCargando(true);
      const q = query(collection(db, "horarios"), where("doctorid", "==", id));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setHorarios([]);
        return;
      }

      const lista = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          fecha: procesarFecha(data.fecha),
        };
      });

      lista.sort((a, b) => b.fecha?.getTime() - a.fecha?.getTime());
      setHorarios(lista.slice(0, 30));
    } catch (error) {
      console.error("Error al cargar horarios:", error);
      setError("Error al cargar horarios: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  const agregarHorario = async () => {
    if (!nuevaFechaHora || !doctorId) {
      alert("Por favor complete todos los campos");
      return;
    }

    try {
      setCargando(true);
      const fecha = new Date(nuevaFechaHora);
      await addDoc(collection(db, "horarios"), {
        doctorid: doctorId,
        fecha,
        disponibilidad: true
      });
      setNuevaFechaHora("");
      await cargarHorarios(doctorId);
      alert("Agregado correctamente");
    } catch (error) {
      console.error("Error al agregar horario:", error);
      alert("Error al agregar horario: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstado = async (horario) => {
    try {
      setCargando(true);
      const ref = doc(db, "horarios", horario.id);
      await updateDoc(ref, { disponibilidad: !horario.disponibilidad });
      await cargarHorarios(doctorId);
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      alert("Error al cambiar estado: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  const eliminarHorario = async (horario) => {
    if (!window.confirm("¿Está seguro de eliminar este horario?")) return;
    try {
      setCargando(true);
      const ref = doc(db, "horarios", horario.id);
      await deleteDoc(ref);
      await cargarHorarios(doctorId);
    } catch (error) {
      console.error("Error al eliminar horario:", error);
      alert("Error al eliminar horario: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="contenedorH">
      <h2>Gestión de Horarios</h2>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>
      )}

      <div className="form-selectores">
        <input
          type="datetime-local"
          value={nuevaFechaHora}
          onChange={(e) => setNuevaFechaHora(e.target.value)}
          disabled={cargando}
        />

        <button 
          onClick={agregarHorario} 
          disabled={!nuevaFechaHora || cargando}
        >
          {cargando ? "Agregando..." : "Agregar"}
        </button>
      </div>

      {cargando && <p>Cargando...</p>}

      <table>
        <thead>
          <tr>
            <th>Fecha y Hora</th>
            <th>Disponibilidad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {horarios.length === 0 && !cargando ? (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center' }}>
                No hay horarios disponibles
              </td>
            </tr>
          ) : (
            horarios.map((h) => (
              <tr key={h.id}>
                <td>{h.fecha?.toLocaleString("es-ES") || "Fecha no válida"}</td>
                <td style={{ color: h.disponibilidad ? "green" : "red" }}>
                  {h.disponibilidad ? "Disponible" : "No disponible"}
                </td>
                <td>
                  <button onClick={() => cambiarEstado(h)} disabled={cargando}>
                    Cambiar Estado
                  </button>
                  <button onClick={() => eliminarHorario(h)} disabled={cargando}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default HorarioD;
