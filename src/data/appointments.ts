// src/data/appointments.ts
import type { Appointment, AppointmentItem } from '../types';

/** Utilidad:  "13:10" o "13:10:20"  ->  "1:10 PM" */
function to12h(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const [hh, mm] = raw.split(':');
  let h = Number(hh);
  const m = (mm ?? '00').padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Trae las citas del usuario autenticado desde el backend usando authFetch del AuthContext.
 * OJO: el path NO debe llevar /api al inicio, tu API_BASE ya termina en /api.
 */
export async function getAppointments(authFetch: (path: string, init?: RequestInit) => Promise<Response>): Promise<Appointment[]> {
  const res = await authFetch('/bookings/me', { method: 'GET' });
  if (!res.ok) {
    let msg = `Failed to load appointments (${res.status})`;
    try {
      const j = await res.json();
      if (j?.message) msg = j.message;
    } catch {}
    throw new Error(msg);
  }

  const json = await res.json();
  const data = (json?.data ?? []) as any[];

  // Mapeo defensivo -> Appointment
  return data.map((a): Appointment => {
    const items: AppointmentItem[] = Array.isArray(a.items)
      ? a.items.map((it: any) => ({
          id: String(it.id),
          serviceId: it.serviceId ?? null,
          name: it.name ?? null,
          quantity: Number(it.quantity ?? 1),
          unitPrice: Number(it.unitPrice ?? 0),
          lineTotal: Number(it.lineTotal ?? 0),
          duration: it.duration ?? null,
          listPrice: it.listPrice ?? null,
        }))
      : [];

    const computedServiceName =
      a.serviceName ??
      (items.length === 1 ? items[0]?.name ?? null : items.length > 1 ? `${items.length} services` : null);

    // status viene del backend como 'pending' | 'confirmed' | 'completed' | 'cancelled'
    const status: Appointment['status'] =
      a.status === 'pending' || a.status === 'confirmed' || a.status === 'completed' || a.status === 'cancelled'
        ? a.status
        : 'pending';

    return {
      id: String(a.id),
      userId: String(a.userId),
      stylistId: String(a.stylistId),
      stylistName: a.stylistName ?? null,
      date: a.date ?? null,
      // si el backend manda "13:10" o "13:10:20" lo convertimos a "1:10 PM"
      time: typeof a.time === 'string' && a.time.includes(':') && !a.time.includes('AM') && !a.time.includes('PM')
        ? to12h(a.time)
        : a.time ?? null,
      status,
      notes: a.notes ?? null,
      price: Number(a.price ?? 0),
      serviceName: computedServiceName,
      items,
    };
  });
}

/** Cancela una cita (POST /bookings/{id}/cancel) usando authFetch. */
export async function cancelAppointmentApi(
  id: string,
  authFetch: (path: string, init?: RequestInit) => Promise<Response>
): Promise<void> {
  const res = await authFetch(`/bookings/${id}/cancel`, { method: 'POST' });
  if (!res.ok) {
    let msg = `Unable to cancel appointment (${res.status})`;
    try {
      const j = await res.json();
      if (j?.message) msg = j.message;
    } catch {}
    throw new Error(msg);
  }
}
