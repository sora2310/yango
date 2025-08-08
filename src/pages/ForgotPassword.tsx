import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (e: any) {
      setErr(e.message || 'Error enviando el correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow p-6">
        <h1 className="text-xl font-bold mb-2">Recuperar contraseña</h1>
        <p className="text-sm text-gray-600 mb-4">
          Ingresa tu correo y te enviaremos un enlace para restablecerla.
        </p>
        {sent ? (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-3">
            Si el correo existe, hemos enviado el enlace para restablecer la contraseña.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="tu@correo.com"
              className="w-full border border-gray-300 rounded p-3"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
            />
            {err && <p className="text-xs text-red-600">{err}</p>}
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded p-3 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}
        <div className="mt-4 text-sm">
          <Link to="/" className="text-red-600 hover:underline">Volver a iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
}
