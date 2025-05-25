// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJ6T872XITIO3GeCfaL4lY9gfp_lZl21o",
  authDomain: "citas-medicas-prointegrador.firebaseapp.com",
  projectId: "citas-medicas-prointegrador",
  storageBucket: "citas-medicas-prointegrador.firebasestorage.app",
  messagingSenderId: "339209192437",
  appId: "1:339209192437:web:c36848227547ec3ebd16bc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);