import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { auth, db } from '../firebaseConfig';
import { collection, doc, getDoc, getDocs, runTransaction, serverTimestamp, addDoc } from 'firebase/firestore';

interface Reward {
  id: string;
  titulo: string;
  puntos: number;
  descripcion: string;
  imgUrl: string;
  stock?: number;
  limitePorUsuario?: number;
}

function PuntosCambio() {
  const [puntosUsuario, setPuntosUsuario] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [historial, setHistorial] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const uid = auth.currentUser?.uid || localStorage.getItem('uid');
      if (!uid) return;

      const uDoc = await getDoc(doc(db, 'usuarios', uid));
      if (uDoc.exists()) setPuntosUsuario((uDoc.data() as any).puntos || 0);

      const snapHist = await getDocs(collection(db, 'usuarios', uid, 'canjes'));
      setHistorial(snapHist.docs.map(d => d.get('recompensaId') as string));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'recompensas'));
      const list = snap.docs.map(d => ({
        id: d.id,
        titulo: (d.data() as any).nombre,
        puntos: (d.data() as any).puntosRequeridos,
        descripcion: '',
        imgUrl: (d.data() as any).imageURL,
        stock: (d.data() as any).stock,
        limitePorUsuario: (d.data() as any).limitePorUsuario,
      })) as Reward[];
      setRewards(list);
    })();
  }, []);

  const canjear = async (rec: Reward) => {
    const uid = auth.currentUser?.uid || localStorage.getItem('uid');
    if (!uid) return;

    const uRef = doc(db, 'usuarios', uid);
    const rRef = doc(db, 'recompensas', rec.id);

    await runTransaction(db, async (tx) => {
      const u = await tx.get(uRef);
      const r = await tx.get(rRef);
      if (!u.exists() || !r.exists()) throw new Error('Datos no disponibles');

      const uData = u.data() as any;
      const rData = r.data() as any;

      if ((uData.puntos || 0) < (rData.puntosRequeridos || rec.puntos)) {
        throw new Error('Puntos insuficientes');
      }

      const limite = rData.limitePorUsuario ?? rec.limitePorUsuario;
      if (limite && limite > 0) {
        const ya = historial.filter(id => id === rec.id).length;
        if (ya >= limite) throw new Error('Límite por usuario alcanzado');
      }

      const stock: number | undefined = rData.stock;
      if (typeof stock === 'number') {
        if (stock <= 0) throw new Error('Sin stock');
        tx.update(rRef, { stock: stock - 1 });
      }

      tx.update(uRef, { puntos: (uData.puntos || 0) - (rData.puntosRequeridos || rec.puntos) });
    });

    await addDoc(collection(db, 'usuarios', uid, 'canjes'), {
      recompensaId: rec.id,
      timestamp: serverTimestamp()
    });

    setPuntosUsuario(prev => prev - rec.puntos);
    setHistorial(prev => [...prev, rec.id]);
    setRewards(prev => prev.map(r => r.id === rec.id ? ({ ...r, stock: typeof r.stock === 'number' ? r.stock - 1 : r.stock }) : r));
    alert(`Has canjeado: ${rec.titulo}`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Puntos y Recompensas</h2>
          <p className="mb-6">
            Puntos disponibles: <span className="font-semibold">{puntosUsuario}</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rewards.map((reward) => {
              const ya = historial.includes(reward.id);
              const disponible = reward.stock === undefined || reward.stock > 0;
              const puede = puntosUsuario >= reward.puntos && !ya && disponible;
              return (
                <div key={reward.id} className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center shadow-md">
                  <img src={reward.imgUrl} alt={reward.titulo} className="w-24 h-24 object-contain mb-2" />
                  <h3 className="text-lg font-semibold mb-1 text-center">{reward.titulo}</h3>
                  <p className="text-sm text-center mb-2">{reward.descripcion}</p>
                  <p className="mb-2">Puntos requeridos: {reward.puntos}</p>
                  {typeof reward.stock === 'number' && (
                    <p className="text-xs mb-2">Stock: {reward.stock}</p>
                  )}
                  <button onClick={() => canjear(reward)} disabled={!puede} className={`px-4 py-2 rounded ${puede ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>
                    {ya ? 'Canjeada' : (disponible ? 'Reclamar' : 'Sin stock')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PuntosCambio;
