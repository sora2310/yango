import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

function MiCuenta() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    direccion: '',
    email: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const uid = localStorage.getItem('uid');
      if (uid) {
        const docRef = doc(db, 'usuarios', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          setFormData({
            nombre: data.nombre || '',
            apellido: data.apellido || '',
            telefono: data.telefono || '',
            direccion: data.direccion || '',
            email: data.email || '',
          });
        }
      }
    };
    fetchUserData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const uid = localStorage.getItem('uid');
    if (uid) {
      const docRef = doc(db, 'usuarios', uid);
      await updateDoc(docRef, formData as any);
    }
    setSaving(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      <Sidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="flex-1">
        <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Mi Cuenta</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="nombre"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className="border border-gray-300 bg-white p-3 rounded focus:outline-none"
              required
            />
            <input
              type="text"
              name="apellido"
              placeholder="Apellido"
              value={formData.apellido}
              onChange={handleInputChange}
              className="border border-gray-300 bg-white p-3 rounded focus:outline-none"
              required
            />
            <input
              type="tel"
              name="telefono"
              placeholder="Teléfono"
              value={formData.telefono}
              onChange={handleInputChange}
              className="border border-gray-300 bg-white p-3 rounded focus:outline-none"
              required
            />
            <input
              type="text"
              name="direccion"
              placeholder="Dirección"
              value={formData.direccion}
              onChange={handleInputChange}
              className="border border-gray-300 bg-white p-3 rounded focus:outline-none"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              className="border border-gray-300 bg-white p-3 rounded focus:outline-none"
              required
            />
            <button
              type="submit"
              className="md:col-span-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MiCuenta;
