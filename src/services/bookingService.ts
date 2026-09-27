import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  runTransaction,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Service, Appointment, CarouselImageItem, AdminConfig } from '../types';
import { DEFAULT_SERVICES, DEFAULT_CAROUSEL_IMAGES, CLOSING_TIME_MINUTES, WHATSAPP_PHONE_NUMBER } from '../constants';

const SERVICES_COLLECTION = 'services';
const APPOINTMENTS_COLLECTION = 'appointments';
const SLOT_LOCKS_COLLECTION = 'slot_locks';
const CAROUSEL_COLLECTION = 'carousel';
const ADMIN_CONFIG_COLLECTION = 'admin_config';

/**
 * Check if Admin is already configured in Firebase
 */
export async function getAdminConfigStatus(): Promise<{ isConfigured: boolean; email?: string }> {
  try {
    const configDocRef = doc(db, ADMIN_CONFIG_COLLECTION, 'main');
    const docSnap = await getDoc(configDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as AdminConfig;
      return { isConfigured: !!data.configured, email: data.adminEmail };
    }
    return { isConfigured: false };
  } catch (err) {
    console.error('Erro ao verificar config admin:', err);
    return { isConfigured: false };
  }
}

/**
 * Record Admin configured status in Firebase
 */
export async function setAdminConfigured(adminEmail: string): Promise<void> {
  const configDocRef = doc(db, ADMIN_CONFIG_COLLECTION, 'main');
  await setDoc(configDocRef, {
    configured: true,
    adminEmail,
    createdAt: new Date().toISOString()
  });
}

/**
 * Ensures services are seeded in Firestore if not already present.
 */
export async function seedServicesIfEmpty(): Promise<Service[]> {
  try {
    const servicesRef = collection(db, SERVICES_COLLECTION);
    const snapshot = await getDocs(servicesRef);

    if (snapshot.empty) {
      const batch = writeBatch(db);
      const now = new Date().toISOString();
      const servicesToSeed: Service[] = DEFAULT_SERVICES.map(s => ({
        ...s,
        createdAt: now,
        updatedAt: now
      }));

      for (const service of servicesToSeed) {
        const docRef = doc(db, SERVICES_COLLECTION, service.id);
        batch.set(docRef, service);
      }

      await batch.commit();
      return servicesToSeed;
    }

    const services: Service[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as Service;
      services.push({ ...data, id: docSnap.id });
    });
    return services;
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    return DEFAULT_SERVICES;
  }
}

/**
 * Subscribes to live services from Firestore (all services for admin, active only filtered on client)
 */
export function subscribeToServices(callback: (services: Service[]) => void) {
  const servicesRef = collection(db, SERVICES_COLLECTION);
  return onSnapshot(servicesRef, (snapshot) => {
    if (snapshot.empty) {
      seedServicesIfEmpty().then(callback);
    } else {
      const services: Service[] = [];
      snapshot.forEach(docSnap => {
        services.push({ ...docSnap.data(), id: docSnap.id } as Service);
      });
      callback(services);
    }
  }, (err) => {
    console.error('Erro ao carregar serviços:', err);
    callback(DEFAULT_SERVICES);
  });
}

/**
 * Service Management (CRUD for Admin Area)
 */
