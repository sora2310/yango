import React, { useState, useEffect } from 'react';
import { FaGift, FaUserCircle } from 'react-icons/fa';
import { auth, db } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  serverTimestamp, 
  addDoc 
} from 'firebase/firestore';

interface Recompensa {
  id: string;
  nombre: string;
  puntosRequeridos: number;
  imageURL: string;
  limitePorUsuario: number;
}

const Panel: React.FC = () => {
  const user = auth.currentUser;
  const [usuarioData, setUsuarioData] = useState<{ nombre: string; puntos: number }>({ nombre: '', puntos: 0 });
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [historialCanje, setHistorialCanje] = useState<string[]>([]);

  // Fetch user info
  useEffect(() => {
    (async () => {
      if (!user) return;
      const uDoc = await getDoc(doc(db, 'usuarios', user.uid));
      if (uDoc.exists()) {
        const data: any = uDoc.data();
        setUsuarioData({ nombre: data.nombre, puntos: data.puntos });
      }
    })();
  }, [user]);

  // Fetch rewards
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'recompensas'));
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Recompensa));
      setRecompensas(list);
    })();
  }, []);

  // Fetch redemption history
  useEffect(() => {
    (async () => {
      if (!user) return;
      const histSnap = await getDocs(collection(db, 'usuarios', user.uid, 'canjes'));
      setHistorialCanje(histSnap.docs.map(d => d.id));
    })();
  }, [user]);

  const canjear = async (rec: Recompensa) => {
    if (!user) return;
    const { puntos } = usuarioData;
    if (puntos < rec.puntosRequeridos) return;
    // Deduct points
    const uRef = doc(db, 'usuarios', user.uid);
    await updateDoc(uRef, { puntos: puntos - rec.puntosRequeridos });
    setUsuarioData(prev => ({ ...prev, puntos: prev.puntos - rec.puntosRequeridos }));
    // Record redemption
    await addDoc(collection(db, 'usuarios', user.uid, 'canjes'), { recompensaId: rec.id, timestamp: serverTimestamp() });
    setHistorialCanje(prev => [...prev, rec.id]);
    alert(`Has canjeado: ${rec.nombre}`);
  };

  return (
    <div className="flex flex-col h-screen bg-red-50">
      {/* Header */}
      <header className="bg-red-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FaUserCircle size={32} />
          <div>
            <h1 className="text-xl font-semibold">{usuarioData.nombre}</h1>
            <p>
              Puntos disponibles: <span className="font-bold">{usuarioData.puntos}</span>
            </p>
          </div>
        </div>
      </header>

      {/* Rewards List */}
      <main className="p-6 overflow-auto flex-1">
        <h2 className="text-2xl mb-4 text-gray-800">Recompensas Disponibles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recompensas.map(rec => {
            const yaCanjeada = historialCanje.includes(rec.id);
            const puede = usuarioData.puntos >= rec.puntosRequeridos && !yaCanjeada;
            return (
              <div key={rec.id} className="bg-white rounded-lg shadow group relative overflow-hidden">
                <img src={rec.imageURL} alt={rec.nombre} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{rec.nombre}</h3>
                  <p>{rec.puntosRequeridos} pts</p>
                </div>
                <button
                  disabled={!puede}
                  onClick={() => canjear(rec)}
                  className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-white $
                    ${puede ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'}
                  `}
                >
                  {yaCanjeada ? 'Canjeada' : 'Canjear'}
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Panel;
