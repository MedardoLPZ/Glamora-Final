// ========================
// Auth / Usuario
// ========================
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: number;            // 0 = cliente, 1 = admin
  created_at: string;
  updated_at: string;
  avatar?: string;
}

export interface AuthResponse {
  user: User;
  token: string;           // Bearer token
}

// ========================
// Catálogos
// ========================
export type Service = {
  id: string;
  name: string;
  description?: string;
  duration?: number;
  price: number;
  image?: string;
  category?: string;
  active: boolean;         // requerido por la UI
  isComingSoon?: boolean;
};

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;           // <- así lo usa la UI
  category: string;
  inStock: boolean;        // <- NECESARIO para ProductModal/Home
}

export interface Category {
  id: string;
  description: string;
}

export interface Stylist {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  bio: string;
}

// ========================
// Órdenes de productos
// ========================
export interface ProductOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  image?: string;
  category?: string;
}

export type OrderStatus = "pending" | "fulfilled" | "cancelled" | "refunded";

export interface ProductOrder {
  id: string;
  clientId: string;
  items: ProductOrderItem[];
  total: number;
  status: OrderStatus;
  created_at?: string;
  updated_at?: string;
}

// ========================
// Carrito
// ========================
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "product" | "service";
  image?: string;
}

// ========================
// Bookings / Citas
// ========================
export interface AppointmentItem {
  id: string;                     // booking_items.id
  serviceId: string | null;       // services.id
  name: string | null;            // services.name
  quantity: number;
  unitPrice: number;
  lineTotal: number;              // unitPrice * quantity
  duration?: number | null;       // minutos
  listPrice?: number | null;      // precio de lista
}

export interface Appointment {
  id: string;
  userId: string;
  stylistId: string | null;   // ← permitir null
  stylistName?: string | null;
  date: string | null;
  time: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string | null;
  price: number;
  serviceName?: string | null;
  items: AppointmentItem[];
}


// ========================
// Formularios
// ========================
export interface BookingFormData {
  serviceId: string;
  stylistId?: string;
  date: string;           // "YYYY-MM-DD"
  time: string;           // "HH:mm"
  notes?: string;
}

// Si necesitas reflejar exactamente lo del backend:
export type ApiAppointment = Appointment;
