import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Panel from './pages/Panel';
import AdminPanel from './pages/AdminPanel';
import MiCuenta from './pages/MiCuenta';
import PuntosCambio from './pages/PuntosCambio';
import Contacto from './pages/Contacto';
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const docRef = doc(db, 'usuarios', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUser({ uid: currentUser.uid, ...docSnap.data() });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Entry point: show Login or redirect based on role */}
        <Route
          path="/"
          element={
            !user ? (
              <Login />
            ) : user.rol === 'admin' ? (
              <Navigate to="/panelAdmin" replace />
            ) : (
              <Navigate to="/panel" replace />
            )
          }
        />
        {/* Register only for unauthenticated */}
        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to="/" replace />}
        />
        {/* Conductor routes */}
        <Route
          path="/panel"
          element={
            user && user.rol === 'conductor' ? <Panel /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/mi-cuenta"
          element={
            user && user.rol === 'conductor' ? <MiCuenta /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/puntos-cambio"
          element={
            user && user.rol === 'conductor' ? <PuntosCambio /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/contacto"
          element={
            user && user.rol === 'conductor' ? <Contacto /> : <Navigate to="/" replace />
          }
        />
        {/* Admin route */}
        <Route
          path="/panelAdmin"
          element={
            user && user.rol === 'admin' ? <AdminPanel /> : <Navigate to="/" replace />
          }
        />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
