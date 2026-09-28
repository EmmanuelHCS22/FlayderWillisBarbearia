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
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface ServiceItemInBooking {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export interface Appointment {
  id?: string;
  customerName: string;
  customerPhone: string;
  serviceId?: string;
  serviceName: string;
  services?: ServiceItemInBooking[];
  serviceDuration: number;
  servicePrice: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AppointmentStatus;
  notificationStatus?: NotificationStatus;
  notificationSentAt?: string;
  notificationMessageId?: string;
  notificationError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DaySlot {
  time: string; // "08:00"
  formatted: string;
  available: boolean;
  reason?: string;
}

export interface CarouselImageItem {
  id: string;
  url: string;
  order: number;
  active: boolean;
  title?: string;
  storageRefPath?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminConfig {
  configured: boolean;
  adminIdentifier: string;
  createdAt: string;
}

export interface WhatsAppSettings {
  barberPhoneNumber: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  hasAccessToken?: boolean;
  isConfigured: boolean;
  lastTestedAt?: string;
  lastTestStatus?: 'success' | 'failed';
  lastTestMessage?: string;
  lastTestError?: string;
  updatedAt?: string;
}

export interface BusinessSettings {
  name: string;
  tagline: string;
  subtagline: string;
  whatsappNumber: string;
  whatsappLink: string;
  instagramUrl: string;
  logoUrl: string;
  openTime: string;
  closeTime: string;
  slotIntervalMinutes: number;
}
