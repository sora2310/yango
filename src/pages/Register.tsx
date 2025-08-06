import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { nombre, apellido, telefono, email, password } = formData;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      await setDoc(doc(db, 'usuarios', uid), {
        nombre,
        apellido,
        telefono,
        email,
        rol: 'conductor',
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form className="bg-black p-8 rounded-lg shadow-lg space-y-4 w-80" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-4 text-center">Registrarse</h2>
        {error && <p className="text-red-500">{error}</p>}
        <input
          name="nombre"
          type="text"
          placeholder="Nombre"
          className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
        <input
          name="apellido"
          type="text"
          placeholder="Apellido"
          className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          value={formData.apellido}
          onChange={handleChange}
          required
        />
        <input
          name="telefono"
          type="tel"
          placeholder="Teléfono"
          className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          value={formData.telefono}
          onChange={handleChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Correo"
          className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Contraseña"
          className="w-full p-2 rounded bg-gray-800 border border-gray-700"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button className="w-full bg-red-600 hover:bg-red-700 py-2 rounded" type="submit">
          Crear cuenta
        </button>
      </form>
    </div>
  );
}

export default Register;
