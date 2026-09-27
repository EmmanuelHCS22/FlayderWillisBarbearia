import {
  collection,
  doc,
  getDocs,
  setDoc,
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
 * The services in Firestore will be the single source of truth.
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
    console.error('Error fetching or seeding services from Firebase:', error);
    // If permission or network error, return local as fallback
    return DEFAULT_SERVICES;
  }
}

/**
 * Subscribes to live services from Firestore
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
    console.error('Error listening to services:', err);
    callback(DEFAULT_SERVICES);
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
    console.error('Error listening to appointments:', err);
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
        reason: 'Ultrapassa o horário de fechamento (19:30)'
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
        reason: `Ocupado (${conflict.startTime} - ${conflict.endTime})`
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
 * Uses atomic Firestore transaction to safely lock and create the appointment.
 * Verifies that neither the exact slot lock exists nor does any appointment on that day
 * overlap with the proposed [startTime, endTime) interval.
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

  // Daily schedule lock doc ID to serialize or check day concurrency
  const dayLockDocId = `lock_${appointmentData.date}`;
  const dayLockRef = doc(db, SLOT_LOCKS_COLLECTION, dayLockDocId);
  const newAppointmentRef = doc(collection(db, APPOINTMENTS_COLLECTION));

  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Read existing appointments for this date inside the transaction context
      // In Firestore transactions, we first read the lock document for this day
      const lockDocSnap = await transaction.get(dayLockRef);
      const existingLocks = lockDocSnap.exists() ? (lockDocSnap.data()?.slots || []) : [];

      // Check if any registered locked interval overlaps
      for (const item of existingLocks) {
        if (isOverlapping(appointmentData.startTime, endTime, item.startTime, item.endTime)) {
          throw new Error('SLOT_ALREADY_TAKEN');
        }
      }

      // 2. Prepare new lock item
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

      // 3. Prepare appointment record
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

      // 4. Atomic writes
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
        error: 'Esse horário acabou de ser reservado. Por favor, escolha outro horário.'
      };
    }
    console.error('Transaction booking error:', err);
    return {
      success: false,
      error: err?.message || 'Erro ao confirmar agendamento no Firestore. Tente novamente.'
    };
  }
}

/**
 * Generate formatted WhatsApp message URL
 */
export function generateWhatsAppUrl(appointment: {
  serviceName: string;
  date: string;
  startTime: string;
  servicePrice: number;
  customerName: string;
}): string {
  // Format date to Brazilian DD/MM/YYYY
  const [year, month, day] = appointment.date.split('-');
  const formattedDate = `${day}/${month}/${year}`;
  const formattedPrice = appointment.servicePrice.toFixed(2).replace('.', ',');

  const message = `Olá Flayder Willis Barbearia! 👋\n\nAcabei de marcar um horário pelo site.\n\n✂️ Serviço: ${appointment.serviceName}\n📅 Data: ${formattedDate}\n🕐 Horário: ${appointment.startTime}\n💰 Valor: R$ ${formattedPrice}\n\nNome: ${appointment.customerName}\n\nAguardo a confirmação. Obrigado!`;

  return `https://wa.link/h86l37?text=${encodeURIComponent(message)}`;
}