export async function createService(newService: Omit<Service, 'id'>): Promise<string> {
  const newDocRef = doc(collection(db, SERVICES_COLLECTION));
  const now = new Date().toISOString();
  const serviceData: Service = {
    ...newService,
    id: newDocRef.id,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(newDocRef, serviceData);
  return newDocRef.id;
}

export async function updateService(serviceId: string, updates: Partial<Service>): Promise<void> {
  const docRef = doc(db, SERVICES_COLLECTION, serviceId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

export async function toggleServiceStatus(serviceId: string, active: boolean): Promise<void> {
  const docRef = doc(db, SERVICES_COLLECTION, serviceId);
  await updateDoc(docRef, {
    active,
    updatedAt: new Date().toISOString()
  });
}

/**
 * CAROUSEL MANAGEMENT (Firestore + Firebase Storage / URLs)
 */

export async function seedCarouselIfEmpty(): Promise<CarouselImageItem[]> {
  try {
    const carouselRef = collection(db, CAROUSEL_COLLECTION);
    const snapshot = await getDocs(carouselRef);

    if (snapshot.empty) {
      const batch = writeBatch(db);
      const now = new Date().toISOString();
      const initialImages: CarouselImageItem[] = DEFAULT_CAROUSEL_IMAGES.map((url, idx) => ({
        id: `img_${idx + 1}`,
        url,
        order: idx,
        active: true,
        title: `Trabalho ${idx + 1}`,
        createdAt: now
      }));

      for (const item of initialImages) {
        const docRef = doc(db, CAROUSEL_COLLECTION, item.id);
        batch.set(docRef, item);
      }

      await batch.commit();
      return initialImages;
    }

    const items: CarouselImageItem[] = [];
    snapshot.forEach(docSnap => {
      items.push({ ...docSnap.data(), id: docSnap.id } as CarouselImageItem);
    });
    items.sort((a, b) => a.order - b.order);
    return items;
  } catch (error) {
    console.error('Erro ao buscar carrossel:', error);
    return DEFAULT_CAROUSEL_IMAGES.map((url, idx) => ({
      id: `img_${idx + 1}`,
      url,
      order: idx,
      active: true,
      createdAt: new Date().toISOString()
    }));
  }
}

export function subscribeToCarousel(callback: (images: CarouselImageItem[]) => void) {
  const carouselRef = collection(db, CAROUSEL_COLLECTION);
  const q = query(carouselRef, orderBy('order', 'asc'));

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      seedCarouselIfEmpty().then(callback);
    } else {
      const images: CarouselImageItem[] = [];
      snapshot.forEach(docSnap => {
        images.push({ ...docSnap.data(), id: docSnap.id } as CarouselImageItem);
      });
      callback(images);
    }
  }, (err) => {
    console.error('Erro ao ouvir carrossel:', err);
    callback(
      DEFAULT_CAROUSEL_IMAGES.map((url, idx) => ({
        id: `img_${idx + 1}`,
        url,
        order: idx,
        active: true,
        createdAt: new Date().toISOString()
      }))
    );
  });
}

/**
 * Upload an image file to Firebase Storage and add to Carousel collection
 */
