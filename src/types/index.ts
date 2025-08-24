export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: number; // 0 = cliente, 1 = admin
  created_at: string; // ISO date string
  updated_at: string; 
  avatar?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
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

export interface Appointment {
  id: string;
  userId: string;
  serviceId: string;
  stylistId?: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
  serviceName: string;
  price: number;
  stylistName?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'product' | 'service';
  image?: string;
}

export interface BookingFormData {
  serviceId: string;
  stylistId?: string;
  date: string;
  time: string;
  notes?: string;
}