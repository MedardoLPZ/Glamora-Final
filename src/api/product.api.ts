// src/api/product.api.ts
// Products API (CRUD) con multipart correcto y UPDATE via POST (sin _method).
// El binario (imagen) se envía SIEMPRE como "file" en FormData.

import { getToken as storeGetToken } from "../lib/authStore";

/** Ajusta si tu variable difiere */
const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL ?? "http://localhost/glamora-bk/public/api";

/* ============================
   Tipos backend / UI
============================ */
export interface ProductApi {
  id: number;
  name: string;
  price: number | string;
  category?: number | null;
  img?: string | null;
  description?: string | null;
  in_stock: boolean;
}

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type ListParams = {
  q?: string;
  category?: number | string;
  in_stock?: boolean; // solo para listado protegido (/products)
  all?: boolean;
  page?: number;
  per_page?: number;
};

export type CreateProductInput = {
  name: string;
  price: number | string;
  category?: number | string;
  description?: string;
  in_stock?: boolean;
  img?: File | null; // 👈 se envía como "file"
};

export type UpdateProductInput = Partial<CreateProductInput>;

/** Tipo UI consumido por el front */
export type UIProduct = {
  id: string;
  name: string;
  price: number;
  category?: string;
  image?: string;
  description?: string;
  inStock: boolean;
};

/* ============================
   Helpers
============================ */
function toNumber(n: any): number {
  const x = typeof n === "string" ? Number(n) : n;
  return Number.isFinite(x) ? x : 0;
}

function buildQS(params: Record<string, any>) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    p.set(k, String(v));
  });
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

async function safeMessage(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return j?.message || JSON.stringify(j);
  } catch {
    return `HTTP ${res.status}`;
  }
}

/** Mapea del backend a UI */
export function mapApiToUI(p: ProductApi): UIProduct {
  return {
    id: String(p.id),
    name: p.name,
    price: toNumber(p.price),
    category: p.category != null ? String(p.category) : undefined,
    image: p.img ?? undefined,
    description: p.description ?? "",
    inStock: !!p.in_stock,
  };
}

/* ============================
   fetch con token / multipart
============================ */
async function tokenFetch(path: string, init: RequestInit = {}) {
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

/* ============================
   Fábrica (similar a services.api)
============================ */
export function makeProductsApi(
  authFetch: (path: string, init?: RequestInit) => Promise<Response>
) {
  const json = async <T>(res: Response): Promise<T> => {
    if (res.status === 204) return undefined as unknown as T;
    return (await res.json()) as T;
  };

  // Si hay FormData, usar tokenFetch (respeta boundary y adjunta token).
  const call = (path: string, init: RequestInit = {}) =>
    init.body instanceof FormData ? tokenFetch(path, init) : authFetch(path, init);

  /* ========= LIST PROTEGIDO: /products ========= */
  async function listProductsRaw(params: ListParams = {}): Promise<Paginated<ProductApi> | ProductApi[]> {
    const qs = buildQS({
      q: params.q,
      category: params.category,
      in_stock: params.in_stock != null ? (params.in_stock ? 1 : 0) : undefined,
      all: params.all ? 1 : undefined,
      page: params.page,
      per_page: params.per_page,
    });
    const res = await call(`/products${qs}`);
    if (!res.ok) throw new Error(await safeMessage(res));
    return json(res);
  }

  async function listProductsUI(params: ListParams = {}) {
    const r = await listProductsRaw(params);
    if (Array.isArray(r)) return { data: r.map(mapApiToUI) };
    const { data, ...rest } = r;
    return { data: data.map(mapApiToUI), pagination: rest };
  }

  /* ========= LIST PÚBLICO: /catalog/products (solo in_stock=true) ========= */
  async function listPublicProductsRaw(params: Omit<ListParams, "in_stock"> = {}): Promise<Paginated<ProductApi> | ProductApi[]> {
    const qs = buildQS({
      q: params.q,
      category: params.category,
      all: params.all ? 1 : undefined,
      page: params.page,
      per_page: params.per_page,
    });
    const res = await tokenFetch(`/catalog/products${qs}`); // público; token opcional
    if (!res.ok) throw new Error(await safeMessage(res));
    return json(res);
  }

  async function listPublicProductsUI(params: Omit<ListParams, "in_stock"> = {}) {
    const r = await listPublicProductsRaw(params);
    if (Array.isArray(r)) return { data: r.map(mapApiToUI) };
    const { data, ...rest } = r;
    return { data: data.map(mapApiToUI), pagination: rest };
  }

  /* ========= GET: /products/{id} ========= */
  async function getProductRaw(id: number | string): Promise<ProductApi> {
    const res = await call(`/products/${id}`);
    if (!res.ok) throw new Error(await safeMessage(res));
    return json(res);
  }
  async function getProductUI(id: number | string) { return mapApiToUI(await getProductRaw(id)); }

  /* ========= CREATE: POST /products (FormData) ========= */
  async function createProduct(input: CreateProductInput) {
    const fd = new FormData();
    fd.set("name", input.name);
    fd.set("price", String(input.price));
    if (input.category != null && input.category !== "") fd.set("category", String(input.category));
    if (input.description != null) fd.set("description", String(input.description));
    if (input.in_stock != null) fd.set("in_stock", input.in_stock ? "1" : "0");
    if (input.img) fd.set("file", input.img); // 👈 enviar como "file"

    const res = await call(`/products`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(await safeMessage(res));
    const j = await json<{ data: ProductApi }>(res);
    return mapApiToUI(j.data ?? (j as any));
  }

  /* ========= UPDATE: POST /products/{id} (FormData SIEMPRE) ========= */
  async function updateProduct(id: number | string, input: UpdateProductInput) {
    const fd = new FormData();
    if (input.name != null)        fd.set("name", input.name);
    if (input.price != null)       fd.set("price", String(input.price));
    if (input.category != null)    fd.set("category", String(input.category));
    if (input.description != null) fd.set("description", String(input.description));
    if (input.in_stock != null)    fd.set("in_stock", input.in_stock ? "1" : "0");
    if (input.img instanceof File) fd.set("file", input.img);

    const res = await call(`/products/${id}`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(await safeMessage(res));
    const j = await json<{ data: ProductApi }>(res);
    return mapApiToUI(j.data ?? (j as any));
  }

  /* ========= TOGGLE in_stock: POST /products/{id}/in-stock ========= */
  async function setProductInStock(id: number | string, inStock: boolean) {
    const res = await call(`/products/${id}/in-stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ in_stock: inStock }),
    });
    if (!res.ok) throw new Error(await safeMessage(res));
    const j = await json<{ data: ProductApi }>(res);
    return mapApiToUI(j.data ?? (j as any));
  }

  /* ========= DELETE (fuera de stock): DELETE /products/{id} ========= */
  async function deactivateProduct(id: number | string) {
    const res = await call(`/products/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await safeMessage(res));
  }

  /* ========= Atajos convenientes ========= */
  async function getProductById(id: string) { try { return await getProductUI(id); } catch { return undefined; } }
  async function getProductsByCategory(category: string) {
    const { data } = await listProductsUI({ category, all: true });
    return data;
  }
  async function getCatalog() { // público
    const { data } = await listPublicProductsUI({ all: true });
    return data;
  }

  return {
    // listados
    listProductsRaw, listProductsUI,
    listPublicProductsRaw, listPublicProductsUI,
    // get / create / update
    getProductRaw, getProductUI, createProduct, updateProduct,
    // toggles y delete
    setProductInStock, deactivateProduct,
    // atajos
    getProductById, getProductsByCategory, getCatalog,
  };
}
