// ========================
// Auth / Usuario
// ========================
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: number;            // 0 = cliente, 1 = admin
  created_at: string;      // ISO date string
  updated_at: string;      // ISO date string
  avatar?: string;
}

export interface AuthResponse {
  user: User;
  token: string;           // Bearer token
}

// ========================
// Catálogos
// ========================
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;           // precio base del servicio
  duration: number;        // minutos (front normalizado)
  image: string;
  category: string;
  isComingSoon?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

export interface Stylist {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  bio: string;
}

// ========================
// Carrito
// ========================
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'product' | 'service';
  image?: string;
}

// ========================
// Bookings / Citas
// ========================

// Item de la cita (uno por servicio seleccionado)
export interface AppointmentItem {
  id: string;                     // booking_items.id
  serviceId: string | null;       // services.id (puede venir null si no está seteado)
  name: string | null;            // services.name
  quantity: number;
  unitPrice: number;
  lineTotal: number;              // unitPrice * quantity
  duration?: number | null;       // duración del servicio (minutos), si aplica
  listPrice?: number | null;      // precio de lista del servicio, si aplica
}

// Cita agregada para la UI
export interface Appointment {
  id: string;
  userId: string;
  stylistId: string;                              // requerido
  stylistName?: string | null;

  date: string | null;                            // ej: "Thu, Aug 21, 2025"
  time: string | null;                            // ej: "10:00 AM"
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string | null;

  price: number;                                  // total_price de la cita
  serviceName?: string | null;                    // atajo: 1 ítem => nombre; >1 => "N services"

  items: AppointmentItem[];                       // todos los ítems/servicios de la cita
}

// ========================
// Formularios
// ========================

// Si SOLO reservas 1 servicio por cita (simple):
export interface BookingFormData {
  serviceId: string;
  stylistId?: string;
  date: string;           // "YYYY-MM-DD"
  time: string;           // "HH:mm"
  notes?: string;
}

/*
// Si vas a soportar varios servicios por cita (alternativa):
export interface BookingFormData {
  stylistId?: string;
  date: string;           // "YYYY-MM-DD"
  time: string;           // "HH:mm"
  notes?: string;
  items: Array<{
    serviceId: string;
    quantity: number;
  }>;
}
*/

// ========================
// (Opcional) Tipo que refleja exactamente lo que viene del backend.
// Si tu backend ya devuelve el mismo shape que Appointment, puedes usar:
export type ApiAppointment = Appointment;
