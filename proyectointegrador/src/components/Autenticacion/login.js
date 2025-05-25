import { auth, provider, db } from "../servicios/firebase.js";
import { signInWithPopup } from "firebase/auth";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";

const Login = () => {

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const uid = user.uid; // 🔥 Este es el UID único del usuario
      const email = user.email;

      // Verificar si el usuario ya está en Firestore por UID
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // El usuario ya existe en Firestore
        const userData = querySnapshot.docs[0].data();
        alert(`Bienvenido, ${userData.rol}`);

        if (userData.rol === "doctor") {
          //window.location.href = "/doctor"; // Cambia esta ruta si lo necesitas
        } else if (userData.rol === "paciente") {
          //window.location.href = "/paciente";
        } else {
          window.location.href = "/no-autorizado";
        }
      } else {
        // Usuario no existe, redirigir a formulario de registro
        // Guarda temporalmente su UID y correo en localStorage si quieres usarlo en la siguiente página
        localStorage.setItem("uid", uid);
        localStorage.setItem("email", email);
        navigate("/registro");

        // También puedes crear un documento inicial vacío si lo deseas
        // await setDoc(doc(db, "users", uid), { uid, email });

        window.location.href = "/registro"; // Redirige al formulario para completar datos
      }

    } catch (error) {
      console.error("Error de login:", error);
      alert("Hubo un problema al iniciar sesión.");
    }
  };

  return (
    <div>
      <h2>Inicia sesión</h2>
      <button onClick={handleLogin}>
        Iniciar sesión con Google
      </button>
    </div>
  );
};

export default Login;
