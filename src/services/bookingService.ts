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
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { db, storage, auth } from '../lib/firebase';
import { Service, Appointment, AppointmentStatus, CarouselImageItem, AdminConfig } from '../types';
import { DEFAULT_SERVICES, DEFAULT_CAROUSEL_IMAGES, CLOSING_TIME_MINUTES, WHATSAPP_PHONE_NUMBER } from '../constants';

const SERVICES_COLLECTION = 'services';
const APPOINTMENTS_COLLECTION = 'appointments';
const SLOT_LOCKS_COLLECTION = 'slot_locks';
const CAROUSEL_COLLECTION = 'carousel';
const ADMIN_CONFIG_COLLECTION = 'admin_config';
const ADMINS_COLLECTION = 'admins';

/**
 * Normalizes an administrative login input (e.g. "34 9250-4146" or "3492504146")
 * into the internal Firebase Authentication email identity.
 * Converte "34 9250-4146" -> "3492504146@flayderwillisbarbearia.admin"
 */
export function normalizeAdminIdentifier(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }

  // Remove espaços, pontos, traços, parênteses e caracteres não numéricos
  const digits = trimmed.replace(/\D/g, '');
  if (digits) {
    return `${digits}@flayderwillisbarbearia.admin`;
  }

  return `${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '')}@flayderwillisbarbearia.admin`;
}

/**
 * Authenticates the admin strictly with Firebase Authentication (Email/Password).
 * Responsável pela validação segura da senha sem armazenar senhas no Firestore.
 */
export async function loginAdminWithFirebase(
  identifier: string,
  secretPassword: string
): Promise<FirebaseUser> {
  const cleanDigits = identifier.replace(/\D/g, '');
  const authEmail = normalizeAdminIdentifier(identifier);

  if (!authEmail) {
    throw new Error('Login ou senha incorretos.');
  }

  try {
    // 1. Tentar autenticação direta via signInWithEmailAndPassword
    const userCredential = await signInWithEmailAndPassword(auth, authEmail, secretPassword);
    const user = userCredential.user;

    // 2. Sincronizar documento administrativo seguro no Firestore (admins/{uid})
    await syncAdminProfile(user.uid, cleanDigits || '3492504146');

    return user;
  } catch (err: any) {
    // Se o usuário ainda não foi criado no Firebase Auth (primeira configuração)
    if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
      try {
        const newCredential = await createUserWithEmailAndPassword(auth, authEmail, secretPassword);
        const newUser = newCredential.user;

        await syncAdminProfile(newUser.uid, cleanDigits || '3492504146');
        return newUser;
      } catch (createErr: any) {
        if (createErr?.code === 'auth/operation-not-allowed') {
          throw createErr;
        }
        if (createErr?.code === 'auth/email-already-in-use') {
          throw new Error('Login ou senha incorretos.');
        }
        throw createErr;
      }
    }

    if (err?.code === 'auth/operation-not-allowed') {
      throw err;
    }

    if (
      err?.code === 'auth/wrong-password' ||
      err?.code === 'auth/invalid-credential' ||
      err?.code === 'auth/user-not-found'
    ) {
      throw new Error('Login ou senha incorretos.');
    }

    throw err;
  }
}

/**
 * Sincroniza o registro do administrador no Firestore (admins/{uid})
 * Registra apenas dados de autorização: uid, role, login, active, createdAt.
 * NUNCA salva senha, password ou criptografia manual de senha.
 */
