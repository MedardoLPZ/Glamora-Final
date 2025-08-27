import React, { useEffect, useMemo, useState } from "react";

export type Service = {
  id: string;
  name: string;
  price: number;        // Lempiras or USD — you decide
  durationMin: number;  // minutes
  category?: string;
  photo?: string;       // dataURL or remote URL
  description?: string;
};

type Props = {
  isOpen: boolean;
  services: Service[];                     // existing services from parent
  onClose: () => void;
  onSave: (next: Service[]) => void;       // parent will persist
};

export default function ServicesModal({ isOpen, services, onClose, onSave }: Props) {
  const [rows, setRows] = useState<Service[]>([]);
  const [adding, setAdding] = useState<Service>(blank());

  useEffect(() => {
    if (isOpen) {
      // clone so we don’t mutate parent while editing
      setRows(services.map(s => ({ ...s })));
      setAdding(blank());
    }
  }, [isOpen, services]);

  const canSave = useMemo(() => rows.every(r => r.name.trim()), [rows]);

  function blank(): Service {
    return {
      id: cryptoRandomId(),
      name: "",
      price: 0,
      durationMin: 30,
      category: "",
      description: "",
      photo: "",
    };
  }

  function cryptoRandomId() {
    if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();
    return "svc_" + Math.random().toString(36).slice(2, 9);
  }

  function removeService(id: string) {
    setRows(prev => prev.filter(r => r.id !== id));
  }

  function addService() {
    if (!adding.name.trim()) return;
    setRows(prev => [...prev, { ...adding, id: cryptoRandomId() }]);
    setAdding(blank());
  }

  function updateField<T extends keyof Service>(id: string, key: T, value: Service[T]) {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, [key]: value } : r)));
  }

  function onUploadTo(fieldSetter: (val: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => fieldSetter(String(reader.result || ""));
      reader.readAsDataURL(file);
    };
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-auto mt-10 w-[95%] max-w-3xl rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between p-5 border-b border-neutral-200 bg-gradient-to-r from-pink-500 to-fuchsia-500 rounded-t-2xl">
          <h3 className="text-white text-lg font-semibold">Manage Services</h3>
          <button
            onClick={onClose}
            className="rounded-md bg-white/10 px-3 py-1 text-white hover:bg-white/20"
          >
            Close
          </button>
        </header>

        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Current services */}
          <section>
            <h4 className="font-semibold mb-3">Current Services</h4>
            {rows.length === 0 && (
              <p className="text-sm text-neutral-500">No services yet.</p>
            )}

            <ul className="space-y-3">
              {rows.map(svc => (
                <li
                  key={svc.id}
                  className="rounded-xl border border-neutral-200 p-3 flex gap-3 items-center"
                >
                  <img
                    src={svc.photo || "https://via.placeholder.com/60x60?text=Svc"}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover border border-neutral-200"
                  />
                  <div className="flex-1 grid sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-neutral-500">Name</label>
                      <input
                        value={svc.name}
                        onChange={e => updateField(svc.id, "name", e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-neutral-500">Price</label>
                        <input
                          type="number"
                          min={0}
                          value={svc.price}
                          onChange={e => updateField(svc.id, "price", Number(e.target.value))}
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500">Duration (min)</label>
                        <input
                          type="number"
                          min={5}
                          step={5}
                          value={svc.durationMin}
                          onChange={e => updateField(svc.id, "durationMin", Number(e.target.value))}
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-500">Category</label>
                      <input
                        value={svc.category || ""}
                        onChange={e => updateField(svc.id, "category", e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                        placeholder="e.g., Hair, Nails, Lashes"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-500">Photo URL</label>
                      <input
                        value={svc.photo || ""}
                        onChange={e => updateField(svc.id, "photo", e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                        placeholder="https://…"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs text-neutral-500">Description</label>
                      <textarea
                        value={svc.description || ""}
                        onChange={e => updateField(svc.id, "description", e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                        rows={2}
                        placeholder="Short description (optional)"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <label className="text-xs text-neutral-500">Upload</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onUploadTo(v => updateField(svc.id, "photo", v))}
                      className="block w-40 text-xs"
                    />
                    <button
                      onClick={() => removeService(svc.id)}
                      className="text-sm px-3 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Add new service */}
          <section className="pt-2 border-t border-neutral-200">
            <h4 className="font-semibold mb-3">Add New Service</h4>

            <div className="rounded-xl border border-neutral-200 p-3 grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 flex items-center gap-3">
                <img
                  src={adding.photo || "https://via.placeholder.com/60x60?text=New"}
                  className="h-16 w-16 rounded-lg object-cover border"
                  alt=""
                />
                <div className="space-y-1">
                  <label className="text-xs text-neutral-500 block">Upload Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onUploadTo(v => setAdding(a => ({ ...a, photo: v })))}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-500">Name</label>
                <input
                  value={adding.name}
                  onChange={e => setAdding(a => ({ ...a, name: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                  placeholder="e.g., Manicure"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-500">Category</label>
                <input
                  value={adding.category}
                  onChange={e => setAdding(a => ({ ...a, category: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                  placeholder="Hair / Nails / Lashes"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-500">Price</label>
                <input
                  type="number"
                  min={0}
                  value={adding.price}
                  onChange={e => setAdding(a => ({ ...a, price: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-500">Duration (min)</label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={adding.durationMin}
                  onChange={e => setAdding(a => ({ ...a, durationMin: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                  placeholder="60"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-neutral-500">Photo URL (optional)</label>
                <input
                  value={adding.photo}
                  onChange={e => setAdding(a => ({ ...a, photo: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                  placeholder="https://…"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-neutral-500">Description (optional)</label>
                <textarea
                  value={adding.description}
                  onChange={e => setAdding(a => ({ ...a, description: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  onClick={addService}
                  className="px-4 py-2 rounded-xl bg-neutral-900 text-white hover:bg-black disabled:opacity-50"
                  disabled={!adding.name.trim()}
                >
                  Add Service
                </button>
              </div>
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-end gap-2 p-5 border-t border-neutral-200">
          <button
            className="px-4 py-2 rounded-xl border border-neutral-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50"
            onClick={() => onSave(rows)}
            disabled={!canSave}
          >
            Save Changes
          </button>
        </footer>
      </div>
    </div>
  );
}