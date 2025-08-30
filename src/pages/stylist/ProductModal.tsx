// src/components/ProductModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { makeProductsApi, type UIProduct } from "../../api/product.api";
import type { Product } from "../../types";
// FIX 1: importar del archivo correcto y también la función
import { CategoryProduct, getCategoryProductLabel } from "../../data/categoryProduc";

// Evitar caché en previews http(s) o rutas relativas; no tocar data URLs
function bust(u?: string) {
  if (!u) return "";
  if (u.startsWith("data:")) return u;
  if (/^https?:\/\//.test(u) || u.startsWith("/")) {
    return `${u}${u.includes("?") ? "&" : "?"}v=${Date.now()}`;
  }
  return u;
}

type Row = UIProduct & {
  _file?: File | null; // archivo real para enviar
};

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Omit<Product, "id">) => void; // compat
  onUpdateProducts: (products: Product[]) => void;
  products: Product[]; // fallback inicial
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  onUpdateProducts,
  products,
}) => {
  const { authFetch } = useAuth();
  const api = useMemo(() => makeProductsApi(authFetch), [authFetch]);

  // Listado editable
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form de "Add New"
  const [adding, setAdding] = useState<Row>({
    id: "tmp_new",
    name: "",
    price: 0,
    category: "",
    description: "",
    image: "",
    inStock: true,
    _file: null,
  });

  // Carga al abrir
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!isOpen) return;
      setError(null);

      // Fallback inmediato desde props
      if (products && products.length) {
        const fallback: Row[] = products.map((p) => ({
          id: String(p.id),
          name: p.name,
          price: Number(p.price),
          category: p.category ?? "",
          description: p.description ?? "",
          image: p.photo ?? "",
          inStock: !!p.inStock,
          _file: null,
        }));
        setRows(fallback);
      }

      setLoading(true);
      try {
        // Protegido: trae todo
        const { data } = await api.listProductsUI({ all: true });
        if (!mounted) return;
        setRows(data.map((d) => ({ ...d, _file: null })));
      } catch (e: any) {
        if (!products || products.length === 0) {
          setError(e?.message || "No se pudo cargar productos.");
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

  // Notificar al padre con el shape de ../types (usa "photo")
  function notifyParent(next: Row[]) {
    const mapped: Product[] = next.map((r) => ({
      id: r.id,
      name: r.name,
      price: r.price,
      category: r.category ?? "",
      description: r.description ?? "",
      inStock: r.inStock,
      photo: r.image ?? "",
    }));
    onUpdateProducts(mapped);
  }

  // ===== CREATE =====
  async function createNow(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!adding.name.trim()) return setError("El nombre es obligatorio.");
    if (adding.price == null || Number.isNaN(adding.price)) return setError("Precio inválido.");
    if (!adding.category) return setError("Selecciona una categoría.");
    if (!(adding._file instanceof File)) return setError("Selecciona una imagen.");

    try {
      const created = await api.createProduct({
        name: adding.name,
        price: adding.price,
        category: adding.category,
        description: adding.description || "",
        in_stock: adding.inStock,
        img: adding._file, // se envía como 'file'
      });

      // Recargar lista completa
      const { data } = await api.listProductsUI({ all: true });
      const next = data.map((d) => ({ ...d, _file: null }));
      setRows(next);
      notifyParent(next);

      // Compat opcional
      onAddProduct({
        name: created.name,
        price: created.price,
        category: created.category ?? "",
        description: created.description ?? "",
        inStock: created.inStock,
        photo: created.image ?? "",
      });

      // Limpiar form
      setAdding({
        id: "tmp_new",
        name: "",
        price: 0,
        category: "",
        description: "",
        image: "",
        inStock: true,
        _file: null,
      });
    } catch (e: any) {
      setError(e?.message || "No se pudo crear el producto.");
    }
  }

  // ===== UPDATE (solo POST + FormData) =====
  async function saveRow(r: Row) {
    if (!r.id || r.id.startsWith("tmp_")) return;
    setBusyId(r.id);
    setError(null);

    try {
      await api.updateProduct(r.id, {
        name: r.name,
        price: r.price,
        category: r.category ?? "",
        description: r.description ?? "",
        in_stock: r.inStock,
        img: r._file instanceof File ? r._file : undefined,
      });

      // Recargar lista
      const { data } = await api.listProductsUI({ all: true });
      const next = data.map((d) => ({ ...d, _file: null }));
      setRows(next);
      notifyParent(next);
    } catch (e: any) {
      setError(e?.message || "No se pudo actualizar el producto.");
    } finally {
      setBusyId(null);
    }
  }

  // ===== TOGGLE IN-STOCK =====
  async function toggleInStock(r: Row) {
    if (!r.id || r.id.startsWith("tmp_")) return;
    setBusyId(r.id);
    setError(null);

    try {
      const updated = await api.setProductInStock(r.id, !r.inStock);
      // Optimista
      setRows((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, inStock: updated.inStock } : x))
      );
      notifyParent(
        rows.map((x) => (x.id === r.id ? { ...x, inStock: updated.inStock } as Row : x))
      );
    } catch (e: any) {
      setError(e?.message || "No se pudo cambiar el estado de inventario.");
    } finally {
      setBusyId(null);
    }
  }

  // ===== DELETE (marcar fuera de stock) =====
  async function deleteRow(r: Row) {
    if (!r.id || r.id.startsWith("tmp_")) return;
    setBusyId(r.id);
    setError(null);

    try {
      await api.deactivateProduct(r.id);
      const { data } = await api.listProductsUI({ all: true });
      const next = data.map((d) => ({ ...d, _file: null }));
      setRows(next);
      notifyParent(next);
    } catch (e: any) {
      setError(e?.message || "No se pudo eliminar (desactivar) el producto.");
    } finally {
      setBusyId(null);
    }
  }

  // ===== Mutaciones locales =====
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
            x.id === id ? { ...x, image: String(reader.result || ""), _file: file } : x
          )
        );
      reader.readAsDataURL(file);
    };
  }

  function onUploadToAdding(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setAdding((a) => ({ ...a, image: String(reader.result || ""), _file: file }));
    reader.readAsDataURL(file);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-pink-500 px-6 py-4 text-white sticky top-0 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              Manage Products{" "}
              {loading && <span className="text-xs opacity-80 ml-2">(loading…)</span>}
            </h2>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-white/20">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Current Products */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Products</h3>
            <div className="space-y-4">
              {rows.map((p) => (
                <div key={p.id} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.image ? bust(p.image) : "https://via.placeholder.com/60x60?text=Prod"}
                      alt={p.name || "Product"}
                      className="h-16 w-16 rounded-lg object-cover border"
                    />
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-500 block">Upload Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onUploadToRow(p.id)}
                        className="text-xs"
                        disabled={busyId === p.id}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-neutral-500">Name</label>
                      <input
                        value={p.name}
                        onChange={(e) => updateField(p.id, "name", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        disabled={busyId === p.id}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500">Price</label>
                      <input
                        type="number"
                        min={0}
                        value={p.price}
                        onChange={(e) => updateField(p.id, "price", Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg"
                        disabled={busyId === p.id}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500">Category</label>
                      <select
                        value={p.category || ""}
                        onChange={(e) => updateField(p.id, "category", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-white"
                        disabled={busyId === p.id}
                      >
                        <option value="">Select a category…</option>
                        {CategoryProduct.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.description}
                          </option>
                        ))}
                      </select>
                      {p.category && (
                        <p className="text-[11px] text-neutral-500 mt-1">
                          {getCategoryProductLabel(p.category)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500">In Stock</label>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-1 rounded-full ${
                            p.inStock ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {p.inStock ? "Available" : "Out of stock"}
                        </span>
                        <button
                          onClick={() => toggleInStock(p)}
                          className={`text-sm px-3 py-1 rounded-lg text-white disabled:opacity-50 ${
                            p.inStock
                              ? "bg-amber-600 hover:bg-amber-700"
                              : "bg-emerald-600 hover:bg-emerald-700"
                          }`}
                          disabled={busyId === p.id}
                          title={p.inStock ? "Marcar fuera de stock" : "Marcar disponible"}
                        >
                          {p.inStock ? "Set Out" : "Set In"}
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs text-neutral-500">Description</label>
                      <textarea
                        value={p.description || ""}
                        onChange={(e) => updateField(p.id, "description", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={2}
                        placeholder="Short description (optional)"
                        disabled={busyId === p.id}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => saveRow(p)}
                      className="px-3 py-2 rounded-lg bg-neutral-900 text-white hover:bg-black disabled:opacity-50"
                      disabled={busyId === p.id}
                    >
                      {busyId === p.id ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => deleteRow(p)}
                      className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                      disabled={busyId === p.id}
                      title="Marcar fuera de stock (DELETE)"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Product */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Plus className="mr-2" size={20} />
              Add New Product
            </h3>

            <form onSubmit={createNow} className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={adding.image || "https://via.placeholder.com/60x60?text=New"}
                  className="h-16 w-16 rounded-lg object-cover border"
                  alt="new product"
                />
                <div className="space-y-1">
                  <label className="text-xs text-neutral-500 block">Upload Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onUploadToAdding}
                    className="text-xs"
                  />
                </div>
              </div>

              <input
                type="text"
                value={adding.name}
                onChange={(e) => setAdding((a) => ({ ...a, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Product Name"
                required
              />

              <input
                type="number"
                min={0}
                value={adding.price}
                onChange={(e) => setAdding((a) => ({ ...a, price: Number(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Price"
                required
              />

              <select
                value={adding.category || ""}
                onChange={(e) => setAdding((a) => ({ ...a, category: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg bg-white"
                required
              >
                <option value="">Select a category…</option>
                {CategoryProduct.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.description}
                  </option>
                ))}
              </select>

              <textarea
                value={adding.description || ""}
                onChange={(e) => setAdding((a) => ({ ...a, description: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Description"
              />

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={adding.inStock}
                  onChange={(e) => setAdding((a) => ({ ...a, inStock: e.target.checked }))}
                />
                In Stock
              </label>

              <button
                type="submit"
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
              >
                Add Product
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-pink-500 px-4 py-2 text-white hover:bg-pink-600"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
