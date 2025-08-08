import React, { useState, useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { Settings } from 'lucide-react';
import { auth, db } from '../firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  updateDoc,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';

interface Recompensa {
  id: string;
  nombre: string;
  puntosRequeridos: number;
  imageURL: string;
  limitePorUsuario?: number;
  stock?: number; // stock global
}

interface SettingsModel {
  notificaciones: boolean;
  idioma: 'es' | 'en';
  tema: 'claro' | 'oscuro' | 'sistema';
}

const defaultSettings: SettingsModel = {
  notificaciones: true,
  idioma: 'es',
  tema: 'claro',
};

const Panel: React.FC = () => {
  const user = auth.currentUser;
  const [usuarioData, setUsuarioData] = useState<{ nombre: string; puntos: number }>({ nombre: '', puntos: 0 });
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [historialCanje, setHistorialCanje] = useState<string[]>([]);
  const [tab, setTab] = useState<'resumen' | 'config'>('resumen');
  const [settings, setSettings] = useState<SettingsModel>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Detectar tab por query (?tab=config)
  useEffect(() => {
    const url = new URL(window.location.href);
    const t = url.searchParams.get('tab');
    if (t === 'config') setTab('config');
  }, []);

  // Cargar datos usuario + settings
  useEffect(() => {
    (async () => {
      if (!user) return setLoading(false);
      const uDoc = await getDoc(doc(db, 'usuarios', user.uid));
      if (uDoc.exists()) {
        const data: any = uDoc.data();
        setUsuarioData({ nombre: data.nombre || '', puntos: data.puntos || 0 });
      }
      const sDoc = await getDoc(doc(db, 'usuarios', user.uid, 'meta', 'settings'));
      if (sDoc.exists()) {
        setSettings({ ...(defaultSettings as SettingsModel), ...(sDoc.data() as SettingsModel) });
      }
      setLoading(false);
    })();
  }, [user]);

  // Cargar recompensas
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'recompensas'));
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Recompensa));
      setRecompensas(list);
    })();
  }, []);

  // Historial de canjes del usuario
  useEffect(() => {
    (async () => {
      if (!user) return;
      const histSnap = await getDocs(collection(db, 'usuarios', user.uid, 'canjes'));
      setHistorialCanje(histSnap.docs.map(d => d.get('recompensaId') as string));
    })();
  }, [user]);

  // Canjear con transacción (respeta stock y límite por usuario)
  const canjear = async (rec: Recompensa) => {
    if (!user) return;
    const uRef = doc(db, 'usuarios', user.uid);
    const rRef = doc(db, 'recompensas', rec.id);

    await runTransaction(db, async (tx) => {
      const u = await tx.get(uRef);
      const r = await tx.get(rRef);
      if (!u.exists() || !r.exists()) throw new Error('Datos no disponibles');

      const uData = u.data() as any;
      const rData = r.data() as Recompensa;

      if ((uData.puntos || 0) < (rData.puntosRequeridos || rec.puntosRequeridos)) {
        throw new Error('Puntos insuficientes');
      }

      const limite = rData.limitePorUsuario ?? rec.limitePorUsuario;
      if (limite && limite > 0) {
        const ya = historialCanje.filter(id => id === rec.id).length;
        if (ya >= limite) throw new Error('Límite por usuario alcanzado');
      }

      const stock = (rData.stock ?? rec.stock ?? undefined);
      if (typeof stock === 'number') {
        if (stock <= 0) throw new Error('Sin stock');
        tx.update(rRef, { stock: stock - 1 });
      }

      tx.update(uRef, { puntos: (uData.puntos || 0) - (rData.puntosRequeridos || rec.puntosRequeridos) });
    });

    await addDoc(collection(db, 'usuarios', user.uid, 'canjes'), {
      recompensaId: rec.id,
      timestamp: serverTimestamp()
    });

    setUsuarioData(prev => ({ ...prev, puntos: prev.puntos - rec.puntosRequeridos }));
    setHistorialCanje(prev => [...prev, rec.id]);
    setRecompensas(prev => prev.map(r => r.id === rec.id
      ? ({ ...r, stock: typeof r.stock === 'number' ? Math.max(0, r.stock - 1) : r.stock })
      : r
    ));
    alert(`Has canjeado: ${rec.nombre}`);
  };

  const saveSettings = async () => {
    if (!user) return;
    // Si el doc no existe, updateDoc fallará; en ese caso puedes usar setDoc.
    await updateDoc(doc(db, 'usuarios', user.uid, 'meta', 'settings'), settings as any).catch(() => {});
    alert('Configuración guardada');
  };

  const kpis = [
    { k: 'Viajes hoy', v: 8 },
    { k: 'Pts hoy', v: 160 },
    { k: 'Racha (días)', v: 3 },
    { k: 'Ranking semanal', v: '#12' },
  ];

  const progresoMeta = Math.min(100, (usuarioData.puntos / 2500) * 100);

  if (loading) return <div className="p-6 text-gray-500">Cargando…</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header con toggle + botón Settings en móvil */}
      <header className="bg-white text-gray-800 p-4 flex items-center justify-between border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <FaUserCircle size={32} />
          <div>
            <h1 className="text-xl font-semibold">{usuarioData.nombre || 'Conductor'}</h1>
            <p>Puntos disponibles: <span className="font-bold">{usuarioData.puntos}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón con icono (móvil) */}
          <button
            onClick={() => setTab((t) => (t === 'resumen' ? 'config' : 'resumen'))}
            aria-label="Abrir configuración"
            title={tab === 'config' ? 'Ver resumen' : 'Abrir configuración'}
            className="inline-flex md:hidden items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white hover:bg-gray-100 transition"
          >
            <Settings className={`w-5 h-5 ${tab === 'config' ? 'text-red-600' : 'text-gray-700'}`} />
          </button>

          {/* Toggle pastilla (desktop) */}
          <div className="hidden md:flex p-1 rounded-full border border-gray-200 bg-white">
            <button
              onClick={() => setTab('resumen')}
              className={`px-3 py-1.5 rounded-full text-sm transition ${
                tab === 'resumen' ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setTab('config')}
              className={`px-3 py-1.5 rounded-full text-sm transition flex items-center gap-1.5 ${
                tab === 'config' ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              Configuración
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 overflow-auto flex-1 max-w-6xl mx-auto w-full">
        {tab === 'resumen' && (
          <div className="animate-[fadeIn_.25s_ease] motion-reduce:animate-none">
            {/* KPI cards */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {kpis.map((it, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow transition hover:shadow-md">
                  <p className="text-xs text-gray-500">{it.k}</p>
                  <p className="text-xl font-bold">{it.v}</p>
                </div>
              ))}
            </section>

            {/* Meta hacia recompensa grande */}
            <section className="bg-white border border-gray-200 rounded-lg p-4 shadow mb-6 transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Progreso hacia “Cambio de aceite”</p>
                  <p className="text-2xl font-bold">{usuarioData.puntos} / 2500 pts</p>
                </div>
                <a href="/puntos-cambio" className="bg-red-600 text-white rounded px-4 py-2 hover:bg-red-700 transition">
                  Ver recompensas
                </a>
              </div>
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 transition-all" style={{ width: `${progresoMeta}%` }} />
              </div>
            </section>

            {/* Invita y gana */}
            <section className="bg-white border border-gray-200 rounded-lg p-4 shadow mb-6 transition hover:shadow-md">
              <h3 className="font-semibold">Invita y gana</h3>
              <p className="text-sm text-gray-600">Gana 200 pts por cada conductor que se una.</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/register?ref=${user?.uid || ''}`)}
                  className="bg-red-600 text-white rounded px-4 py-2 hover:bg-red-700 transition"
                >
                  Copiar enlace
                </button>
                <button className="bg-white border border-gray-200 rounded px-4 py-2 hover:bg-gray-100 transition">
                  Ver reglas
                </button>
              </div>
            </section>

            {/* Recompensas */}
            <h2 className="text-2xl mb-4 text-gray-800">Recompensas Disponibles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recompensas.map((rec) => {
                const yaCanjeada = historialCanje.includes(rec.id);
                const disponible = rec.stock === undefined || rec.stock > 0;
                const puede = usuarioData.puntos >= rec.puntosRequeridos && !yaCanjeada && disponible;

                return (
                  <div
                    key={rec.id}
                    className="bg-white border border-gray-200 rounded-lg p-0 shadow group relative overflow-hidden transition hover:shadow-md"
                  >
                    <img src={rec.imageURL} alt={rec.nombre} className="w-full h-40 object-cover" />
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{rec.nombre}</h3>
                        {typeof rec.stock === 'number' && (
                          <span className={`text-xs px-2 py-1 rounded-full border ${rec.stock > 0 ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-gray-200 text-gray-500 bg-gray-50'}`}>
                            Stock: {rec.stock}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{rec.puntosRequeridos} pts</p>
                    </div>
                    <button
                      disabled={!puede}
                      onClick={() => canjear(rec)}
                      className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-white transition ${
                        puede ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {yaCanjeada ? 'Canjeada' : (disponible ? 'Canjear' : 'Sin stock')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'config' && (
          <div className="animate-[fadeIn_.25s_ease] motion-reduce:animate-none">
            <section className="bg-white border border-gray-200 rounded-lg p-4 shadow max-w-2xl transition hover:shadow-md">
              <h3 className="font-semibold text-lg mb-4">Configuración</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notificaciones</span>
                  <input
                    type="checkbox"
                    checked={settings.notificaciones}
                    onChange={(e) => setSettings(s => ({ ...s, notificaciones: e.target.checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Idioma</span>
                  <select
                    value={settings.idioma}
                    onChange={(e) => setSettings(s => ({ ...s, idioma: e.target.value as SettingsModel['idioma'] }))}
                    className="border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Tema</span>
                  <select
                    value={settings.tema}
                    onChange={(e) => setSettings(s => ({ ...s, tema: e.target.value as SettingsModel['tema'] }))}
                    className="border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="claro">Claro</option>
                    <option value="oscuro">Oscuro</option>
                    <option value="sistema">Sistema</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={saveSettings} className="bg-red-600 text-white rounded px-4 py-2 hover:bg-red-700 transition">Guardar</button>
                  <a href="/mi-cuenta" className="bg-white border border-gray-200 rounded px-4 py-2 hover:bg-gray-100 transition">Editar perfil</a>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default Panel;
