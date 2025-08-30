// src/pages/stylist/ServicesModal.tsx
import React, { useEffect, useState } from "react";
import { getToken as storeGetToken } from "../../lib/authStore";
import { CategoryService } from "../../data/categoryService";

// Ajusta si tu variable difiere
const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL ?? "http://localhost/glamora-bk/public/api";

/* =========================
   Tipos UI para el modal
========================= */
export type Service = {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  category?: string;   // guarda el ID como string (ej. "1")
  img?: string;        // <- se MUESTRA (preview/URL pública o dataURL)
  description?: string;
};

type Row = Service & {
  _file?: File | null; // <- se GUARDA (archivo real)
  active?: boolean;    // estado backend
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  services?: Service[];               // fallback inicial (opcional)
  onSave?: (next: Service[]) => void; // notificación al padre (opcional)
};

/* =========================
   Utils
========================= */
async function safeMessage(res: Response) {
  try {
    const j = await res.json();
    return j?.message || JSON.stringify(j);
  } catch {
    return `HTTP ${res.status}`;
  }
}

// No forzar Content-Type si el body es FormData
async function apiFetch(path: string, init: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(init.headers || {});
  const isForm = init.body instanceof FormData;

  if (!isForm && !headers.has("Content-Type") && init.method && init.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  const t = storeGetToken?.();
  if (t) headers.set("Authorization", `Bearer ${t}`);

  return fetch(url, { ...init, headers });
}

// ✅ Evitar caché solo en http(s) o rutas relativas; NO tocar data URLs (preview)
function bust(u?: string) {
  if (!u) return "";
  if (u.startsWith("data:")) return u; // no bust a data URLs
  if (/^https?:\/\//.test(u) || u.startsWith("/")) {
    return `${u}${u.includes("?") ? "&" : "?"}v=${Date.now()}`;
  }
  return u;
}

/* =========================
   Componente
========================= */
export default function ServicesModal({ isOpen, onClose, services, onSave }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [adding, setAdding] = useState<Row>(blank());
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // helpers
  function tmpId() {
    if (typeof crypto?.randomUUID === "function") return "tmp_" + crypto.randomUUID();
    return "tmp_" + Math.random().toString(36).slice(2, 9);
  }
  function blank(): Row {
    return {
      id: tmpId(),
      name: "",
      price: 0,
      durationMin: 30,
      category: "",
      description: "",
      img: "",
      _file: null,
      active: true,
    };
  }
  const isNumericId = (s: string) => /^\d+$/.test(s);

  const uiFromApi = (s: any): Row => ({
    id: String(s.id),
    name: s.name ?? "",
    price: Number(s.price ?? 0),
    durationMin: Number(s.duration_minutes ?? s.duration ?? 30),
    category: s.category_id != null ? String(s.category_id) : "",
    img: s.img ?? "",
    description: s.description ?? "",
    active: !!s.active,
    _file: null,
  });

  // Cargar datos al abrir
  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!isOpen) return;
      setError(null);

      // Fallback inmediato
      if (services && services.length) {
        const fallback = services.map((s) => ({ ...s, _file: null, active: true }));
        setRows(fallback);
      }

      setLoading(true);
      try {
        const res = await apiFetch(`/services?all=1&include_inactive=1`);
        if (!res.ok) throw new Error(await safeMessage(res));
        const j = await res.json();
        const list = Array.isArray(j) ? j : j?.data || [];
        if (!mounted) return;
        setRows(list.map(uiFromApi));
        setAdding(blank());
      } catch (e: any) {
        if (!services || services.length === 0) {
          setError(e?.message || "No se pudo cargar servicios.");
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Notifica al padre si quiere
  function notifyParent(nextList: Row[]) {
    if (!onSave) return;
    const cleaned: Service[] = nextList.map(({ _file, active, ...s }) => s);
    onSave(cleaned);
  }

  /* ========== CREATE (usa campo file) ========== */
  async function createNow() {
    setError(null);
    if (!adding.name.trim()) return setError("El nombre es obligatorio.");
    if (adding.price < 0) return setError("El precio no puede ser negativo.");
    if (!(adding._file instanceof File)) return setError("Selecciona una imagen (archivo).");

    setCreating(true);
    try {
      const fd = new FormData();
      fd.set("name", adding.name);
      if (adding.description) fd.set("description", adding.description);
      fd.set("duration_minutes", String(adding.durationMin));
      fd.set("price", String(adding.price));
      if (adding.category) fd.set("category_id", String(adding.category));
      fd.set("active", "1");
      // *** guardar con file ***
      fd.set("file", adding._file);

      const res = await apiFetch(`/services`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(await safeMessage(res));

      // recargar
      const r2 = await apiFetch(`/services?all=1&include_inactive=1`);
      const j2 = await r2.json();
      const list = Array.isArray(j2) ? j2 : j2?.data || [];
      const next = list.map(uiFromApi);
      setRows(next);
      setAdding(blank());
      notifyParent(next);
    } catch (e: any) {
      setError(e?.message || "No se pudo crear el servicio.");
    } finally {
      setCreating(false);
    }
  }

  /* ========== UPDATE (SIEMPRE POST + FormData) ========== */
  async function saveRow(r: Row) {
    if (!isNumericId(r.id)) return; // todavía no existe en backend
    setBusyId(r.id);
    setError(null);

    try {
      const fd = new FormData();
      // SIN _method, SIN PUT —> SOLO POST
      fd.set("name", r.name);
      fd.set("description", r.description || "");
      fd.set("duration_minutes", String(r.durationMin));
      fd.set("price", String(r.price));
      // category_id: manda vacío -> backend lo hará null por el middleware de Laravel
      if (r.category != null) fd.set("category_id", String(r.category));
      // si el usuario cambió la imagen, mandarla
      if (r._file instanceof File) fd.set("file", r._file);

      const res = await apiFetch(`/services/${r.id}`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(await safeMessage(res));

      // recargar
      const r2 = await apiFetch(`/services?all=1&include_inactive=1`);
      const j2 = await r2.json();
      const list = Array.isArray(j2) ? j2 : j2?.data || [];
      const next = list.map(uiFromApi);
      setRows(next);
      notifyParent(next);
    } catch (e: any) {
      setError(e?.message || "No se pudo actualizar el servicio.");
    } finally {
      setBusyId(null);
    }
  }

  /* ========== TOGGLE Coming Soon / Active ========== */
  async function toggleComingSoon(r: Row) {
    if (!isNumericId(r.id)) return;
    setBusyId(r.id);
    setError(null);
    try {
      const res = await apiFetch(`/services/${r.id}/active`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !r.active }),
      });
      if (!res.ok) throw new Error(await safeMessage(res));

      const r2 = await apiFetch(`/services?all=1&include_inactive=1`);
      const j2 = await r2.json();
      const list = Array.isArray(j2) ? j2 : j2?.data || [];
      const next = list.map(uiFromApi);
      setRows(next);
      notifyParent(next);
    } catch (e: any) {
      setError(e?.message || "No se pudo cambiar el estado del servicio.");
    } finally {
      setBusyId(null);
    }
  }

  /* ========== Mutaciones locales ========== */
  function updateField<T extends keyof Row>(id: string, key: T, value: Row[T]) {
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, [key]: value } : x)));
  }

  function onUploadToRow(id: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () =>
        setRows((prev) =>
          prev.map((x) =>
            x.id === id ? { ...x, img: String(reader.result || ""), _file: file } : x
          )
        );
      reader.readAsDataURL(file); // preview inmediato (data URL)
    };
  }

  function onUploadToAdding(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setAdding((a) => ({ ...a, img: String(reader.result || ""), _file: file }));
    reader.readAsDataURL(file);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-auto mt-10 w-[95%] max-w-3xl rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between p-5 border-b border-neutral-200 bg-gradient-to-r from-pink-500 to-fuchsia-500 rounded-t-2xl">
          <h3 className="text-white text-lg font-semibold">
            Manage Services {loading && <span className="opacity-80 text-xs ml-2">(loading…)</span>}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md bg-white/10 px-3 py-1 text-white hover:bg-white/20"
          >
            Close
          </button>
        </header>

        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Lista actual */}
          <section>
            <h4 className="font-semibold mb-3">Current Services</h4>
            {rows.length === 0 && !loading && (
              <p className="text-sm text-neutral-500">No services yet.</p>
            )}

            <ul className="space-y-3">
              {rows.map((svc) => (
                <li
                  key={svc.id}
                  className="rounded-xl border border-neutral-200 p-3 flex gap-3 items-center"
                >
                  <img
                    src={svc.img ? bust(svc.img) : "https://via.placeholder.com/60x60?text=Svc"}
                    alt={svc.name || "Service"}
                    className="h-16 w-16 rounded-lg object-cover border border-neutral-200"
                  />

                  <div className="flex-1 grid sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-neutral-500">Name</label>
                        <input
                          value={svc.name}
                          onChange={(e) => updateField(svc.id, "name", e.target.value)}
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                          disabled={busyId === svc.id}
                        />
                      </div>
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full ${
                          svc.active ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}
                        title={svc.active ? "Active" : "Coming soon"}
                      >
                        {svc.active ? "Active" : "Coming soon"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-neutral-500">Price</label>
                        <input
                          type="number"
                          min={0}
                          value={svc.price}
                          onChange={(e) => updateField(svc.id, "price", Number(e.target.value))}
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                          disabled={busyId === svc.id}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500">Duration (min)</label>
                        <input
                          type="number"
                          min={5}
                          step={5}
                          value={svc.durationMin}
                          onChange={(e) =>
                            updateField(svc.id, "durationMin", Number(e.target.value))
                          }
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                          disabled={busyId === svc.id}
                        />
                      </div>
                    </div>

                    {/* Category como combobox */}
                    <div>
                      <label className="block text-xs text-neutral-500">Category</label>
                      <select
                        value={svc.category || ""}
                        onChange={(e) => updateField(svc.id, "category", e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
                        disabled={busyId === svc.id}
                      >
                        <option value="">Select a category…</option>
                        {CategoryService.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs text-neutral-500">Description</label>
                      <textarea
                        value={svc.description || ""}
                        onChange={(e) => updateField(svc.id, "description", e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                        rows={2}
                        placeholder="Short description (optional)"
                        disabled={busyId === svc.id}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs text-neutral-500">Upload new image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onUploadToRow(svc.id)}
                        className="block text-xs"
                        disabled={busyId === svc.id}
                      />
                      {svc._file && (
                        <p className="text-xs text-neutral-500 mt-1">
                          Nueva imagen seleccionada. Presiona “Save” para aplicar.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => saveRow(svc)}
                      className="text-sm px-3 py-1 rounded-lg bg-neutral-900 text-white hover:bg-black disabled:opacity-50"
                      disabled={busyId === svc.id}
                    >
                      {busyId === svc.id ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => toggleComingSoon(svc)}
                      className={`text-sm px-3 py-1 rounded-lg text-white disabled:opacity-50 ${
                        svc.active ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                      disabled={busyId === svc.id || !isNumericId(svc.id)}
                      title={
                        !isNumericId(svc.id)
                          ? "Guarda primero para poder cambiar el estado"
                          : svc.active
                          ? "Marcar como 'Coming soon' (inactivo)"
                          : "Marcar como 'Active'"
                      }
                    >
                      {svc.active ? "Coming soon" : "Set Active"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Agregar nuevo (crear al instante) */}
          <section className="pt-2 border-t border-neutral-200">
            <h4 className="font-semibold mb-3">Add New Service</h4>

            <div className="rounded-xl border border-neutral-200 p-3 grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 flex items-center gap-3">
                <img
                  src={adding.img || "https://via.placeholder.com/60x60?text=New"}
                  className="h-16 w-16 rounded-lg object-cover border"
                  alt="new service"
                />
                <div className="space-y-1">
                  <label className="text-xs text-neutral-500 block">Upload Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onUploadToAdding}
                    className="text-xs"
                    disabled={creating}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-500">Name</label>
                <input
                  value={adding.name}
                  onChange={(e) => setAdding((a) => ({ ...a, name: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                  placeholder="e.g., Manicure"
                  disabled={creating}
                />
              </div>

              {/* Category combobox (crear) */}
              <div>
                <label className="block text-xs text-neutral-500">Category</label>
                <select
                  value={adding.category || ""}
                  onChange={(e) => setAdding((a) => ({ ...a, category: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 bg-white"
                  disabled={creating}
                >
                  <option value="">Select a category…</option>
                  {CategoryService.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-500">Price</label>
                <input
                  type="number"
                  min={0}
                  value={adding.price}
                  onChange={(e) => setAdding((a) => ({ ...a, price: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                  placeholder="0"
                  disabled={creating}
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-500">Duration (min)</label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={adding.durationMin}
                  onChange={(e) =>
                    setAdding((a) => ({ ...a, durationMin: Number(e.target.value) }))
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                  placeholder="60"
                  disabled={creating}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-neutral-500">Description (optional)</label>
                <textarea
                  value={adding.description || ""}
                  onChange={(e) => setAdding((a) => ({ ...a, description: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                  disabled={creating}
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  onClick={createNow}
                  className="px-4 py-2 rounded-xl bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50"
                  disabled={creating}
                >
                  {creating ? "Creating…" : "Add Service"}
                </button>
              </div>
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-end gap-2 p-5 border-t border-neutral-200">
          <button
            className="px-4 py-2 rounded-xl border border-neutral-300"
            onClick={onClose}
            disabled={creating || !!busyId}
          >
            Close
          </button>
          {/* No hay “Save Changes” global */}
        </footer>
      </div>
    </div>
  );
}
