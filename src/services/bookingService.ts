import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  runTransaction,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Service, Appointment } from '../types';
import { DEFAULT_SERVICES, CLOSING_TIME_MINUTES } from '../constants';

const SERVICES_COLLECTION = 'services';
const APPOINTMENTS_COLLECTION = 'appointments';
const SLOT_LOCKS_COLLECTION = 'slot_locks';

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

  // Overlap occurs if A starts before B ends AND A ends after B starts
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
      // Exclude cancelled appointments
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
 * Generate formatted WhatsApp message URL
 * Utiliza EXCLUSIVAMENTE o link https://wa.link/h86l37
 */
export function generateWhatsAppUrl(appointment: {
  serviceName: string;
  date: string;
  startTime: string;
  servicePrice: number;
  customerName: string;
}): string {
  const [year, month, day] = appointment.date.split('-');
  const formattedDate = `${day}/${month}/${year}`;
  const formattedPrice = appointment.servicePrice.toFixed(2).replace('.', ',');

  const message = `Olá Flayder Willis Barbearia! 👋\n\nAcabei de marcar um horário pelo site.\n\n✂️ Serviço: ${appointment.serviceName}\n📅 Data: ${formattedDate}\n🕐 Horário: ${appointment.startTime}\n💰 Valor: R$ ${formattedPrice}\n\nNome: ${appointment.customerName}\n\nAguardo a confirmação. Obrigado!`;

  return `https://wa.link/h86l37?text=${encodeURIComponent(message)}`;
}
