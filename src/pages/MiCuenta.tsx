import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

function MiCuenta() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    direccion: '',
    email: '',
    avatarUrl: '',
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
            avatarUrl: data.avatarUrl || '',
          });
        }
      }
    };
    fetchUserData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOk(null);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setOk(null);
    const uid = localStorage.getItem('uid');
    if (uid) {
      const docRef = doc(db, 'usuarios', uid);
      await updateDoc(docRef, formData as any);
      setOk('Datos actualizados');
    }
    setSaving(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      <Sidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="flex-1">
        <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <div className="p-6 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Configuración de perfil</h2>

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

            <input
              type="url"
              name="avatarUrl"
              placeholder="URL de tu foto / avatar"
              value={formData.avatarUrl}
              onChange={handleInputChange}
              className="border border-gray-300 bg-white p-3 rounded focus:outline-none md:col-span-2"
            />

            {formData.avatarUrl && (
              <div className="md:col-span-2 flex items-center gap-3">
                <img
                  src={formData.avatarUrl}
                  alt="avatar"
                  className="w-16 h-16 rounded-full object-cover border"
                />
                <span className="text-xs text-gray-500">Vista previa</span>
              </div>
            )}

            <button
              type="submit"
              className="md:col-span-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>

            {ok && (
              <div className="md:col-span-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">
                {ok}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default MiCuenta;
