import React, { useState, useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa';
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

  // Info usuario
  useEffect(() => {
    (async () => {
      if (!user) return;
      const uDoc = await getDoc(doc(db, 'usuarios', user.uid));
      if (uDoc.exists()) {
        const data: any = uDoc.data();
        setUsuarioData({ nombre: data.nombre || '', puntos: data.puntos || 0 });
      }
    })();
  }, [user]);

  // Recompensas
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'recompensas'));
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Recompensa));
      setRecompensas(list);
    })();
  }, []);

  // Historial de canjes
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
    // Descontar puntos
    const uRef = doc(db, 'usuarios', user.uid);
    await updateDoc(uRef, { puntos: puntos - rec.puntosRequeridos });
    setUsuarioData(prev => ({ ...prev, puntos: prev.puntos - rec.puntosRequeridos }));
    // Registrar canje
    await addDoc(collection(db, 'usuarios', user.uid, 'canjes'), {
      recompensaId: rec.id,
      timestamp: serverTimestamp()
    });
    setHistorialCanje(prev => [...prev, rec.id]);
    alert(`Has canjeado: ${rec.nombre}`);
  };

  // Datos de demo para KPIs/historial (conecta luego a tus colecciones)
  const kpis = [
    { k: 'Viajes hoy', v: 8 },
    { k: 'Pts hoy', v: 160 },
    { k: 'Racha (días)', v: 3 },
    { k: 'Ranking semanal', v: '#12' },
  ];

  const progresoMeta = Math.min(100, (usuarioData.puntos / 2500) * 100);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white text-gray-800 p-4 flex items-center justify-between border-b border-gray-200 shadow-sm">
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

      <main className="p-6 overflow-auto flex-1 max-w-6xl mx-auto w-full">
        {/* KPI cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {kpis.map((it, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow">
              <p className="text-xs text-gray-500">{it.k}</p>
              <p className="text-xl font-bold">{it.v}</p>
            </div>
          ))}
        </section>

        {/* Meta hacia recompensa grande */}
        <section className="bg-white border border-gray-200 rounded-lg p-4 shadow mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Progreso hacia “Cambio de aceite”</p>
              <p className="text-2xl font-bold">{usuarioData.puntos} / 2500 pts</p>
            </div>
            <a href="/puntos-cambio" className="bg-red-600 text-white rounded px-4 py-2">
              Ver recompensas
            </a>
          </div>
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-red-600" style={{ width: `${progresoMeta}%` }} />
          </div>
        </section>

        {/* Invita y gana */}
        <section className="bg-white border border-gray-200 rounded-lg p-4 shadow mb-6">
          <h3 className="font-semibold">Invita y gana</h3>
          <p className="text-sm text-gray-600">Gana 200 pts por cada conductor que se una con tu enlace.</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/register?ref=${user?.uid || ''}`)}
              className="bg-red-600 text-white rounded px-4 py-2"
            >
              Copiar enlace
            </button>
            <button className="bg-white border border-gray-200 rounded px-4 py-2">Ver reglas</button>
          </div>
        </section>

        {/* Historial mini (demo) */}
        <section className="bg-white border border-gray-200 rounded-lg p-4 shadow mb-6">
          <h3 className="font-semibold mb-2">Actividad reciente</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>+20 pts • Viaje #XC123 • hace 1h</li>
            <li>+20 pts • Viaje #XC124 • hace 2h</li>
            <li>-800 pts • Canje “Lavado premium” • hace 4h</li>
          </ul>
        </section>

        {/* Recompensas */}
        <h2 className="text-2xl mb-4 text-gray-800">Recompensas Disponibles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recompensas.map((rec) => {
            const yaCanjeada = historialCanje.includes(rec.id);
            const puede = usuarioData.puntos >= rec.puntosRequeridos && !yaCanjeada;
            return (
              <div
                key={rec.id}
                className="bg-white border border-gray-200 rounded-lg p-0 shadow group relative overflow-hidden"
              >
                <img src={rec.imageURL} alt={rec.nombre} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{rec.nombre}</h3>
                  <p className="text-sm text-gray-600">{rec.puntosRequeridos} pts</p>
                </div>
                <button
                  disabled={!puede}
                  onClick={() => canjear(rec)}
                  className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-white ${
                    puede ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'
                  }`}
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