export async function uploadCarouselImage(file: File, currentCount: number): Promise<string> {
  try {
    const timestamp = Date.now();
    const fileName = `carousel_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storageRef = ref(storage, `carousel/${fileName}`);
    
    // Upload bytes to Firebase Storage
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    // Save to Firestore
    const newDocRef = doc(collection(db, CAROUSEL_COLLECTION));
    const newImage: CarouselImageItem = {
      id: newDocRef.id,
      url: downloadUrl,
      order: currentCount,
      active: true,
      title: file.name,
      createdAt: new Date().toISOString()
    };
    await setDoc(newDocRef, newImage);
    return newDocRef.id;
  } catch (err) {
    console.error('Erro no upload para Firebase Storage:', err);
    throw err;
  }
}

/**
 * Add an image via URL directly (supports imgur and external URLs)
 */
export async function addCarouselImageUrl(url: string, currentCount: number, title?: string): Promise<string> {
  const newDocRef = doc(collection(db, CAROUSEL_COLLECTION));
  const newImage: CarouselImageItem = {
    id: newDocRef.id,
    url: url.trim(),
    order: currentCount,
    active: true,
    title: title || 'Nova foto',
    createdAt: new Date().toISOString()
  };
  await setDoc(newDocRef, newImage);
  return newDocRef.id;
}

/**
 * Toggle active state of a carousel image
 */
export async function toggleCarouselImageActive(id: string, active: boolean): Promise<void> {
  const docRef = doc(db, CAROUSEL_COLLECTION, id);
  await updateDoc(docRef, { active, updatedAt: new Date().toISOString() });
}

/**
 * Delete image from carousel collection
 */
export async function deleteCarouselImage(id: string): Promise<void> {
  const docRef = doc(db, CAROUSEL_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Update carousel items order
 */
export async function updateCarouselOrder(reorderedItems: CarouselImageItem[]): Promise<void> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  reorderedItems.forEach((item, index) => {
    const docRef = doc(db, CAROUSEL_COLLECTION, item.id);
    batch.update(docRef, { order: index, updatedAt: now });
  });
  await batch.commit();
}

/**
 * Block a time slot as Admin
 */
export async function blockSlotAsAdmin(data: {
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
}): Promise<void> {
  const newAppointmentRef = doc(collection(db, APPOINTMENTS_COLLECTION));
  const nowIso = new Date().toISOString();
  
  const blockAppointment: Appointment = {
    id: newAppointmentRef.id,
    customerName: data.reason || 'Horário Bloqueado pela Barbearia',
    customerPhone: '(00) 00000-0000',
    serviceId: 'bloqueio',
    serviceName: 'Bloqueio Administrativo',
    serviceDuration: timeStringToMinutes(data.endTime) - timeStringToMinutes(data.startTime),
    servicePrice: 0,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    status: 'confirmed',
    createdAt: nowIso,
    updatedAt: nowIso
  };

  // Update day locks
  const dayLockDocId = `lock_${data.date}`;
  const dayLockRef = doc(db, SLOT_LOCKS_COLLECTION, dayLockDocId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(dayLockRef);
    const existing = snap.exists() ? (snap.data()?.slots || []) : [];
    const updated = [
      ...existing,
      {
        appointmentId: newAppointmentRef.id,
        startTime: data.startTime,
        endTime: data.endTime,
        createdAt: nowIso
      }
    ];
    tx.set(dayLockRef, { date: data.date, slots: updated, updatedAt: nowIso }, { merge: true });
    tx.set(newAppointmentRef, blockAppointment);
  });
}

/**
 * Release / Cancel an appointment and free its slot lock
 */
export async function cancelAppointmentAndFreeSlot(appointment: Appointment): Promise<void> {
  if (!appointment.id) return;
  const aptRef = doc(db, APPOINTMENTS_COLLECTION, appointment.id);
  const nowIso = new Date().toISOString();

  // Update status to cancelled
  await updateDoc(aptRef, {
    status: 'cancelled',
    updatedAt: nowIso
  });

  // Free from day lock document so it becomes available immediately
  try {
    const dayLockDocId = `lock_${appointment.date}`;
    const dayLockRef = doc(db, SLOT_LOCKS_COLLECTION, dayLockDocId);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(dayLockRef);
      if (snap.exists()) {
        const slots = snap.data()?.slots || [];
        const filtered = slots.filter((s: any) => s.appointmentId !== appointment.id && s.startTime !== appointment.startTime);
        tx.update(dayLockRef, { slots: filtered, updatedAt: nowIso });
      }
    });
  } catch (err) {
    console.error('Erro ao liberar trava de horário:', err);
  }
}

/**
 * Time utility functions
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Calculates end time based on start time and service duration
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startMin = timeStringToMinutes(startTime);
  const endMin = startMin + durationMinutes;
  return minutesToTimeString(endMin);
}

/**
 * Checks whether two time ranges [start1, end1) and [start2, end2) overlap
 */
export function isOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const a1 = timeStringToMinutes(startA);
  const a2 = timeStringToMinutes(endA);
  const b1 = timeStringToMinutes(startB);
  const b2 = timeStringToMinutes(endB);

  return a1 < b2 && a2 > b1;
}

/**
 * Listen to appointments for a given date in real-time
 */
export function subscribeToAppointmentsForDate(
  dateStr: string,
  callback: (appointments: Appointment[]) => void
) {
  const q = query(
    collection(db, APPOINTMENTS_COLLECTION),
    where('date', '==', dateStr)
  );

  return onSnapshot(q, (snapshot) => {
    const appointments: Appointment[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as Appointment;
      // Exclude cancelled appointments so cancelled slots are immediately available
      if (data.status !== 'cancelled') {
        appointments.push({ ...data, id: docSnap.id });
      }
    });
    callback(appointments);
  }, (err) => {
    console.error('Erro ao verificar horários:', err);
  });
}

/**
 * Computes availability of base slots for a given date and service duration,
 * considering all existing active appointments on that date from Firestore.
 */
export function computeSlotAvailability(
  baseSlots: string[],
  activeAppointments: Appointment[],
  serviceDuration: number
) {
  return baseSlots.map(slotTime => {
    const slotStartMin = timeStringToMinutes(slotTime);
    const slotEndMin = slotStartMin + serviceDuration;
    const slotEndTime = minutesToTimeString(slotEndMin);

    // Rule 1: Cannot exceed closing time (19:30)
    if (slotEndMin > CLOSING_TIME_MINUTES) {
      return {
        time: slotTime,
        formatted: slotTime,
        available: false,
        reason: 'Ultrapassa o horário de encerramento (19:30)'
      };
    }

    // Rule 2: Cannot overlap with any existing non-cancelled appointment
    const conflict = activeAppointments.find(apt => {
      return isOverlapping(slotTime, slotEndTime, apt.startTime, apt.endTime);
    });

    if (conflict) {
      return {
        time: slotTime,
        formatted: slotTime,
        available: false,
        reason: `Horário reservado (${conflict.startTime} - ${conflict.endTime})`
      };
    }

    return {
      time: slotTime,
      formatted: slotTime,
      available: true
    };
  });
}

/**
 * CRITICAL DOUBLE-BOOKING PREVENTION
 * Uses atomic transaction to safely lock and create the appointment.
 */
export async function bookAppointmentAtomically(appointmentData: {
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  date: string;
  startTime: string;
}): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  const endTime = calculateEndTime(appointmentData.startTime, appointmentData.serviceDuration);
  const endMin = timeStringToMinutes(endTime);

  // Validate closing boundary
  if (endMin > CLOSING_TIME_MINUTES) {
    return {
      success: false,
      error: 'O serviço selecionado ultrapassa o horário de encerramento da barbearia (19:30).'
    };
  }

  const dayLockDocId = `lock_${appointmentData.date}`;
  const dayLockRef = doc(db, SLOT_LOCKS_COLLECTION, dayLockDocId);
  const newAppointmentRef = doc(collection(db, APPOINTMENTS_COLLECTION));

  try {
    const result = await runTransaction(db, async (transaction) => {
      const lockDocSnap = await transaction.get(dayLockRef);
      const existingLocks = lockDocSnap.exists() ? (lockDocSnap.data()?.slots || []) : [];

      // Check if any registered locked interval overlaps
      for (const item of existingLocks) {
        if (isOverlapping(appointmentData.startTime, endTime, item.startTime, item.endTime)) {
          throw new Error('SLOT_ALREADY_TAKEN');
        }
      }

      // Prepare new lock item
      const nowIso = new Date().toISOString();
      const updatedLocks = [
        ...existingLocks,
        {
          appointmentId: newAppointmentRef.id,
          startTime: appointmentData.startTime,
          endTime: endTime,
          createdAt: nowIso
        }
      ];

      // Prepare appointment record
      const fullAppointment: Appointment = {
        id: newAppointmentRef.id,
        customerName: appointmentData.customerName.trim(),
        customerPhone: appointmentData.customerPhone.trim(),
        serviceId: appointmentData.serviceId,
        serviceName: appointmentData.serviceName,
        serviceDuration: appointmentData.serviceDuration,
        servicePrice: appointmentData.servicePrice,
        date: appointmentData.date,
        startTime: appointmentData.startTime,
        endTime: endTime,
        status: 'confirmed',
        createdAt: nowIso,
        updatedAt: nowIso
      };

      // Atomic writes
      transaction.set(dayLockRef, { date: appointmentData.date, slots: updatedLocks, updatedAt: nowIso }, { merge: true });
      transaction.set(newAppointmentRef, fullAppointment);

      return fullAppointment;
    });

    return {
      success: true,
      appointmentId: result.id
    };
  } catch (err: any) {
    if (err?.message === 'SLOT_ALREADY_TAKEN') {
      return {
        success: false,
        error: 'Esse horário acabou de ser reservado. Escolha outro horário disponível.'
      };
    }
    console.error('Erro na transação de agendamento:', err);
    return {
      success: false,
      error: 'Não foi possível confirmar o agendamento neste momento. Por favor, tente novamente.'
    };
  }
}

/**
 * Builds the exact WhatsApp appointment text with all customer and booking details
 */
export function buildWhatsAppAppointmentText(appointment: {
  serviceName: string;
  date: string;
  startTime: string;
  servicePrice: number;
  customerName: string;
}): string {
  const dateParts = appointment.date.split('-');
  const formattedDate = dateParts.length === 3 
    ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` 
    : appointment.date;

  const formattedPrice = Number(appointment.servicePrice).toFixed(2).replace('.', ',');

  return `Olá Flayder Willis Barbearia! 👋\n\nAcabei de marcar um horário pelo site.\n\n✂️ Serviço: ${appointment.serviceName}\n📅 Data: ${formattedDate}\n🕐 Horário: ${appointment.startTime}\n💰 Valor: R$ ${formattedPrice}\n\nNome: ${appointment.customerName}\n\nAguardo a confirmação. Obrigado!`;
}

/**
 * Generate formatted WhatsApp link with properly encoded message.
 */
export function generateWhatsAppUrl(appointment: {
  serviceName: string;
  date: string;
  startTime: string;
  servicePrice: number;
  customerName: string;
}): string {
  const message = buildWhatsAppAppointmentText(appointment);
  const encodedText = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE_NUMBER}&text=${encodedText}`;
}
