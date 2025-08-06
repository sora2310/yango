import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';

const AsignarPuntosForm: React.FC = () => {
  const [uid, setUid] = useState('');
  const [puntos, setPuntos] = useState(0);
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsignarPuntos = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userRef = doc(db, 'usuarios', uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        alert('No se encontró al conductor con ese UID.');
        setLoading(false);
        return;
      }

      const { nombre } = userSnap.data();

      await addDoc(collection(db, 'puntos'), {
        uid,
        nombre,
        puntos,
        descripcion,
        fecha: serverTimestamp(),
      });

      alert('✅ Puntos asignados correctamente');
      setUid('');
      setPuntos(0);
      setDescripcion('');
    } catch (error: any) {
      console.error(error);
      alert('❌ Error al asignar puntos: ' + error.message);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleAsignarPuntos} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
      <h3>Asignar puntos</h3>
      <label>
        UID del conductor:
        <input type="text" value={uid} onChange={(e) => setUid(e.target.value)} required />
      </label>
      <label>
        Cantidad de puntos:
        <input type="number" value={puntos} onChange={(e) => setPuntos(parseInt(e.target.value))} required />
      </label>
      <label>
        Descripción:
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Asignando...' : 'Asignar puntos'}
      </button>
    </form>
  );
};

export default AsignarPuntosForm;
