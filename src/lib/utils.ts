import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function generateTimeSlots(start = 6, end = 17, interval = 120): string[] {
  const slots: string[] = [];
  for (let hour = start; hour <= end; hour += 2) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hourDisplay = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    slots.push(`${hourDisplay}:00 ${ampm}`);
  }
  return slots;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const RESERVATION_FEE = 300;