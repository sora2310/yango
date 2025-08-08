import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const uid = cred.user.uid;

      // Opcional: cargar rol del usuario (si existe en Firestore)
      let rol: string | null = null;
      try {
        const uDoc = await getDoc(doc(db, 'usuarios', uid));
        if (uDoc.exists()) {
          const data = uDoc.data() as any;
          rol = data.rol ?? null;
        }
      } catch (_) {}

      // Persistimos sesión mínima
      localStorage.setItem('uid', uid);
      if (rol) localStorage.setItem('rol', rol);

      // Redirige a panel
      navigate('/panel', { replace: true });
    } catch (e: any) {
      const msg = e?.code === 'auth/invalid-credential'
        ? 'Credenciales inválidas'
        : e?.message || 'Error iniciando sesión';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow p-6">
        <div className="flex items-center justify-center mb-4">
          <img src="/logo.png" alt="Yango" className="h-12 w-auto" />
        </div>

        <h1 className="text-xl font-bold mb-1 text-center">Iniciar sesión</h1>
        <p className="text-sm text-gray-600 mb-4 text-center">Ingresa con tu correo y contraseña</p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Correo</label>
            <input
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded p-3"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Contraseña</label>
            <input
              type="password"
              placeholder="********"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full border border-gray-300 rounded p-3"
              required
              autoComplete="current-password"
            />
          </div>

          {err && <p className="text-xs text-red-600">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded p-3 disabled:opacity-50"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 text-sm flex items-center justify-between">
          <Link to="/forgot" className="text-red-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
          {/* Si tienes registro: */}
          {/* <Link to="/register" className="text-gray-600 hover:underline">Crear cuenta</Link> */}
        </div>
      </div>
    </div>
  );
}
