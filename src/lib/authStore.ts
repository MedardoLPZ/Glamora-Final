// src/lib/authStore.ts
import type { User } from '../types';

export type AuthState = { user: User | null; token: string | null };

const KEY = 'auth';
const listeners = new Set<(state: AuthState) => void>();

function read(): AuthState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { user: null, token: null };
    const parsed = JSON.parse(raw) as AuthState;
    return { user: parsed.user ?? null, token: parsed.token ?? null };
  } catch {
    return { user: null, token: null };
  }
}

function write(state: AuthState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach(fn => fn(state));
}

export function getAuth(): AuthState {
  return read();
}

export function getToken(): string | null {
  return read().token;
}

export function setAuth(user: User, token: string) {
  write({ user, token });
}

export function clearAuth() {
  write({ user: null, token: null });
}

export function onAuthChange(fn: (state: AuthState) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Sincroniza entre pestañas/ventanas
window.addEventListener('storage', (e) => {
  if (e.key === KEY) listeners.forEach(fn => fn(read()));
});
