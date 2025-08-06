import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt with', { email });
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful');
      navigate('/panel');
    } catch (err: any) {
      console.error('Login error', err);
      setError(`${err.code || ''}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form className="bg-black p-8 rounded-lg shadow-lg space-y-4 w-80" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-4 text-center">Iniciar sesión</h2>
        {error && <p className="text-red-500 whitespace-pre-wrap">{error}</p>}
        <input
          className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          className="w-full bg-red-600 hover:bg-red-700 py-2 rounded disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="text-sm text-center">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-red-500 hover:underline">
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
