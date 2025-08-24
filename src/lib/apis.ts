// src/lib/api.ts
import { getToken } from './authStore';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost/glamora-bk/public/api';

/**
 * apiFetch agrega automáticamente:
 * - baseURL desde .env
 * - Content-Type: application/json
 * - Authorization: Bearer <token> (si existe)
 */
export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  return res;
}
//comentario