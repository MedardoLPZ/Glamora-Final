// src/context/AuthContext.tsx
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { User, AuthResponse } from '../types';
import {
  getAuth as storeGetAuth,
  getToken as storeGetToken,
  setAuth as storeSetAuth,
  clearAuth as storeClearAuth,
  onAuthChange,
} from '../lib/authStore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>; // 👈 devuelve User
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmResetPassword: (
    email: string,
    token: string,
    password: string,
    password_confirmation: string
  ) => Promise<void>;
  authFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE =
  import.meta.env.VITE_API_URL ?? 'http://localhost/glamora-bk/public/api';

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const safeJson = async (res: Response) => {
    try {
      return await res.json();
    } catch {
      return null;
    }
  };

  const authFetch = async (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers || {});
    headers.set('Content-Type', 'application/json');
    const t = storeGetToken();
    if (t) headers.set('Authorization', `Bearer ${t}`);
    return fetch(`${API_BASE}${path}`, { ...init, headers });
  };

  // Rehidratación + suscripción al store + revalidación /auth/me
  useEffect(() => {
    const current = storeGetAuth();
    setUser(current.user);
    setToken(current.token);

    const revalidate = async () => {
      if (!current.token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          method: 'GET',
          headers: new Headers({ Authorization: `Bearer ${current.token}` }),
        });
        if (!res.ok) throw new Error('Invalid token');
        const maybeObj = await res.json();
        const realUser: User =
          maybeObj && maybeObj.user ? maybeObj.user : maybeObj;
        storeSetAuth(realUser, current.token);
      } catch {
        storeClearAuth();
      } finally {
        setLoading(false);
      }
    };

    void revalidate();

    const off = onAuthChange((state) => {
      setUser(state.user);
      setToken(state.token);
    });
    return () => {
      off();
    };
  }, []);

  // 👇 ahora retorna el usuario logueado
  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(err?.message || 'Error al iniciar sesión');
      }
      const data = (await res.json()) as AuthResponse;
      storeSetAuth(data.user, data.token);
      return data.user; // 👈 devolvemos el user
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(err?.message || 'Error al registrarse');
      }
      const data = (await res.json()) as AuthResponse;
      storeSetAuth(data.user, data.token);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      storeClearAuth();
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(
          err?.message || 'No se pudo enviar el correo de recuperación'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmResetPassword = async (
    email: string,
    token: string,
    password: string,
    password_confirmation: string
  ) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token,
          password,
          password_confirmation,
        }),
      });
      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(err?.message || 'No se pudo restablecer la contraseña');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        resetPassword,
        confirmResetPassword,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
