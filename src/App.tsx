import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Panel from './pages/Panel';
import PuntosCambio from './pages/PuntosCambio';
import MiCuenta from './pages/MiCuenta';
import AdminPanel from './pages/AdminPanel';

type Role = 'admin' | 'driver' | null;

export default function App() {
  const [user, setUser] = React.useState<any>(null);
  const [role, setRole] = React.useState<Role>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u?.uid) {
        localStorage.setItem('uid', u.uid);
        // 1) intenta leer rol desde Firestore
        try {
          const snap = await getDoc(doc(db, 'usuarios', u.uid));
          const r = (snap.exists() ? (snap.data() as any).rol : null) as Role;
          setRole(r || (localStorage.getItem('rol') as Role) || 'driver');
          if (r) localStorage.setItem('rol', r);
        } catch {
          setRole((localStorage.getItem('rol') as Role) || 'driver');
        }
      } else {
        localStorage.removeItem('uid');
        localStorage.removeItem('rol');
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return <div className="grid place-items-center min-h-screen text-gray-600">Cargando…</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        {!user && (
          <>
            <Route path="/" element={<Login />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {/* Privadas */}
        {user && (
          <>
            {/* Home por rol */}
            <Route
              path="/"
              element={<Navigate to={role === 'admin' ? '/admin' : '/panel'} replace />}
            />

            {/* Solo admin */}
            <Route
              path="/admin"
              element={role === 'admin' ? <AdminPanel /> : <Navigate to="/panel" replace />}
            />

            {/* Solo driver (o admin si quieres permitir ver el panel de conductor) */}
            <Route path="/panel" element={<Panel />} />
            <Route path="/puntos-cambio" element={<PuntosCambio />} />
            <Route path="/mi-cuenta" element={<MiCuenta />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to={role === 'admin' ? '/admin' : '/panel'} replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}
