import React from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import type { Stylist } from '../types/salon';

interface StylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Persist the full list when clicking “Save Changes” */
  onUpdateStylists: (stylists: Stylist[]) => void;
  /** Optional legacy hook if you still want an immediate callback on add */
  onAddStylist?: (stylist: Omit<Stylist, 'id'>) => void;
  /** Existing stylists from parent */
  stylists: Stylist[];
}

// File -> dataURL
function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export const StylistModal: React.FC<StylistModalProps> = ({
  isOpen,
  onClose,
  onUpdateStylists,
  onAddStylist,
  stylists,
}) => {
  // Work on a local copy; persist on Save
  const [rows, setRows] = React.useState<Stylist[]>(stylists);
  const [adding, setAdding] = React.useState<Omit<Stylist, 'id'>>({
    name: '',
    phone: '',
    email: '',
    specialties: [],
    photo: '',
  });

  React.useEffect(() => {
    if (isOpen) setRows(stylists);
  }, [isOpen, stylists]);

  const canSave = React.useMemo(
    () => rows.every(r => r.name.trim()),
    [rows]
  );

  if (!isOpen) return null;

  const updateRow = (id: string, patch: Partial<Stylist>) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleRowFile = async (id: string, file?: File | null) => {
    if (!file) return;
    const dataUrl = await readAsDataURL(file);
    updateRow(id, { photo: dataUrl });
  };

  const handleAddFile = async (file?: File | null) => {
    if (!file) return;
    const dataUrl = await readAsDataURL(file);
    setAdding(a => ({ ...a, photo: dataUrl }));
  };

  const addStylist = () => {
    if (!adding.name.trim()) return;
    const next: Stylist = {
      id: String(Date.now()),
      ...adding,
      specialties: (adding.specialties || []).map(s => s.trim()).filter(Boolean),
    };
    setRows(prev => [next, ...prev]);
    onAddStylist?.(next); // optional legacy hook
    setAdding({ name: '', phone: '', email: '', specialties: [], photo: '' });
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Panel (same sizing/feel as Services/Products) */}
      <div className="absolute inset-x-0 top-8 sm:top-10 mx-auto w-[92%] sm:w-[720px] rounded-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Manage Stylists</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 bg-white/15 hover:bg-white/25 transition"
          >
            Close
          </button>
        </div>

        {/* Body (scrolls internally) */}
        <div className="max-h-[72vh] overflow-y-auto px-5 py-5" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Current Stylists */}
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-neutral-800 mb-3">Current Stylists</h3>

            <div className="space-y-4">
              {rows.map((s) => (
                <div key={s.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="grid grid-cols-1 gap-3">
                    {/* Photo + Upload */}
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-neutral-200 flex items-center justify-center">
                        {s.photo ? (
                          <img src={s.photo} alt={s.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-neutral-500">No Photo</span>
                        )}
                      </div>
                      <label className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 hover:bg-neutral-50 cursor-pointer">
                        <Upload size={16} />
                        <span className="text-sm">Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleRowFile(s.id, e.target.files?.[0])}
                        />
                      </label>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">Full Name</label>
                      <input
                        value={s.name}
                        onChange={(e) => updateRow(s.id, { name: e.target.value })}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                      />
                    </div>

                    {/* Phone & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">Phone</label>
                        <input
                          value={s.phone ?? ''}
                          onChange={(e) => updateRow(s.id, { phone: e.target.value })}
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                          placeholder="+504 9999-0000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">Email</label>
                        <input
                          type="email"
                          value={s.email ?? ''}
                          onChange={(e) => updateRow(s.id, { email: e.target.value })}
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                          placeholder="name@domain.com"
                        />
                      </div>
                    </div>

                    {/* Specialties (comma separated) */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        Specialties (comma-separated)
                      </label>
                      <input
                        value={(s.specialties ?? []).join(', ')}
                        onChange={(e) =>
                          updateRow(
                            s.id,
                            { specialties: e.target.value.split(',').map(x => x.trim()).filter(Boolean) }
                          )
                        }
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                        placeholder="Balayage, Nail Art, Lashes…"
                      />
                    </div>

                    {/* Remove */}
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => removeRow(s.id)}
                        className="rounded-lg bg-rose-600 text-white px-3 py-1.5 text-sm hover:bg-rose-700 inline-flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Add New Stylist */}
          <section className="rounded-xl border border-neutral-200 p-4">
            <h3 className="text-sm font-semibold text-neutral-800 mb-3">Add New Stylist</h3>

            <div className="grid grid-cols-1 gap-3">
              {/* Photo URL + Upload */}
              <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Photo URL</label>
                  <input
                    value={adding.photo ?? ''}
                    onChange={(e) => setAdding(a => ({ ...a, photo: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                    placeholder="https://…"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Upload Photo</label>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 hover:bg-neutral-50 cursor-pointer">
                    <Upload size={16} />
                    <span className="text-sm">Choose File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAddFile(e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Full Name</label>
                <input
                  value={adding.name}
                  onChange={(e) => setAdding(a => ({ ...a, name: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                  placeholder="e.g., Angie Zuniga"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Phone</label>
                  <input
                    value={adding.phone}
                    onChange={(e) => setAdding(a => ({ ...a, phone: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                    placeholder="+504 9999-0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={adding.email}
                    onChange={(e) => setAdding(a => ({ ...a, email: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                    placeholder="name@domain.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Specialties (comma-separated)
                </label>
                <input
                  value={(adding.specialties ?? []).join(', ')}
                  onChange={(e) =>
                    setAdding(a => ({
                      ...a,
                      specialties: e.target.value.split(',').map(x => x.trim()).filter(Boolean),
                    }))
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                  placeholder="Manicure, Pedicure, Balayage…"
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={addStylist}
                  className="rounded-lg bg-purple-600 text-white px-3 py-1.5 text-sm hover:bg-purple-700 inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Stylist
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-200 bg-white flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-neutral-300 px-4 py-2 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onUpdateStylists(rows)}
            disabled={!canSave}
            className={`rounded-xl px-4 py-2 text-white ${
              canSave ? 'bg-pink-600 hover:bg-pink-700' : 'bg-pink-300 cursor-not-allowed'
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};