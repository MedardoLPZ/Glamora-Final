import React, { useEffect, useMemo, useRef, useState } from "react";
import { Trash2, Upload, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { makeStylistsApi, type UIStylist, type UserName } from "../../api/stylist.api";

type Row = {
  id: string;
  userId?: string;
  name: string;
  specialty?: string;
  bio?: string;
  img?: string;
  active: boolean;
  _file?: File | null;
};

type AddingState = {
  userId: string;
  specialty: string;
  bio: string;
  img?: string;
  _file?: File | null;
};

function bust(u?: string) {
  if (!u) return "";
  if (u.startsWith("data:")) return u;
  if (/^https?:\/\//.test(u) || u.startsWith("/")) return `${u}${u.includes("?") ? "&" : "?"}v=${Date.now()}`;
  return u;
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

interface StylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StylistModal: React.FC<StylistModalProps> = ({ isOpen, onClose }) => {
  const { authFetch, token } = useAuth() as any;
  const getToken = () =>
    token ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    sessionStorage.getItem("token") ||
    "";
  const api = useMemo(() => makeStylistsApi(authFetch, getToken), [authFetch, token]);

  const [rows, setRows] = useState<Row[]>([]);
  const [users, setUsers] = useState<UserName[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🔒 Anti doble-submit en "Add"
  const [creating, setCreating] = useState(false);

  // 🔒 Anti doble-click por fila (save / deactivate reentrante)
  const savingRowsRef = useRef<Set<string>>(new Set());

  const [adding, setAdding] = useState<AddingState>({
    userId: "",
    specialty: "",
    bio: "",
    img: "",
    _file: null,
  });

  /* ---- CARGA: estilistas (PROTEGIDO) + usuarios (cache) ---- */
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setError(null);

    async function loadAll() {
      setLoading(true);
      try {
        // Estilistas protegidos -> /stylists
        const { data } = await api.listStylistsUI({ all: true });
        const next: Row[] = data.map((s: UIStylist) => ({
          id: s.id,
          userId: s.userId,
          name: s.name,
          specialty: s.specialty,
          bio: s.bio,
          img: s.image,
          active: s.active,
          _file: null,
        }));
        if (!mounted) return;
        setRows(next);

        // Usuarios para combobox (/users/names con cache)
        const names = await api.listUserNamesCached();
        if (!mounted) return;
        setUsers(names);
      } catch (e: any) {
        setError(e?.message || "No se pudieron cargar las estilistas.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadAll();
    return () => { mounted = false; };
  }, [isOpen, api]);

  function onUploadToRow(id: string) {
    return async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (!file) return;
      const dataUrl = await readAsDataURL(file);
      setRows(prev => prev.map(x => x.id === id ? ({ ...x, img: dataUrl, _file: file }) : x));
    };
  }

  async function onUploadToAdding(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    const dataUrl = await readAsDataURL(file);
    setAdding(a => ({ ...a, img: dataUrl, _file: file }));
  }

  async function createNow(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;               // 🔒 guard reentrante
    setError(null);
    if (!adding.userId) return setError("Selecciona un usuario.");
    if (!adding.specialty.trim()) return setError("La especialidad es obligatoria.");

    try {
      setCreating(true);                // 🔒 bloquear botón "Add Stylist"
      await api.createStylist({
        user_id: adding.userId,
        specialty: adding.specialty,
        bio: adding.bio || "",
        img: adding._file ?? undefined,
        active: true,
      });

      // recargar lista
      const { data } = await api.listStylistsUI({ all: true });
      setRows(data.map(s => ({
        id: s.id,
        userId: s.userId,
        name: s.name,
        specialty: s.specialty,
        bio: s.bio,
        img: s.image,
        active: s.active,
        _file: null,
      })));

      // limpiar form
      setAdding({ userId: "", specialty: "", bio: "", img: "", _file: null });
    } catch (e: any) {
      setError(e?.message || "No se pudo crear la estilista.");
    } finally {
      setCreating(false);
    }
  }

  async function saveRow(r: Row) {
    if (!r.id || r.id.startsWith("tmp_")) return;
    if (!r.userId) { setError("Este stylist no tiene usuario asignado. Selecciona uno y guarda nuevamente."); return; }

    // 🔒 evita doble click inmediato
    if (savingRowsRef.current.has(r.id)) return;
    savingRowsRef.current.add(r.id);

    setBusyId(r.id);
    setError(null);
    try {
      await api.updateStylist(r.id, {
        user_id: r.userId,                // requerido por el backend
        specialty: r.specialty,
        bio: r.bio,
        img: r._file instanceof File ? r._file : undefined,
        active: r.active,
      });

      // recargar lista
      const { data } = await api.listStylistsUI({ all: true });
      setRows(data.map(s => ({
        id: s.id,
        userId: s.userId,
        name: s.name,
        specialty: s.specialty,
        bio: s.bio,
        img: s.image,
        active: s.active,
        _file: null,
      })));
    } catch (e: any) {
      setError(e?.message || "No se pudo actualizar la estilista.");
    } finally {
      savingRowsRef.current.delete(r.id);  // 🔓
      setBusyId(null);
    }
  }

  async function deactivateRow(r: Row) {
    if (!r.id || r.id.startsWith("tmp_")) return;

    // 🔒 evita doble click inmediato en desactivar
    if (savingRowsRef.current.has(r.id)) return;
    savingRowsRef.current.add(r.id);

    setBusyId(r.id);
    setError(null);

    try {
      await api.setStylistActive(r.id, false);
      const { data } = await api.listStylistsUI({ all: true });
      setRows(data.map(s => ({
        id: s.id,
        userId: s.userId,
        name: s.name,
        specialty: s.specialty,
        bio: s.bio,
        img: s.image,
        active: s.active,
        _file: null,
      })));
    } catch (e: any) {
      setError(e?.message || "No se pudo desactivar la estilista.");
    } finally {
      savingRowsRef.current.delete(r.id);  // 🔓
      setBusyId(null);
    }
  }

  function updateField<T extends keyof Row>(id: string, key: T, value: Row[T]) {
    setRows(prev => prev.map(x => x.id === id ? { ...x, [key]: value } : x));
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-semibold">Manage Stylists</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-white/20">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Lista actual */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Current Stylists {loading && <span className="text-xs opacity-80 ml-2">(loading…)</span>}
            </h3>

            <div className="space-y-4">
              {rows.map((s) => (
                <div key={s.id} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={s.img ? bust(s.img) : "https://via.placeholder.com/64x64?text=Sty"}
                      alt={s.name || "Stylist"}
                      className="h-16 w-16 rounded-full object-cover border"
                    />
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-500 block">Upload Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onUploadToRow(s.id)}
                        className="text-xs"
                        disabled={busyId === s.id || savingRowsRef.current.has(s.id)}
                      />
                    </div>
                  </div>

                  {/* Name (si no hay userId, deja elegir) */}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs text-neutral-500">Name</label>
                      <input
                        value={s.name}
                        disabled
                        className="w-full px-3 py-2 border rounded-lg bg-neutral-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500">User</label>
                      {s.userId ? (
                        <input
                          value={s.userId}
                          disabled
                          className="w-full px-3 py-2 border rounded-lg bg-neutral-100"
                        />
                      ) : (
                        <select
                          value={s.userId || ""}
                          onChange={(e) => {
                            const uid = e.target.value || undefined;
                            const u = users.find(x => x.id === uid);
                            updateField(s.id, "userId", uid as any);
                            updateField(s.id, "name", u?.name || s.name);
                          }}
                          className="w-full px-3 py-2 border rounded-lg bg-white"
                        >
                          <option value="">Select a user…</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-neutral-500">Specialty</label>
                      <input
                        value={s.specialty || ""}
                        onChange={(e) => updateField(s.id, "specialty", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        disabled={busyId === s.id || savingRowsRef.current.has(s.id)}
                        placeholder="e.g., Lashes, Nails, Hair…"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500">Status</label>
                      <span
                        className={`inline-block text-[11px] px-2 py-1 rounded-full ${
                          s.active ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {s.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-neutral-500">Bio</label>
                      <textarea
                        value={s.bio || ""}
                        onChange={(e) => updateField(s.id, "bio", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={2}
                        placeholder="Short bio (optional)"
                        disabled={busyId === s.id || savingRowsRef.current.has(s.id)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => saveRow(s)}
                      className="px-3 py-2 rounded-lg bg-neutral-900 text-white hover:bg-black disabled:opacity-50 disabled:pointer-events-none"
                      disabled={busyId === s.id || savingRowsRef.current.has(s.id)}
                    >
                      {busyId === s.id || savingRowsRef.current.has(s.id) ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => deactivateRow(s)}
                      className="p-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 disabled:pointer-events-none"
                      disabled={busyId === s.id || savingRowsRef.current.has(s.id)}
                      title="Deactivate stylist"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {!loading && rows.length === 0 && (
                <div className="text-sm text-neutral-500">No stylists found.</div>
              )}
            </div>
          </div>

          {/* Add New */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Stylist</h3>
            <form onSubmit={createNow} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                <div>
                  <label className="block text-xs text-neutral-500">User</label>
                  <select
                    value={adding.userId}
                    onChange={(e) => setAdding(a => ({ ...a, userId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                    required
                    disabled={creating}
                  >
                    <option value="">Select a user…</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500">Upload Image</label>
                  <label className={`inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 ${creating ? "opacity-50 pointer-events-none" : "hover:bg-neutral-50 cursor-pointer"}`}>
                    <Upload size={16} />
                    <span className="text-sm">Choose File</span>
                    <input type="file" accept="image/*" className="hidden" onChange={onUploadToAdding} disabled={creating} />
                  </label>
                </div>
              </div>

              {adding.img && (
                <div className="flex items-center gap-3">
                  <img src={adding.img} className="w-14 h-14 rounded-full object-cover border" alt="preview" />
                  <span className="text-xs text-neutral-500">Preview</span>
                </div>
              )}

              <input
                type="text"
                value={adding.specialty}
                onChange={(e) => setAdding(a => ({ ...a, specialty: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Specialty (e.g., Lashes, Nails, Hair…)"
                required
                disabled={creating}
              />

              <textarea
                value={adding.bio}
                onChange={(e) => setAdding(a => ({ ...a, bio: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Short bio (optional)"
                disabled={creating}
              />

              <button
                type="submit"
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:pointer-events-none"
                disabled={creating}
              >
                {creating ? "Creating…" : "Add Stylist"}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
