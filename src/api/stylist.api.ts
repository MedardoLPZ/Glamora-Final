// Cliente API para Stylists (GET/POST)
//
// Público:   GET  /catalog/stylists
// Protegido: GET  /stylists
//            GET  /stylists/:id
//            POST /stylists
//            POST /stylists/:id          (EDITAR con FormData/POST)
//            POST /stylists/:id/active
// Extra:     GET  /users/names           -> [{ id, name }]

export type Fetcher = (path: string, init?: RequestInit) => Promise<Response>;
export type GetToken = () => string | null | undefined;

const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL ?? "http://localhost/glamora-bk/public/api";

/** ===== Tipos backend ===== */
export interface StylistApi {
  id: number;
  user_id: number | null;
  name?: string | null;
  specialty?: string | null;
  img?: string | null;
  bio?: string | null;
  active: boolean | 0 | 1;
  created_at?: string | null;
}

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

/** ===== UI ===== */
export interface UIStylist {
  id: string;
  userId?: string;
  name: string;
  specialty?: string;
  image?: string;
  bio?: string;
  active: boolean;
  createdAt?: string;
}

/** ===== Inputs ===== */
export type ListParams = { all?: boolean; page?: number; per_page?: number };

export type CreateStylistInput = {
  user_id: number | string;
  specialty?: string;
  bio?: string;
  active?: boolean;
  img?: File | null; // se envía como "file"
};

// Para update enviamos user_id SIEMPRE (tu backend lo valida)
export type UpdateStylistInput = {
  user_id: number | string;
  specialty?: string;
  bio?: string;
  active?: boolean;
  img?: File | null;
};

/** ===== Helpers ===== */
function buildQS(params: Record<string, any>) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    p.set(k, String(v));
  });
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

async function toJsonOrText<T = any>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) return (await res.json()) as T;
    const raw = await res.text();
    try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
  } catch {
    return (await res.text()) as unknown as T;
  }
}

async function safeMessage(res: Response): Promise<string> {
  const data = await toJsonOrText<any>(res);
  if (typeof data === "string") return data;
  if (data?.message) return String(data.message);
  try { return JSON.stringify(data); } catch { return `HTTP ${res.status}`; }
}

/** Público (sin token) */
async function publicFetch(path: string, init: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");
  return fetch(url, { ...init, headers });
}

/** Mapear API -> UI */
export function mapApiToUI(s: StylistApi): UIStylist {
  return {
    id: String(s.id),
    userId: s.user_id != null ? String(s.user_id) : undefined,
    name: s.name ?? "",
    specialty: s.specialty ?? undefined,
    image: s.img ?? undefined,
    bio: s.bio ?? undefined,
    active: typeof s.active === "boolean" ? s.active : s.active === 1,
    createdAt: s.created_at ?? undefined,
  };
}

/** ===== Cache de /users/names ===== */
export type UserName = { id: string; name: string };
let _usersCache: { data: UserName[]; exp: number } | null = null;

