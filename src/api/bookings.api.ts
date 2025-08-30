// src/api/bookings.api.ts
import type { Appointment } from "../types";

export type Fetcher = (path: string, init?: RequestInit) => Promise<Response>;

const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL ?? "http://localhost/glamora-bk/public/api";

/** Fetch público básico (sólo si el endpoint no requiere auth) */
async function publicFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");
  if (init.method && init.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

/** ───────── Types del dominio ───────── */
export type BookingId = string | number;

export interface CreateBookingDto {
  user_id: string | number;
  stylist_id: string | number | null;
  service_date: string;      // "YYYY-MM-DD"
  service_time: string;      // "HH:mm:ss" (24h)
  notes?: string | null;

  subtotal: number;          // 2 decimales
  tax: number;               // 2 decimales
  total_price: number;       // 2 decimales
  status: number;            // 0=pending,1=confirmed,...

  // Si tu backend acepta ítems en el create:
  items?: Array<{
    service_id: string | number;
    quantity: number;
    unit_price: number;
  }>;
}

export interface Booking {
  id: BookingId;
  user_id: string;
  stylist_id: string | null;
  service_date: string;
  service_time: string; // "HH:mm:ss"
  notes?: string | null;
  subtotal: string;     // Eloquent suele devolver decimales como string
  tax: string;
  total_price: string;
  status: number;
  created_at?: string | null;
}

/** ───────── Helpers reutilizables ───────── */

/** Convierte "9:30", "09:30", "9:30 pm", "09:30 AM" -> "HH:mm:ss" */
export function toTime24h(label: string): string {
  const t = String(label).trim().toUpperCase();
  const m = t.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
  if (!m) return "09:00:00";
  let [_, hh, mm, ap] = m;
  let H = parseInt(hh, 10);
  if (ap === "AM") {
    if (H === 12) H = 0;
  } else if (ap === "PM") {
    if (H !== 12) H += 12;
  }
  const HH = String(H).padStart(2, "0");
  return `${HH}:${mm}:00`;
}

/** Calcula subtotal/tax/total (puedes fijar TAX_RATE=0 si aún no lo usas) */
export function computeTotals(params: {
  price: number;
  taxRate: number;            // ej. 0.15
}) {
  const sub = +(Number(params.price) || 0).toFixed(2);
  const tax = +(sub * params.taxRate).toFixed(2);
  const tot = +(sub + tax).toFixed(2);
  return { subtotal: sub, tax, total: tot };
}

/** Mapea datos de tu UI al DTO del backend */
export function mapUIToCreateBooking(input: {
  userId: string | number;
  stylistId?: string | number | "";
  date: string;               // "YYYY-MM-DD"
  time: string;               // "9:30", "09:30", "09:30 AM"...
  notes?: string;
  service: { id: string | number; price: number };
  taxRate: number;            // ej. 0.15
  status?: number;            // default 0 (pending)
  includeItems?: boolean;     // default true
}): CreateBookingDto {
  const { subtotal, tax, total } = computeTotals({
    price: input.service.price,
    taxRate: input.taxRate,
  });

  const dto: CreateBookingDto = {
    user_id: input.userId,
    stylist_id: input.stylistId ? input.stylistId : null,
    service_date: input.date,
    service_time: toTime24h(input.time),
    notes: input.notes ?? null,
    subtotal,
    tax,
    total_price: total,
    status: input.status ?? 0,
  };

  if (input.includeItems ?? true) {
    dto.items = [
      {
        service_id: input.service.id,
        quantity: 1,
        unit_price: input.service.price,
      },
    ];
  }

  return dto;
}

/** ───────── Llamadas a API con la MISMA FÓRMULA de `users` ───────── */

/**
 * Crea una reserva (POST /bookings)
 * Pasa siempre tu authFetch en opts.fetcher para endpoints protegidos.
 */
export async function createBooking(
  body: CreateBookingDto,
  opts: { fetcher?: Fetcher } = {}
): Promise<Booking> {
  const doFetch = opts.fetcher
    ? (p: string, i?: RequestInit) => opts.fetcher!(p, i)
    : (p: string, i?: RequestInit) => publicFetch(p, i);

  const res = await doFetch("/bookings", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Accept": "application/json", "Content-Type": "application/json" },
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json())?.message ?? msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json();
}

/** (opcional) Agregar un item luego: POST /bookings/:id/items */
export async function addBookingItem(
  bookingId: BookingId,
  item: { service_id: string | number; quantity: number; unit_price: number; },
  opts: { fetcher?: Fetcher } = {}
) {
  const doFetch = opts.fetcher
    ? (p: string, i?: RequestInit) => opts.fetcher!(p, i)
    : (p: string, i?: RequestInit) => publicFetch(p, i);

  const res = await doFetch(`/bookings/${bookingId}/items`, {
    method: "POST",
    body: JSON.stringify(item),
    headers: { "Accept": "application/json", "Content-Type": "application/json" },
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json())?.message ?? msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json();
}

/* ──────────────────────────────────────────────────────────────
   NUEVO: traer y cancelar citas del usuario (GET /bookings/me)
   y (POST /bookings/{id}/cancel) con normalización opcional
   ────────────────────────────────────────────────────────────── */

/** Interno: normaliza status desde int/string */
function normalizeStatus(status: any, statusInt: any): Appointment["status"] {
  if (status === "pending" || status === "confirmed" || status === "completed" || status === "cancelled") {
    return status;
  }
  const map: Record<number, Appointment["status"]> = {
    0: "pending", 1: "confirmed", 2: "completed", 3: "cancelled",
  };
  if (typeof statusInt === "number" && map[statusInt]) return map[statusInt];
  return "pending";
}

/** Interno: 24h "HH:mm[:ss]" → "hh:mm AM/PM" (si ya viene con AM/PM, respeta) */
function to12h(time: string | null | undefined): string | null {
  if (!time) return null;
  const t = String(time).trim();
  if (/am|pm/i.test(t)) return t.toUpperCase();
  const m = t.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!m) return t;
  let h = parseInt(m[1], 10);
  const mm = m[2];
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${mm} ${ap}`;
}

/** Interno: tomar nombre de servicio desde items si no viene ya calculado */
function pickServiceName(row: any): string | null {
  if (row?.serviceName) return row.serviceName;
  const items = Array.isArray(row?.items) ? row.items : [];
  if (items.length === 1) return items[0]?.name ?? null;
  if (items.length > 1) return `${items.length} services`;
  return null;
}

/** Interno: mapea fila API → Appointment UI */
function mapApiBookingToAppointment(row: any): Appointment {
  const status = normalizeStatus(row.status, row.statusInt);

  return {
    id: String(row.id),
    userId: String(row.userId ?? row.user_id ?? ""),
    stylistId: row.stylistId != null ? String(row.stylistId) : null, // ← null ok
    stylistName: row.stylistName ?? null,
    date: row.date ?? null,
    time: to12h(row.time ?? null),
    status,
    notes: row.notes ?? null,
    price: Number(row.price ?? row.total_price ?? 0),
    serviceName: pickServiceName(row),
    items: Array.isArray(row.items)
      ? row.items.map((it: any) => ({
          id: String(it.id),
          serviceId: it.serviceId != null ? String(it.serviceId) : null,
          name: it.name ?? null,
          quantity: Number(it.quantity ?? 0),
          unitPrice: Number(it.unitPrice ?? it.unit_price ?? 0),
          lineTotal: Number(
            it.lineTotal ?? (Number(it.unit_price ?? 0) * Number(it.quantity ?? 0))
          ),
          duration: it.duration ?? null,
          listPrice: it.listPrice ?? null,
        }))
      : [],
  };
}


/** Trae las citas del usuario autenticado (GET /bookings/me) */
export async function listMyBookings(opts: { fetcher?: Fetcher } = {}): Promise<any[]> {
  const doFetch = opts.fetcher
    ? (p: string, i?: RequestInit) => opts.fetcher!(p, i)
    : (p: string, i?: RequestInit) => publicFetch(p, i);

  const res = await doFetch("/bookings/me", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json())?.message ?? msg; } catch {}
    throw new Error(msg);
  }
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
}

/**
 * Versión de alto nivel que devuelve `Appointment[]` ya normalizado.
 * Úsalo como:  const list = await getAppointments(authFetch)
 */
export async function getAppointments(fetcher: Fetcher): Promise<Appointment[]> {
  const rows = await listMyBookings({ fetcher });
  return rows.map(mapApiBookingToAppointment);
}

/** Cancela una cita (POST /bookings/{id}/cancel) */
export async function cancelAppointmentApi(bookingId: string, fetcher: Fetcher): Promise<void> {
  const res = await fetcher(`/bookings/${bookingId}/cancel`, {
    method: "POST",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json())?.message ?? msg; } catch {}
    throw new Error(msg);
  }
}