async function syncAdminProfile(uid: string, login: string): Promise<void> {
  try {
    const adminDocRef = doc(db, ADMINS_COLLECTION, uid);
    const snap = await getDoc(adminDocRef);
    if (!snap.exists()) {
      await setDoc(adminDocRef, {
        uid,
        role: 'admin',
        login,
        active: true,
        createdAt: new Date().toISOString()
      });
    } else {
      await updateDoc(adminDocRef, {
        active: true,
        lastLogin: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn('Registro de permissão admin salvo no Firestore:', err);
  }
}

/**
 * Logout administrator from Firebase Auth
 */
export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

/**
 * Check if Admin is already configured in Firebase
 */
export async function getAdminConfigStatus(): Promise<{ isConfigured: boolean; identifier?: string }> {
  try {
    const configDocRef = doc(db, ADMIN_CONFIG_COLLECTION, 'main');
    const docSnap = await getDoc(configDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as AdminConfig;
      return { isConfigured: !!data.configured, identifier: data.adminIdentifier };
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
export async function setAdminConfigured(adminIdentifier: string): Promise<void> {
  const configDocRef = doc(db, ADMIN_CONFIG_COLLECTION, 'main');
  await setDoc(configDocRef, {
    configured: true,
    adminIdentifier,
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
 * Upload Service Image to Firebase Storage
 */
export async function uploadServiceImage(file: File): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileRef = ref(storage, `services/${timestamp}_${safeName}`);
  const snapshot = await uploadBytes(fileRef, file);
  return await getDownloadURL(snapshot.ref);
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

/**
 * Logical deactivation or reactivation of a service
 */
export async function toggleServiceStatus(serviceId: string, active: boolean): Promise<void> {
  const docRef = doc(db, SERVICES_COLLECTION, serviceId);
  await updateDoc(docRef, {
    active,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Permanent removal of a service (if requested)
 */
export async function deleteService(serviceId: string): Promise<void> {
  const docRef = doc(db, SERVICES_COLLECTION, serviceId);
  await deleteDoc(docRef);
}

/**
 * CAROUSEL MANAGEMENT (Firestore + Firebase Storage)
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
export async function uploadCarouselImage(file: File, currentCount: number, title?: string): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `carousel/${timestamp}_${safeName}`;
  const storageRef = ref(storage, storagePath);
  
  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);

  const newDocRef = doc(collection(db, CAROUSEL_COLLECTION));
  const newImage: CarouselImageItem = {
    id: newDocRef.id,
    url: downloadUrl,
    order: currentCount,
    active: true,
    title: title || file.name,
    storageRefPath: storagePath,
    createdAt: new Date().toISOString()
  };
  await setDoc(newDocRef, newImage);
  return newDocRef.id;
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
    title: title || `Foto ${currentCount + 1}`,
    createdAt: new Date().toISOString()
  };
  await setDoc(newDocRef, newImage);
  return newDocRef.id;
}

/**
 * Replace an image in the carousel with a new URL or file, PRESERVING its exact position/order.
 */
export async function replaceCarouselImage(
  id: string,
  newUrl: string,
  title?: string,
  newStoragePath?: string
): Promise<void> {
  const docRef = doc(db, CAROUSEL_COLLECTION, id);
  const updates: Partial<CarouselImageItem> = {
    url: newUrl.trim(),
    updatedAt: new Date().toISOString()
  };
  if (title) updates.title = title;
  if (newStoragePath) updates.storageRefPath = newStoragePath;
  await updateDoc(docRef, updates);
}

/**
 * Upload file and replace existing image in carousel
 */
export async function uploadAndReplaceCarouselImage(
  id: string,
  file: File,
  title?: string
): Promise<void> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `carousel/${timestamp}_${safeName}`;
  const storageRef = ref(storage, storagePath);
  
  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);

  await replaceCarouselImage(id, downloadUrl, title || file.name, storagePath);
}

/**
 * Toggle active state of a carousel image
 */
export async function toggleCarouselImageActive(id: string, active: boolean): Promise<void> {
  const docRef = doc(db, CAROUSEL_COLLECTION, id);
  await updateDoc(docRef, { active, updatedAt: new Date().toISOString() });
}

/**
 * Delete image from carousel collection and Storage
 */
export async function deleteCarouselImage(id: string, storageRefPath?: string): Promise<void> {
  const docRef = doc(db, CAROUSEL_COLLECTION, id);
  await deleteDoc(docRef);

  if (storageRefPath) {
    try {
      const storageRef = ref(storage, storageRefPath);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn('Could not delete file from Firebase Storage:', err);
    }
  }
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

  await updateDoc(aptRef, {
    status: 'cancelled',
    cancelledAt: serverTimestamp(),
    updatedAt: nowIso
  });

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
 * Time utility functions & Establishment Timezone (Uberlândia - MG, Brasil)
 */
export const ESTABLISHMENT_TIMEZONE = 'America/Sao_Paulo';

/**
 * Returns current date and time in the establishment's timezone.
 */
export function getEstablishmentNow(): {
  dateString: string; // YYYY-MM-DD
  currentMinutes: number; // total minutes since midnight (0..1439)
  hours: number;
  minutes: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ...
} {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: ESTABLISHMENT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    });

    const parts = formatter.formatToParts(now);
    let year = '';
    let month = '';
    let day = '';
    let hour = 0;
    let minute = 0;

    for (const p of parts) {
      if (p.type === 'year') year = p.value;
      if (p.type === 'month') month = p.value;
      if (p.type === 'day') day = p.value;
      if (p.type === 'hour') hour = parseInt(p.value, 10);
      if (p.type === 'minute') minute = parseInt(p.value, 10);
    }

    const dateString = `${year}-${month}-${day}`;
    const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: ESTABLISHMENT_TIMEZONE,
      weekday: 'short'
    });
    const weekdayStr = weekdayFormatter.format(now);
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dayOfWeek = dayMap[weekdayStr] ?? now.getDay();

    return {
      dateString,
      currentMinutes: hour * 60 + minute,
      hours: hour,
      minutes: minute,
      dayOfWeek
    };
  } catch (err) {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = now.getHours();
    const min = now.getMinutes();
    return {
      dateString: `${y}-${m}-${d}`,
      currentMinutes: h * 60 + min,
      hours: h,
      minutes: min,
      dayOfWeek: now.getDay()
    };
  }
}

export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startMin = timeStringToMinutes(startTime);
  const endMin = startMin + durationMinutes;
  return minutesToTimeString(endMin);
}

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
 * considering all existing active appointments on that date from Firestore
 * and dynamically blocking past slots when scheduling for the current date.
 */
export function computeSlotAvailability(
  baseSlots: string[],
  activeAppointments: Appointment[],
  serviceDuration: number,
  selectedDate?: string,
  currentTimeMinutes?: number,
  establishmentDateString?: string,
  selectedBarberId?: string | null
) {
  const nowEst = getEstablishmentNow();
  const effectiveCurrentMin = currentTimeMinutes !== undefined ? currentTimeMinutes : nowEst.currentMinutes;
  const effectiveTodayDate = establishmentDateString || nowEst.dateString;

  const isToday = selectedDate === effectiveTodayDate;
  const isPastDate = !!selectedDate && selectedDate < effectiveTodayDate;

  return baseSlots.map(slotTime => {
    const slotStartMin = timeStringToMinutes(slotTime);
    const slotEndMin = slotStartMin + serviceDuration;
    const slotEndTime = minutesToTimeString(slotEndMin);

    // Rule 0: Cannot book in past dates
    if (isPastDate) {
      return {
        time: slotTime,
        formatted: slotTime,
        available: false,
        reason: 'Esta data já passou'
      };
    }

    // Rule 1: Cannot select a slot that has already passed today (Establishment time)
    if (isToday && slotStartMin < effectiveCurrentMin) {
      return {
        time: slotTime,
        formatted: slotTime,
        available: false,
        reason: 'Horário já passou'
      };
    }

    // Rule 2: Continuous duration cannot exceed closing time (19:30)
    if (slotEndMin > CLOSING_TIME_MINUTES) {
      return {
        time: slotTime,
        formatted: slotTime,
        available: false,
        reason: 'Ultrapassa o horário de encerramento (19:30)'
      };
    }

    // Rule 3: Continuous availability check against non-cancelled appointments in Firestore
    // If a specific barber is selected, check conflicts for that barber (or unassigned appointments)
    const conflict = activeAppointments.find(apt => {
      if (selectedBarberId && selectedBarberId !== 'any') {
        const matchesBarber = apt.barberId === selectedBarberId || !apt.barberId || apt.barberId === 'any';
        if (!matchesBarber) return false;
      }
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
 * Atomic transaction to safely lock and create the appointment.
 */
export async function bookAppointmentAtomically(appointmentData: {
  customerName: string;
  customerPhone: string;
  serviceId?: string;
  serviceName: string;
  services?: Array<{ id: string; name: string; price: number; duration: number }>;
  serviceDuration: number;
  servicePrice: number;
  barberId?: string;
  barberName?: string;
  date: string;
  startTime: string;
}): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  // Validation: cannot book on Sunday
  const [y, m, d] = appointmentData.date.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  if (targetDate.getDay() === 0) {
    return {
      success: false,
      error: 'A barbearia está fechada aos domingos. Por favor, escolha de segunda a sábado.'
    };
  }

  // Validation: cannot book past dates or past time slots on today
  const nowEst = getEstablishmentNow();
  if (appointmentData.date < nowEst.dateString) {
    return {
      success: false,
      error: 'Não é possível agendar para uma data anterior à data atual.'
    };
  }
  if (appointmentData.date === nowEst.dateString) {
    const slotStartMin = timeStringToMinutes(appointmentData.startTime);
    if (slotStartMin < nowEst.currentMinutes) {
      return {
        success: false,
        error: 'Este horário já passou. Por favor, escolha um horário futuro disponível.'
      };
    }
  }

  const endTime = calculateEndTime(appointmentData.startTime, appointmentData.serviceDuration);
  const endMin = timeStringToMinutes(endTime);

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

      for (const item of existingLocks) {
        // Check barber match if specified
        const sameBarber =
          !appointmentData.barberId ||
          appointmentData.barberId === 'any' ||
          !item.barberId ||
          item.barberId === 'any' ||
          item.barberId === appointmentData.barberId;

        if (sameBarber && isOverlapping(appointmentData.startTime, endTime, item.startTime, item.endTime)) {
          throw new Error('SLOT_ALREADY_TAKEN');
        }
      }

      const nowIso = new Date().toISOString();
      const updatedLocks = [
        ...existingLocks,
        {
          appointmentId: newAppointmentRef.id,
          barberId: appointmentData.barberId || 'any',
          startTime: appointmentData.startTime,
          endTime: endTime,
          createdAt: nowIso
        }
      ];

      const fullAppointment: Appointment = {
        id: newAppointmentRef.id,
        customerName: appointmentData.customerName.trim(),
        customerPhone: appointmentData.customerPhone.trim(),
        serviceId: appointmentData.serviceId || '',
        serviceName: appointmentData.serviceName,
        services: appointmentData.services,
        serviceDuration: appointmentData.serviceDuration,
        servicePrice: appointmentData.servicePrice,
        barberId: appointmentData.barberId || 'any',
        barberName: appointmentData.barberName || 'Sem preferência',
        date: appointmentData.date,
        startTime: appointmentData.startTime,
        endTime: endTime,
        status: 'confirmed',
        createdAt: nowIso,
        updatedAt: nowIso
      };

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
 * Format total duration nicely (e.g. 105 min -> "1h 45min", 45 min -> "45 min")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/**
 * Format date string YYYY-MM-DD to DD/MM/AAAA
 */
export function formatDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Builds the exact WhatsApp appointment text with all customer and booking details
 */
export function buildWhatsAppAppointmentText(appointment: {
  customerName: string;
  customerPhone: string;
  serviceName: string;
  services?: Array<{ id: string; name: string; price: number; duration: number }>;
  serviceDuration: number;
  servicePrice: number;
  barberName?: string;
  date: string;
  startTime: string;
}): string {
  const formattedDate = formatDate(appointment.date);
  const formattedDuration = formatDuration(appointment.serviceDuration);
  const formattedPrice = Number(appointment.servicePrice).toFixed(2).replace('.', ',');

  let servicesBlock = '';
  if (appointment.services && appointment.services.length > 0) {
    servicesBlock = appointment.services
      .map(s => `• ${s.name} — R$ ${Number(s.price).toFixed(2).replace('.', ',')}`)
      .join('\n');
  } else {
    servicesBlock = `• ${appointment.serviceName} — R$ ${formattedPrice}`;
  }

  const barberText = appointment.barberName && appointment.barberName !== 'Sem preferência'
    ? `\n\n💈 Profissional: ${appointment.barberName}`
    : '';

  return `Olá Flayder Willis Barbearia! 👋\n\nAcabei de agendar um horário pelo site.\n\n👤 Nome: ${appointment.customerName}\n\n📱 Telefone: ${appointment.customerPhone}${barberText}\n\n✂️ Serviço(s):\n${servicesBlock}\n\n📅 Data: ${formattedDate}\n\n🕐 Horário: ${appointment.startTime}\n\n⏱️ Duração estimada: ${formattedDuration}\n\n💰 Valor total: R$ ${formattedPrice}\n\nAguardo a confirmação. Obrigado!`;
}

/**
 * Generate formatted WhatsApp link with properly encoded message to Flayder Willis Barbearia.
 */
export function generateWhatsAppUrl(appointment: {
  customerName: string;
  customerPhone: string;
  serviceName: string;
  services?: Array<{ id: string; name: string; price: number; duration: number }>;
  serviceDuration: number;
  servicePrice: number;
  barberName?: string;
  date: string;
  startTime: string;
}): string {
  const message = buildWhatsAppAppointmentText(appointment);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodedText}`;
}

