import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import {
  FaUsers,
  FaGift,
  FaFileUpload,
  FaHistory,
  FaCog,
  FaEdit,
  FaTrash
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { db, storage } from '../firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  doc as firestoreDoc,
  getDoc,
  where,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface Usuario {
  id: string;
  nombre: string;
  telefono: string;
  licencia: string;
  ciudad: string;
  puntos: number;
}

interface Recompensa {
  id: string;
  nombre: string;
  puntosRequeridos: number;
  imageURL: string;
  limitePorUsuario: number;
}

interface UploadRecord {
  id: string;
  fileName: string;
  timestamp: any;
  uploader: string;
  url: string;
}

const AdminPanel: React.FC = () => {
  const sections = [
    { key: 'usuarios', label: 'Usuarios', icon: <FaUsers /> },
    { key: 'recompensas', label: 'Recompensas', icon: <FaGift /> },
    { key: 'upload', label: 'Subir Puntos', icon: <FaFileUpload /> },
    { key: 'historial', label: 'Historial', icon: <FaHistory /> },
    { key: 'config', label: 'Configuración', icon: <FaCog /> },
  ];
  const [active, setActive] = useState<string>('usuarios');

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [uploadRecords, setUploadRecords] = useState<UploadRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [newRec, setNewRec] = useState<Partial<Recompensa>>({
    nombre: '', puntosRequeridos: 0, imageURL: '', limitePorUsuario: 1
  });
  const [editingRecId, setEditingRecId] = useState<string | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(true);

  const [themeColor, setThemeColor] = useState<string>('red');
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string>('');

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'usuarios'));
      setUsuarios(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...(d.data() as any) })) as Usuario[]);
      setLoadingUsers(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const q = query(collection(db, 'uploads'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      setUploadRecords(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...(d.data() as any) })) as UploadRecord[]);
      setLoadingHistory(false);
    })();
  }, []);

  const loadRecs = async () => {
    const snap = await getDocs(collection(db, 'recompensas'));
    setRecompensas(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Recompensa[]);
  };
  useEffect(() => { loadRecs().then(() => setLoadingRecs(false)); }, []);

  useEffect(() => {
    (async () => {
      const cfgRef = firestoreDoc(db, 'config', 'general');
      const snap = await getDoc(cfgRef);
      if (snap.exists()) setThemeColor(snap.data().themeColor || 'red');
      setLoadingConfig(false);
    })();
  }, []);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] || null);
    setUploadMessage('');
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return setUploadMessage('⚠️ Debes seleccionar un archivo primero');
    try {
      const data = await selectedFile.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      const missing: string[] = [];
      let updatedCount = 0;
      for (const row of rows) {
        const docu = String(row.licencia);
        const pts = Number(row.puntos);
        if (isNaN(pts)) continue;
        const q = query(collection(db, 'usuarios'), where('licencia', '==', docu));
        const snapUsers = await getDocs(q);
        if (snapUsers.empty) { missing.push(docu); continue; }
        for (const d of snapUsers.docs) {
          const uRef = firestoreDoc(db, 'usuarios', d.id);
          const data: any = d.data();
          const current = Number(data.puntos) || 0;
          await updateDoc(uRef, { puntos: current + pts });
          updatedCount++;
        }
      }
      const storageRef = ref(storage, `uploads/${selectedFile.name}`);
      await uploadBytes(storageRef, selectedFile);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, 'uploads'), {
        fileName: selectedFile.name,
        timestamp: serverTimestamp(),
        uploader: 'admin', url
      });
      setUploadRecords(prev => [
        { id: '', fileName: selectedFile.name, timestamp: new Date(), uploader: 'admin', url },
        ...prev
      ]);
      setUploadMessage(`✅ ${updatedCount} usuarios actualizados.` + (missing.length ? ' No encontrados: ' + missing.join(', ') : ''));
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      setUploadMessage('❌ Error al procesar la carga.');
    }
  };

  const handleRecChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRec(prev => ({ ...prev, [name]: ['puntosRequeridos','limitePorUsuario'].includes(name) ? Number(value) : value }));
  };

  const handleRecSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newRec.nombre) return;
    try {
      if (editingRecId) await updateDoc(firestoreDoc(db, 'recompensas', editingRecId), newRec as any);
      else await addDoc(collection(db, 'recompensas'), newRec as any);
    } catch (err: any) {
      if (editingRecId && err.code === 'not-found') await addDoc(collection(db, 'recompensas'), newRec as any);
      else {
        console.error('Error:', err);
        alert('Error al guardar recompensa');
      }
    }
    setEditingRecId(null);
    setNewRec({ nombre: '', puntosRequeridos: 0, imageURL: '', limitePorUsuario: 1 });
    loadRecs();
  };

  const handleEditRec = (rec: Recompensa) => {
    setEditingRecId(rec.id);
    setNewRec(rec);
  };

  const handleDeleteRec = async (id: string) => {
    if (window.confirm('¿Eliminar esta recompensa?')) {
      await deleteDoc(firestoreDoc(db, 'recompensas', id));
      loadRecs();
    }
  };

  const handleConfigSave = async () => {
    const cfgRef = firestoreDoc(db, 'config', 'general');
    try {
      await updateDoc(cfgRef, { themeColor });
    } catch (err: any) {
      if (err.code === 'not-found') {
        await addDoc(collection(db, 'config'), { themeColor, createdAt: serverTimestamp() });
      }
    }
    alert('Configuración guardada');
  };

  return (
    <div className="flex h-screen">
      <aside className={`w-64 bg-${themeColor}-600 text-white p-4`}>
        {sections.map(sec => (
          <button
            key={sec.key}
            onClick={() => setActive(sec.key)}
            className={`flex items-center space-x-2 w-full p-2 mb-2 rounded ${active === sec.key ? `bg-${themeColor}-800` : ''}`}
          >
            {sec.icon}<span>{sec.label}</span>
          </button>
        ))}
      </aside>
      <main className="flex-1 p-6 bg-gray-100 overflow-auto">
        {active === 'usuarios' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Usuarios Registrados</h2>
            {loadingUsers ? <p>Cargando...</p> : (
              <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
                <thead><tr className="bg-gray-200">
                  <th className="px-4 py-2">Nombre</th>
                  <th className="px-4 py-2">Teléfono</th>
                  <th className="px-4 py-2">Licencia</th>
                  <th className="px-4 py-2">Ciudad</th>
                  <th className="px-4 py-2">Puntos</th>
                </tr></thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id} className="border-t">
                      <td className="px-4 py-2">{u.nombre}</td>
                      <td className="px-4 py-2">{u.telefono}</td>
                      <td className="px-4 py-2">{u.licencia}</td>
                      <td className="px-4 py-2">{u.ciudad}</td>
                      <td className="px-4 py-2">{u.puntos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {active === 'recompensas' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Gestión de Recompensas</h2>
            <form onSubmit={handleRecSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              <input name="nombre" value={newRec.nombre || ''} onChange={handleRecChange} placeholder="Nombre" className="p-2 border rounded" />
              <input name="puntosRequeridos" type="number" value={newRec.puntosRequeridos || 0} onChange={handleRecChange} placeholder="Puntos" className="p-2 border rounded" />
              <input name="imageURL" value={newRec.imageURL || ''} onChange={handleRecChange} placeholder="Imagen URL" className="p-2 border rounded" />
              <input name="limitePorUsuario" type="number" value={newRec.limitePorUsuario || 1} onChange={handleRecChange} placeholder="Límite por usuario" className="p-2 border rounded" />
              <button type="submit" className="col-span-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                {editingRecId ? 'Guardar cambios' : 'Agregar recompensa'}
              </button>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recompensas.map(r => (
                <div key={r.id} className="group bg-white p-4 rounded-lg shadow relative">
                  <img src={r.imageURL} alt={r.nombre} className="w-full h-32 object-cover rounded" />
                  <h3 className="mt-2 font-semibold text-lg">{r.nombre}</h3>
                  <p>{r.puntosRequeridos} pts</p>
                  <p>Límite: {r.limitePorUsuario}</p>
                  <div className="absolute top-2 right-2 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditRec(r)} className="text-blue-600 hover:text-blue-800"><FaEdit /></button>
                    <button onClick={() => handleDeleteRec(r.id)} className="text-red-600 hover:text-red-800"><FaTrash /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {active === 'upload' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Subir Puntos por XLSX</h2>
            <input type="file" accept=".xlsx" onChange={handleFileSelect} className="mb-4" />
            <button onClick={handleFileUpload} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
              Confirmar Carga
            </button>
            {uploadMessage && <p className="mt-2 text-sm text-gray-800 whitespace-pre-line">{uploadMessage}</p>}
          </div>
        )}

        {active === 'historial' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Historial de Subidas</h2>
            {loadingHistory ? <p>Cargando...</p> : (
              <ul className="space-y-2">
                {uploadRecords.map(r => (
                  <li key={r.id} className="bg-white p-3 rounded shadow">
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{r.fileName}</a>
                    <span className="ml-2 text-gray-500">{new Date((r.timestamp?.seconds || 0) * 1000).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {active === 'config' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Configuración</h2>
            {loadingConfig ? <p>Cargando...</p> : (
              <div className="space-y-4">
                <label className="block">
                  Color tema:
                  <input value={themeColor} onChange={e => setThemeColor(e.target.value)} className="ml-2 p-1 border rounded" />
                </label>
                <button onClick={handleConfigSave} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Guardar</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
