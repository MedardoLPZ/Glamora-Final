export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  stylistId?: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: 'pending' | 'upcoming' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}

export interface Stylist {
  id: string;
  name: string;
  specialties: string[];
  phone: string;
  email: string;
  photo?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
  description?: string;
  photo?: string;
}

export interface ProductOrder {
  id: string;
  clientId: string;
  productName: string;
  quantity: number;
  price: number;
  orderDate: string;
  status: 'pending' | 'delivered' | 'cancelled';
}