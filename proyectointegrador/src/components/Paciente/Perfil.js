import { useState, useEffect } from "react";
import { auth, db } from "../servicios/firebase.js";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";

const Perfil = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    direccion: "",
    telefono: "",
    fechaNacimiento: "",
    correo: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("No hay usuario autenticado.");
        window.location.href = "/";
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFormData({
            nombre: data.nombre || "",
            apellido: data.apellido || "",
            cedula: data.cedula || "",
            direccion: data.direccion || "",
            telefono: data.telefono || "",
            fechaNacimiento: data.fechaNacimiento
              ? data.fechaNacimiento.toDate().toISOString().split("T")[0]
              : "",
            correo: data.correo || currentUser.email,
          });
        } else {
          alert("No se encontraron datos del usuario.");
        }
      } catch (error) {
        console.error("Error al obtener datos:", error);
        alert("Error al obtener los datos del usuario.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("No hay usuario autenticado.");
      return;
    }

    try {
      const fechaComoTimestamp = formData.fechaNacimiento
        ? Timestamp.fromDate(new Date(formData.fechaNacimiento + "T12:00:00"))
        : null;

      await updateDoc(doc(db, "users", currentUser.uid), {
        nombre: formData.nombre,
        apellido: formData.apellido,
        cedula: formData.cedula,
        direccion: formData.direccion,
        telefono: formData.telefono,
        fechaNacimiento: fechaComoTimestamp,
      });

      alert("Datos actualizados correctamente.");
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("Error al guardar los cambios.");
    }
  };

  if (loading) return <p>Cargando datos...</p>;

  return (
    <div className="perfil-container">
      <h2>Mi Perfil</h2>
      <form onSubmit={handleSave} className="perfil-form">
        <div>
          <label>Correo electrónico:</label>
          <input type="email" value={formData.correo} disabled />
        </div>
        <div>
          <label>Nombres:</label>
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} />
        </div>
        <div>
          <label>Apellidos:</label>
          <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} />
        </div>
        <div>
          <label>Cédula:</label>
          <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} />
        </div>
        <div>
          <label>Dirección:</label>
          <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} />
        </div>
        <div>
          <label>Teléfono:</label>
          <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} />
        </div>
        <div>
          <label>Fecha de Nacimiento:</label>
          <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} />
        </div>
        <button type="submit">Guardar cambios</button>
      </form>
    </div>
  );
};

export default Perfil;
