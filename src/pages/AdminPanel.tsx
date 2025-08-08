import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  writeBatch,
  increment,
} from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../firebaseConfig";

/* ──────────────────────────────────────────────────────────────
   Tipos
────────────────────────────────────────────────────────────── */
type Driver = {
  id: string;       // uid
  nombre?: string;
  apellido?: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  avatarUrl?: string;
  licencia?: string;       // o numeroLicencia
  puntos?: number;
};

type UploadRow = {
  licencia: string;
  puntos: number;
  error?: string;
};

type UploadLog = {
  id: string;
  filename: string;
  size: number;
  uploadedAt: any;
  processedAt?: any;
  byUid: string;
  byEmail: string;
  total: number;
  ok: number;
  fail: number;
};

/* ──────────────────────────────────────────────────────────────
   Helpers UI
────────────────────────────────────────────────────────────── */
function Toast({
  message,
  type = "success",
  onClose,
}: {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}) {
  const color =
    type === "success"
      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
      : type === "error"
      ? "bg-red-50 border-red-200 text-red-800"
      : "bg-blue-50 border-blue-200 text-blue-800";

  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 border rounded-lg px-4 py-3 shadow ${color}`}>
      <p className="text-sm">{message}</p>
    </div>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg bg-white rounded-xl shadow border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Página
────────────────────────────────────────────────────────────── */
export default function AdminPanel() {
  const [tab, setTab] = useState<"drivers" | "upload" | "history">("drivers");
  const [toast, setToast] = useState<{msg: string; type?: "success" | "error" | "info"}|null>(null);

  /* DRIVERS */
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [qText, setQText] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [editDeltaPts, setEditDeltaPts] = useState(0);

  /* UPLOAD */
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<UploadRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [processing, setProcessing] = useState(false);

  /* HISTORY */
  const [logs, setLogs] = useState<UploadLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const adminEmail = auth.currentUser?.email || "admin@yango.app";
  const adminUid = auth.currentUser?.uid || "unknown";

  /* ── Cargar conductores ── */
  const loadDrivers = async () => {
    setLoadingDrivers(true);
    const qCol = query(collection(db, "usuarios"), orderBy("nombre", "asc"));
    const snap = await getDocs(qCol);
    setDrivers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Driver[]);
    setLoadingDrivers(false);
  };

  /* ── Cargar historial ── */
  const loadLogs = async () => {
    setLoadingLogs(true);
    const ql = query(collection(db, "uploads"), orderBy("uploadedAt", "desc"));
    const snap = await getDocs(ql);
    setLogs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as UploadLog[]);
    setLoadingLogs(false);
  };

  useEffect(() => {
    loadDrivers();
    loadLogs();
  }, []);

  /* ── Filtro conductores ── */
  const filteredDrivers = useMemo(() => {
    const q = qText.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter((d) => {
      return (
        d.nombre?.toLowerCase().includes(q) ||
        d.apellido?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.telefono?.toLowerCase().includes(q) ||
        d.licencia?.toLowerCase().includes(q) ||
        (d as any).numeroLicencia?.toLowerCase?.().includes(q)
      );
    });
  }, [qText, drivers]);

  /* ── Abrir edición ── */
  const openEdit = (d: Driver) => {
    setEditing(d);
    setEditDeltaPts(0);
    setEditOpen(true);
  };

  /* ── Guardar cambios de conductor ── */
  const saveDriver = async () => {
    if (!editing) return;
    const refU = doc(db, "usuarios", editing.id);
    const payload: any = {
      nombre: editing.nombre || "",
      apellido: editing.apellido || "",
      telefono: editing.telefono || "",
      direccion: editing.direccion || "",
      avatarUrl: editing.avatarUrl || "",
      licencia: editing.licencia || (editing as any).numeroLicencia || "",
    };
    if (editDeltaPts !== 0) payload.puntos = increment(editDeltaPts);

    await updateDoc(refU, payload);
    setToast({ msg: "Conductor actualizado", type: "success" });
    setEditOpen(false);
    // refresca fila
    const docSnap = await getDoc(refU);
    setDrivers((prev) =>
      prev.map((x) => (x.id === editing.id ? ({ id: editing.id, ...(docSnap.data() as any) } as Driver) : x))
    );
  };

  /* ── Parser CSV: licencia,puntos ── */
  const parseCSV = async () => {
    if (!file) return;
    setParsing(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

      const rows: UploadRow[] = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Encabezado opcional
        if (i === 0 && /licencia/i.test(line) && /punto/i.test(line)) continue;

        const parts = line.split(",").map((p) => p.trim());
        if (parts.length < 2) {
          rows.push({ licencia: "", puntos: 0, error: "Fila inválida" });
          continue;
        }
        const licencia = parts[0];
        const puntos = Number(parts[1]);
        if (!licencia || isNaN(puntos)) {
          rows.push({ licencia, puntos: 0, error: "Datos inválidos" });
          continue;
        }
        rows.push({ licencia, puntos });
      }
      setPreview(rows);
      setToast({ msg: `Leídas ${rows.length} filas`, type: "info" });
    } catch (e: any) {
      setToast({ msg: e?.message ?? "Error leyendo CSV", type: "error" });
    } finally {
      setParsing(false);
    }
  };

  /* ── Helper: buscar usuario por licencia ── */
  const findUserByLicencia = async (lic: string) => {
    let q1 = query(collection(db, "usuarios"), where("licencia", "==", lic));
    let s1 = await getDocs(q1);
    if (!s1.empty) return s1.docs[0];

    let q2 = query(collection(db, "usuarios"), where("numeroLicencia", "==", lic));
    let s2 = await getDocs(q2);
    if (!s2.empty) return s2.docs[0];

    return null;
  };

  /* ── Procesar carga de puntos ── */
  const processUpload = async () => {
    if (!file || preview.length === 0) return;
    setProcessing(true);
    try {
      // 1) Sube el archivo a Storage
      const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);

      // 2) Crea log inicial
      const logRef = doc(collection(db, "uploads"));
      await setDoc(logRef, {
        filename: file.name,
        size: file.size,
        uploadedAt: serverTimestamp(),
        byUid: adminUid,
        byEmail: adminEmail,
        total: preview.length,
        ok: 0,
        fail: 0,
      });

      // 3) Aplica puntos por lotes
      let ok = 0;
      let fail = 0;

      const chunkSize = 350; // batch seguro
      for (let i = 0; i < preview.length; i += chunkSize) {
        const slice = preview.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        for (const row of slice) {
          try {
            if (row.error) { fail++; continue; }
            const udoc = await findUserByLicencia(row.licencia);
            if (!udoc) { fail++; continue; }
            batch.update(doc(db, "usuarios", udoc.id), { puntos: increment(row.puntos) });
            ok++;
          } catch {
            fail++;
          }
        }
        await batch.commit();
      }

      // 4) Finaliza log
      await updateDoc(logRef, { processedAt: serverTimestamp(), ok, fail });

      setToast({ msg: `Carga completada. OK: ${ok}, Fallidos: ${fail}`, type: "success" });
      setFile(null);
      setPreview([]);
      loadDrivers();
      loadLogs();
    } catch (e: any) {
      setToast({ msg: e?.message ?? "Error procesando carga", type: "error" });
    } finally {
      setProcessing(false);
    }
  };

  /* ──────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Panel de administración</h1>
          <div className="p-1 rounded-full border border-gray-200 bg-white text-sm">
            <button
              onClick={() => setTab("drivers")}
              className={`px-3 py-1.5 rounded-full ${tab === "drivers" ? "bg-red-600 text-white" : "hover:bg-gray-100"}`}
            >
              Conductores
            </button>
            <button
              onClick={() => setTab("upload")}
              className={`px-3 py-1.5 rounded-full ${tab === "upload" ? "bg-red-600 text-white" : "hover:bg-gray-100"}`}
            >
              Carga de puntos
            </button>
            <button
              onClick={() => setTab("history")}
              className={`px-3 py-1.5 rounded-full ${tab === "history" ? "bg-red-600 text-white" : "hover:bg-gray-100"}`}
            >
              Historial
            </button>
          </div>
        </header>

        {/* ── DRIVERS ─────────────────────────────────────────────── */}
        {tab === "drivers" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Conductores registrados</h2>
              <input
                placeholder="Buscar por nombre, correo, teléfono o licencia…"
                className="border border-gray-300 rounded px-3 py-2 w-80"
                value={qText}
                onChange={(e) => setQText(e.target.value)}
              />
            </div>

            {loadingDrivers ? (
              <p className="text-gray-500">Cargando…</p>
            ) : (
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl shadow">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-2 px-3">Avatar</th>
                      <th className="py-2 px-3">Nombre</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Teléfono</th>
                      <th className="py-2 px-3">Licencia</th>
                      <th className="py-2 px-3">Puntos</th>
                      <th className="py-2 px-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrivers.map((d) => (
                      <tr key={d.id} className="border-b last:border-0">
                        <td className="py-2 px-3">
                          {d.avatarUrl ? (
                            <img src={d.avatarUrl} className="w-10 h-10 rounded-full object-cover border" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200" />
                          )}
                        </td>
                        <td className="py-2 px-3">{[d.nombre, d.apellido].filter(Boolean).join(" ") || "—"}</td>
                        <td className="py-2 px-3">{d.email || "—"}</td>
                        <td className="py-2 px-3">{d.telefono || "—"}</td>
                        <td className="py-2 px-3">{d.licencia || (d as any).numeroLicencia || "—"}</td>
                        <td className="py-2 px-3">{d.puntos ?? 0}</td>
                        <td className="py-2 px-3">
                          <button
                            className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-100 transition"
                            onClick={() => openEdit(d)}
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal edición */}
            <Modal open={editOpen} title="Editar conductor" onClose={() => setEditOpen(false)}>
              {editing && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      placeholder="Nombre"
                      className="border border-gray-300 rounded px-3 py-2"
                      value={editing.nombre || ""}
                      onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
                    />
                    <input
                      placeholder="Apellido"
                      className="border border-gray-300 rounded px-3 py-2"
                      value={editing.apellido || ""}
                      onChange={(e) => setEditing({ ...editing, apellido: e.target.value })}
                    />
                    <input
                      placeholder="Teléfono"
                      className="border border-gray-300 rounded px-3 py-2"
                      value={editing.telefono || ""}
                      onChange={(e) => setEditing({ ...editing, telefono: e.target.value })}
                    />
                    <input
                      placeholder="Dirección"
                      className="border border-gray-300 rounded px-3 py-2"
                      value={editing.direccion || ""}
                      onChange={(e) => setEditing({ ...editing, direccion: e.target.value })}
                    />
                    <input
                      placeholder="Licencia"
                      className="border border-gray-300 rounded px-3 py-2"
                      value={editing.licencia || (editing as any).numeroLicencia || ""}
                      onChange={(e) => setEditing({ ...editing, licencia: e.target.value })}
                    />
                    <input
                      placeholder="Avatar URL"
                      className="border border-gray-300 rounded px-3 py-2"
                      value={editing.avatarUrl || ""}
                      onChange={(e) => setEditing({ ...editing, avatarUrl: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <label className="text-sm text-gray-600">Ajustar puntos (+ / -)</label>
                    <input
                      type="number"
                      className="border border-gray-300 rounded px-3 py-2 w-32"
                      value={editDeltaPts}
                      onChange={(e) => setEditDeltaPts(Number(e.target.value))}
                    />
                    <span className="text-xs text-gray-500">Usa números negativos para restar.</span>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={saveDriver}
                      className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditOpen(false)}
                      className="px-4 py-2 rounded border border-gray-200 hover:bg-gray-100 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </Modal>
          </section>
        )}

        {/* ── UPLOAD ─────────────────────────────────────────────── */}
        {tab === "upload" && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Carga de puntos (CSV por licencia)</h2>
            <div className="bg-white border border-gray-200 rounded-xl shadow p-5 space-y-3">
              <p className="text-sm text-gray-600">
                Formato: <code>licencia,puntos</code>. Puedes incluir una primera fila de encabezado.
              </p>
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                <input type="file" accept=".csv,text/csv" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
                <button
                  onClick={parseCSV}
                  disabled={!file || parsing}
                  className="px-3 py-2 rounded border border-gray-200 hover:bg-gray-100 transition disabled:opacity-50"
                >
                  {parsing ? "Leyendo…" : "Vista previa"}
                </button>
                <button
                  onClick={processUpload}
                  disabled={!file || preview.length===0 || processing}
                  className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                >
                  {processing ? "Procesando…" : "Subir y procesar"}
                </button>
              </div>

              {preview.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Vista previa ({preview.length} filas)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="py-2 pr-3">Licencia</th>
                          <th className="py-2 pr-3">Puntos</th>
                          <th className="py-2 pr-3">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.slice(0, 20).map((r, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 pr-3">{r.licencia}</td>
                            <td className="py-2 pr-3">{r.puntos}</td>
                            <td className="py-2 pr-3 text-red-600">{r.error || ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {preview.length > 20 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Mostrando primeras 20 filas de {preview.length}.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── HISTORY ───────────────────────────────────────────── */}
        {tab === "history" && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Historial de cargas</h2>

            {loadingLogs ? (
              <p className="text-gray-500">Cargando…</p>
            ) : logs.length === 0 ? (
              <p className="text-gray-500">Aún no hay cargas registradas.</p>
            ) : (
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl shadow">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-2 px-3">Archivo</th>
                      <th className="py-2 px-3">Tamaño</th>
                      <th className="py-2 px-3">Total</th>
                      <th className="py-2 px-3">OK</th>
                      <th className="py-2 px-3">Fallidos</th>
                      <th className="py-2 px-3">Subido por</th>
                      <th className="py-2 px-3">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l.id} className="border-b last:border-0">
                        <td className="py-2 px-3">{l.filename}</td>
                        <td className="py-2 px-3">{Math.round(l.size/1024)} KB</td>
                        <td className="py-2 px-3">{l.total}</td>
                        <td className="py-2 px-3 text-emerald-700">{l.ok}</td>
                        <td className="py-2 px-3 text-red-600">{l.fail}</td>
                        <td className="py-2 px-3">{l.byEmail}</td>
                        <td className="py-2 px-3">
                          {l.uploadedAt?.toDate ? l.uploadedAt.toDate().toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
