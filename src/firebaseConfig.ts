// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBU9c2zCgyxZvidc8cr8B26WhB9CgrVXSw",
  authDomain: "pagina-fidelizacion.firebaseapp.com",
  projectId: "pagina-fidelizacion",
  storageBucket: "pagina-fidelizacion.appspot.com", // ✅ CORREGIDO
  messagingSenderId: "492168969544",
  appId: "1:492168969544:web:1eb264319fc76cbac4877d"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar módulos necesarios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
