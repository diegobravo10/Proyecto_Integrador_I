import { auth, provider, db } from "../servicios/firebase.js";
import { signInWithPopup } from "firebase/auth";
import { collection, query, where, getDocs} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./login.css";
const Login = () => {
     const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const uid = user.uid; 
      const email = user.email;

      // Verificar si el usuario ya está en Firestore por UID
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // El usuario ya existe en Firestore
        const userData = querySnapshot.docs[0].data();

        if (userData.rol === "doctor") {
          navigate("/doctor");
          //window.location.href = "/doctor"; // Cambia esta ruta si lo necesitas
        } else if (userData.rol === "paciente") {
          navigate("/paciente");
          //window.location.href = "/paciente";
        } else if (userData.rol === "admin") {
          navigate("/admin");

        } else {
          window.location.href = "/no-autorizado";
        }
      } else {
        // Usuario no existe, redirigir a formulario de registro
        // Guarda temporalmente su UID y correo en localStorage si quieres usarlo en la siguiente página
        
        localStorage.setItem("email", email);
        navigate("/registro");

        // También puedes crear un documento inicial vacío si lo deseas
        // await setDoc(doc(db, "users", uid), { uid, email });

        window.location.href = "/registro"; // Redirige al formulario para completar datos
      }
      localStorage.setItem("uid", uid);

    } catch (error) {
      console.error("Error de login:", error);
      alert("Hubo un problema al iniciar sesión.");
    }
  };

  return (
    <div className="login-container">
      <div className="left-side">
        <img src="/assest/inicio.jpg" alt="Imagen" className="login-image" />
      </div>
      <div className="right-side">
        <h1>Citas Medicas</h1>
          <p className="parrafo">
          ¡Agenda tu consulta médica en línea hoy mismo!
          Facilitamos la gestión de tus citas con un sistema rápido, seguro y disponible las 24 horas.
          </p>
        <button className="principal" onClick={handleLogin}>Ingresar</button>
      </div>
    </div>
  );
};

export default Login;
