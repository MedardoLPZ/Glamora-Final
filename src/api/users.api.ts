export type UserName = { id: string; name: string };
export type Fetcher = (path: string, init?: RequestInit) => Promise<Response>;

const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL ?? "http://localhost/glamora-bk/public/api";

// ---- caché memoria + localStorage ----
type CacheEntry = { ts: number; data: UserName[] };
const LS_KEY = "__users_names_cache__";
let memCache: CacheEntry | null = null;

const now = () => Date.now();
const normalize = (raw: Array<{ id: number | string; name: string }>): UserName[] =>
  raw.map(u => ({ id: String(u.id), name: String(u.name ?? "") }));

/** Público sólo si lo necesitas; /users/names normalmente es PROTEGIDO */
async function publicFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

/**
 * Obtiene /users/names con caché.
 * Pasa SIEMPRE tu authFetch en `fetcher` para que lleve Authorization.
 */
export async function listUserNamesCached(
  opts: { fetcher?: Fetcher; ttlMs?: number; forceRefresh?: boolean } = {}
): Promise<UserName[]> {
  const { fetcher, ttlMs = 60 * 60 * 1000, forceRefresh = false } = opts;

  if (!forceRefresh && memCache && now() - memCache.ts < ttlMs) {
    return memCache.data;
  }

  if (!forceRefresh) {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed: CacheEntry = JSON.parse(raw);
        if (now() - parsed.ts < ttlMs && Array.isArray(parsed.data)) {
          memCache = parsed;
          return parsed.data;
        }
      }
    } catch { /* ignore */ }
  }

  const doFetch = fetcher
    ? () => fetcher("/users/names", { headers: { Accept: "application/json" } })
    : () => publicFetch("/users/names");

  const res = await doFetch();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = normalize(await res.json());

  const entry: CacheEntry = { ts: now(), data };
  memCache = entry;
  try { localStorage.setItem(LS_KEY, JSON.stringify(entry)); } catch { /* ignore */ }

  return data;
}

export function clearUserNamesCache() {
  memCache = null;
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
}