/** ===== Fábrica ===== */
export function makeStylistsApi(authFetch: Fetcher, getToken?: GetToken) {
  const json = async <T>(res: Response): Promise<T> => (await toJsonOrText<T>(res)) as T;

  /** JSON calls con authFetch */
  const callJson = (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers || {});
    headers.set("Accept", "application/json");
    if (init.method && init.method !== "GET" && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return authFetch(path, { ...init, headers });
  };

  /** FormData calls con fetch crudo + Authorization, sin content-type */
  const callForm = (path: string, body: FormData) => {
    const token =
      getToken?.() ||
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("token") ||
      "";
    const url = `${API_BASE}${path}`;
    const headers = new Headers({ Accept: "application/json" });
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(url, { method: "POST", headers, body });
  };

  /* ----- LIST (PUBLIC) ----- */
  async function listPublicStylistsRaw(params: ListParams = {}): Promise<Paginated<StylistApi> | StylistApi[]> {
    const qs = buildQS({ all: params.all ? 1 : undefined, page: params.page, per_page: params.per_page });
    const res = await publicFetch(`/catalog/stylists${qs}`);
    if (!res.ok) throw new Error(await safeMessage(res));
    return json(res);
  }
  async function listPublicStylistsUI(params: ListParams = {}) {
    const r = await listPublicStylistsRaw(params);
    if (Array.isArray(r)) return { data: r.map(mapApiToUI) };
    const { data, ...rest } = r;
    return { data: data.map(mapApiToUI), pagination: rest };
  }

  /* ----- LIST (PROTEGIDO) ----- */
  async function listStylistsRaw(params: ListParams = {}): Promise<Paginated<StylistApi> | StylistApi[]> {
    const qs = buildQS({ all: params.all ? 1 : undefined, page: params.page, per_page: params.per_page });
    const res = await callJson(`/stylists${qs}`);
    if (!res.ok) throw new Error(await safeMessage(res));
    return json(res);
  }
  async function listStylistsUI(params: ListParams = {}) {
    const r = await listStylistsRaw(params);
    if (Array.isArray(r)) return { data: r.map(mapApiToUI) };
    const { data, ...rest } = r;
    return { data: data.map(mapApiToUI), pagination: rest };
  }

  /* ----- GET ONE ----- */
  async function getStylistRaw(id: number | string): Promise<StylistApi> {
    const res = await callJson(`/stylists/${id}`);
    if (!res.ok) throw new Error(await safeMessage(res));
    return json(res);
  }
  async function getStylistUI(id: number | string) {
    return mapApiToUI(await getStylistRaw(id));
  }

  /* ----- CREATE (POST + FormData) ----- */
  async function createStylist(input: CreateStylistInput) {
    const fd = new FormData();
    fd.set("user_id", String(input.user_id));
    fd.set("specialty", input.specialty ?? "");
    fd.set("bio", input.bio ?? "");
    fd.set("active", input.active ? "1" : "0");
    if (input.img instanceof File) fd.set("file", input.img);
    const res = await callForm(`/stylists`, fd);
    if (!res.ok) throw new Error(await safeMessage(res));
    const j = await json<StylistApi>(res);
    return mapApiToUI(j);
  }

  /* ----- UPDATE (POST + FormData, SIN _method) ----- */
  async function updateStylist(id: number | string, input: UpdateStylistInput) {
    const fd = new FormData();
    fd.set("user_id", String(input.user_id)); // requerido por tu backend
    fd.set("specialty", input.specialty ?? "");
    fd.set("bio", input.bio ?? "");
    if (input.active != null) fd.set("active", input.active ? "1" : "0");
    if (input.img instanceof File) fd.set("file", input.img);
    const res = await callForm(`/stylists/${id}`, fd); // 👈 POST directo (sin _method)
    if (!res.ok) throw new Error(await safeMessage(res));
    const j = await toJsonOrText<StylistApi>(res) as StylistApi;
    return mapApiToUI(j);
  }

  /* ----- ACTIVE ----- */
  async function setStylistActive(id: number | string, active: boolean) {
    const res = await callJson(`/stylists/${id}/active`, {
      method: "POST",
      body: JSON.stringify({ active }),
    });
    if (!res.ok) throw new Error(await safeMessage(res));
    const j = await toJsonOrText<StylistApi>(res) as StylistApi;
    return mapApiToUI(j);
  }

  /* ----- USERS/NAMES + cache ----- */
  async function listUserNames(): Promise<UserName[]> {
    const res = await callJson(`/users/names`);
    if (!res.ok) throw new Error(await safeMessage(res));
    const raw = await toJsonOrText<any>(res);
    const list = Array.isArray(raw) ? raw : raw?.data || [];
    return list.map((u: any) => ({ id: String(u.id), name: String(u.name ?? "") }));
  }

  async function listUserNamesCached(ttlMs = 5 * 60 * 1000): Promise<UserName[]> {
    const now = Date.now();
    if (_usersCache && _usersCache.exp > now) return _usersCache.data;
    const data = await listUserNames();
    _usersCache = { data, exp: now + ttlMs };
    return data;
  }

  /* ----- Helpers ----- */
  async function getPublicStylistsAll() {
    const { data } = await listPublicStylistsUI({ all: true });
    return data;
  }

  return {
    listPublicStylistsRaw,
    listPublicStylistsUI,
    listStylistsRaw,
    listStylistsUI,
    getPublicStylistsAll,

    getStylistRaw,
    getStylistUI,

    createStylist,
    updateStylist,
    setStylistActive,

    listUserNames,
    listUserNamesCached,
  };
}
