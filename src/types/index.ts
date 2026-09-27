export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  active: boolean;
  highlight?: boolean;
  highlightText?: string;
  category?: string;
  iconName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Appointment {
  id?: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DaySlot {
  time: string; // "08:00"
  formatted: string;
  available: boolean;
  reason?: string;
}

export interface BusinessSettings {
  name: string;
  tagline: string;
  subtagline: string;
  whatsappNumber: string; // e.g. "5531999999999" or wa.link url
  whatsappLink: string;
  instagramUrl: string;
  logoUrl: string;
  openTime: string; // "08:00"
  closeTime: string; // "19:30"
  slotIntervalMinutes: number; // 45
}
