// src/api/services.api.ts
// Services API (CRUD) con multipart correcto y UPDATE via POST (sin _method).
// El binario se envía SIEMPRE en el campo "file" del FormData.

import type { Service as UIService } from "../types";
import { getToken as storeGetToken } from "../lib/authStore";

const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL ?? "http://localhost/glamora-bk/public/api";

// ============================
// Tipos backend
// ============================
export interface ServiceApi {
  id: number;
  name: string;
  description?: string | null;
  duration_minutes?: number | null;
  price: number | string;
  requires_deposit?: boolean;
  deposit_amount?: number | string | null;
  active: boolean;
  category_id?: number | null;
  img?: string | null;
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
  category_id?: number | string;
  include_inactive?: boolean;
  all?: boolean;
  page?: number;
  per_page?: number;
};

export type CreateServiceInput = {
  name: string;
  description?: string;
  duration_minutes?: number | string;
  price: number | string;
  requires_deposit?: boolean;
  deposit_amount?: number | string;
  active?: boolean;
  category_id?: number | string;
  img?: File | null;                // <- desde UI seguimos usando "img"
};

export type UpdateServiceInput = Partial<CreateServiceInput>;

// ============================
// Helpers
// ============================
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
  try { const j = await res.json(); return j?.message || JSON.stringify(j); }
  catch { return `HTTP ${res.status}`; }
}

// Map a UI
export function mapApiToUI(s: ServiceApi): UIService {
  const ui = {
    id: String(s.id),
    name: s.name,
    description: s.description ?? "",
    duration: s.duration_minutes ?? undefined,
    price: toNumber(s.price),
    image: s.img ?? undefined,
    category: s.category_id != null ? String(s.category_id) : undefined,
    active: !!s.active,
    isComingSoon: !s.active,
  } satisfies UIService;
  return ui;
}

// ============================
// fetch para multipart (NO forzar Content-Type)
// ============================
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

// ============================
// Fábrica
// ============================
export function makeServicesApi(
  authFetch: (path: string, init?: RequestInit) => Promise<Response>
) {
  const json = async <T>(res: Response): Promise<T> => {
    if (res.status === 204) return undefined as unknown as T;
    return (await res.json()) as T;
  };

  // Si hay FormData usamos tokenFetch para respetar el boundary
  const call = (path: string, init: RequestInit = {}) =>
    init.body instanceof FormData ? tokenFetch(path, init) : authFetch(path, init);

  // LIST
  async function listServicesRaw(params: ListParams = {}): Promise<Paginated<ServiceApi> | ServiceApi[]> {
    const qs = buildQS({
      q: params.q,
      category_id: params.category_id,
      include_inactive: params.include_inactive ? 1 : undefined,
      all: params.all ? 1 : undefined,
      page: params.page,
      per_page: params.per_page,
    });
    const res = await call(`/services${qs}`);
    if (!res.ok) throw new Error(await safeMessage(res));
    return json(res);
  }
  async function listServicesUI(params: ListParams = {}) {
    const r = await listServicesRaw(params);
    if (Array.isArray(r)) return { data: r.map(mapApiToUI) };
    const { data, ...rest } = r;
    return { data: data.map(mapApiToUI), pagination: rest };
  }

  // GET
  async function getServiceRaw(id: number | string): Promise<ServiceApi> {
    const res = await call(`/services/${id}`);
    if (!res.ok) throw new Error(await safeMessage(res));
    return json(res);
  }
  async function getServiceUI(id: number | string) { return mapApiToUI(await getServiceRaw(id)); }

  // CREATE (POST + FormData; archivo como "file")
  async function createService(input: CreateServiceInput) {
    const fd = new FormData();
    fd.set("name", input.name);
    if (input.description != null) fd.set("description", String(input.description));
    if (input.duration_minutes != null && input.duration_minutes !== "") fd.set("duration_minutes", String(input.duration_minutes));
    fd.set("price", String(input.price));
    if (input.requires_deposit != null) fd.set("requires_deposit", input.requires_deposit ? "1" : "0");
    if (input.deposit_amount != null && input.deposit_amount !== "") fd.set("deposit_amount", String(input.deposit_amount));
    if (input.active != null) fd.set("active", input.active ? "1" : "0");
    if (input.category_id != null && input.category_id !== "") fd.set("category_id", String(input.category_id));
    if (input.img) fd.set("file", input.img); // 👈 enviar como "file"

    const res = await call(`/services`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(await safeMessage(res));
    const j = await json<{ data: ServiceApi }>(res);
    return mapApiToUI(j.data ?? (j as any));
  }

  // UPDATE (SIEMPRE POST + FormData; archivo como "file")
  async function updateService(id: number | string, input: UpdateServiceInput) {
    const fd = new FormData();
    // SIN _method, SIN PUT —> SOLO POST
    if (input.name != null) fd.set("name", input.name);
    if (input.description != null) fd.set("description", String(input.description));
    if (input.duration_minutes != null) fd.set("duration_minutes", String(input.duration_minutes));
    if (input.price != null) fd.set("price", String(input.price));
    if (input.requires_deposit != null) fd.set("requires_deposit", input.requires_deposit ? "1" : "0");
    if (input.deposit_amount != null) fd.set("deposit_amount", String(input.deposit_amount));
    if (input.active != null) fd.set("active", input.active ? "1" : "0");
    if (input.category_id != null) fd.set("category_id", String(input.category_id));
    if (input.img instanceof File) fd.set("file", input.img);

    const res = await call(`/services/${id}`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(await safeMessage(res));
    const j = await json<{ data: ServiceApi }>(res);
    return mapApiToUI(j.data ?? (j as any));
  }

  // ACTIVAR / DESACTIVAR
  async function setServiceActive(id: number | string, active: boolean) {
    const res = await call(`/services/${id}/active`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (!res.ok) throw new Error(await safeMessage(res));
    const j = await json<{ data: ServiceApi }>(res);
    return mapApiToUI(j.data ?? (j as any));
  }

  // Opcional: DELETE suave si tienes ruta
  async function deactivateService(id: number | string) {
    const res = await call(`/services/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await safeMessage(res));
  }

  // Compat
  async function getServiceById(id: string) { try { return await getServiceUI(id); } catch { return undefined; } }
  async function getServicesByCategory(category: string) {
    const { data } = await listServicesUI({ category_id: category, include_inactive: true, all: true });
    return data;
  }
  async function getAvailableServices() {
    const { data } = await listServicesUI({ include_inactive: false, all: true });
    return data;
  }
  async function getComingSoonServices() {
    const { data } = await listServicesUI({ include_inactive: true, all: true });
    return data.filter(s => s.isComingSoon);
  }

  return {
    listServicesRaw, listServicesUI, getServiceRaw, getServiceUI,
    createService, updateService, setServiceActive, deactivateService,
    getServiceById, getServicesByCategory, getAvailableServices, getComingSoonServices,
  };
}
