// src/lib/users.ts
export type UserName = { id: string; name: string };
export type ClientUser = { id: string; name: string; email: string; phone: string };
export type Fetcher = (path: string, init?: RequestInit) => Promise<Response>;

const API_RAW = (import.meta as any).env?.VITE_API_URL ?? "http://localhost/glamora-bk/public/api";
const API_BASE: string = String(API_RAW).replace(/\/$/, ""); // quita "/" final

// ---- caché memoria + localStorage ----
type CacheEntry<T> = { ts: number; data: T[] };
const LS_KEY_INFO = "__users_info_cache__";
let memInfo: CacheEntry<ClientUser> | null = null;

const now = () => Date.now();

const normalizeInfo = (
  raw: Array<{ id: number | string; name?: string; email?: string; phone?: string }>
): ClientUser[] =>
  raw.map((u) => ({
    id: String(u.id),
    name: String(u.name ?? ""),
    email: String(u.email ?? ""),
    phone: String(u.phone ?? ""),
  }));

async function publicFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

function readLS<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

function writeLS<T>(key: string, entry: CacheEntry<T>) {
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    /* ignore */
  }
}

async function fetchWithAuthFallback(
  path: string,
  fetcher?: Fetcher,
  isPublic = false
): Promise<Response> {
  if (fetcher) {
    const res = await fetcher(path, { headers: { Accept: "application/json" } });
    if (isPublic && res.status === 401) {
      return publicFetch(path);
    }
    return res;
  }
  if (isPublic) return publicFetch(path);
  throw new Error("Ruta protegida sin fetcher de autenticación");
}

/**
 * Obtiene /users/info (id, name, email, phone) con caché.
 * Pasa tu authFetch en `fetcher` si la ruta es protegida.
 */
export async function listClientsInfoCached(
  opts: { fetcher?: Fetcher; ttlMs?: number; forceRefresh?: boolean; isPublic?: boolean } = {}
): Promise<ClientUser[]> {
  const { fetcher, ttlMs = 60 * 60 * 1000, forceRefresh = false, isPublic = false } = opts;

  // memoria
  if (!forceRefresh && memInfo && now() - memInfo.ts < ttlMs) {
    return memInfo.data;
  }
  // localStorage
  if (!forceRefresh) {
    const cached = readLS<ClientUser>(LS_KEY_INFO);
    if (cached && now() - cached.ts < ttlMs && Array.isArray(cached.data)) {
      memInfo = cached;
      return cached.data;
    }
  }

  const res = await fetchWithAuthFallback("/users/info", opts.fetcher, isPublic);
  if (!res.ok) throw new Error(`GET /users/info -> ${res.status}`);
  const raw = await res.json();
  const arr = Array.isArray(raw) ? raw : raw?.data ?? [];
  const data = normalizeInfo(arr);

  const entry: CacheEntry<ClientUser> = { ts: now(), data };
  memInfo = entry;
  writeLS(LS_KEY_INFO, entry);

  return data;
}

export function clearClientsInfoCache() {
  memInfo = null;
  try {
    localStorage.removeItem(LS_KEY_INFO);
  } catch {
    /* ignore */
  }
}
