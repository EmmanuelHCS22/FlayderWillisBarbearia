import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { Appointment, AppointmentStatus, Service, CarouselImageItem } from '../types';
import {
  createService,
  updateService,
  toggleServiceStatus,
  deleteService,
  uploadServiceImage,
  uploadCarouselImage,
  addCarouselImageUrl,
  replaceCarouselImage,
  uploadAndReplaceCarouselImage,
  toggleCarouselImageActive,
  deleteCarouselImage,
  updateCarouselOrder,
  cancelAppointmentAndFreeSlot,
  blockSlotAsAdmin,
  loginAdminWithFirebase,
  logoutAdmin,
  getEstablishmentNow,
  timeStringToMinutes
} from '../services/bookingService';
import {
  Lock,
  Scissors,
  Calendar,
  Clock,
  Phone,
  Plus,
  Edit2,
  Check,
  X,
  Eye,
  EyeOff,
  Trash2,
  Image as ImageIcon,
  LayoutDashboard,
  Settings,
  LogOut,
  Upload,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  RefreshCw,
  Ban,
  CheckCircle2,
  GripVertical,
  ExternalLink,
  DollarSign,
  ShieldCheck
} from 'lucide-react';
import { PremiumIcon } from './PremiumIcon';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  carouselImages: CarouselImageItem[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  services,
  carouselImages
}) => {
  // Auth state
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [providerNotEnabled, setProviderNotEnabled] = useState<boolean>(false);

  // Initial administrative credential
  const [loginInput, setLoginInput] = useState('34 9250-4146');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Navigation tab inside Admin Dashboard
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'carousel' | 'appointments' | 'settings'>('dashboard');

  // Appointments data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'confirmed' | 'pending' | 'completed' | 'cancelled'>('all');
  const [periodFilter, setPeriodFilter] = useState<'today' | 'custom_day' | 'this_week' | 'next_week' | 'all'>('today');
  const [customDate, setCustomDate] = useState<string>(() => getEstablishmentNow().dateString);

  // Service form state
  const [isEditingService, setIsEditingService] = useState(false);
  const [serviceFormLoading, setServiceFormLoading] = useState(false);
  const [serviceImageFile, setServiceImageFile] = useState<File | null>(null);
  const [serviceImageUrlInput, setServiceImageUrlInput] = useState('');
  const [serviceForm, setServiceForm] = useState<{
    id?: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    active: boolean;
    iconName: string;
    imageUrl?: string;
  }>({
    name: '',
    description: '',
    price: 40,
    duration: 45,
    active: true,
    iconName: 'scissors',
    imageUrl: ''
  });

  // Carousel form state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageTitleInput, setImageTitleInput] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Replace image state
  const [replaceTargetImage, setReplaceTargetImage] = useState<CarouselImageItem | null>(null);
  const [replaceMode, setReplaceMode] = useState<'upload' | 'url'>('upload');
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replaceUrlInput, setReplaceUrlInput] = useState('');
  const [isReplacingImage, setIsReplacingImage] = useState(false);

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteServiceConfirm, setDeleteServiceConfirm] = useState<Service | null>(null);

  // Drag and drop state for carousel reorder
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Block slot modal state
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockDate, setBlockDate] = useState(new Date().toISOString().split('T')[0]);
  const [blockStartTime, setBlockStartTime] = useState('14:00');
  const [blockEndTime, setBlockEndTime] = useState('15:00');
  const [blockReason, setBlockReason] = useState('Compromisso da Barbearia');


  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Load appointments when authenticated
  useEffect(() => {
    if (!user) return;
    setLoadingAppointments(true);
    const q = query(collection(db, 'appointments'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apts: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        apts.push({ ...docSnap.data(), id: docSnap.id } as Appointment);
      });
      setAppointments(apts);
      setLoadingAppointments(false);
    }, (err) => {
      console.error('Erro ao buscar agendamentos:', err);
      setLoadingAppointments(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Firebase Authentication Login (supports phone "34 9250-4146" and password "Fwillis4146@")
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setProviderNotEnabled(false);
    setAuthLoading(true);

    try {
      await loginAdminWithFirebase(loginInput, passwordInput);
      setAuthSuccess('Autenticado com sucesso no Painel Administrativo.');
      setPasswordInput('');
    } catch (err: any) {
      console.error('Erro no login administrativo:', err);
      if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed')) {
        setProviderNotEnabled(true);
      } else if (err?.code === 'auth/too-many-requests') {
        setAuthError('Muitas tentativas sem sucesso. Aguarde alguns instantes.');
      } else {
        setAuthError('Login ou senha incorretos.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout from Firebase Auth
  const handleLogout = async () => {
    try {
      await logoutAdmin();
      setActiveTab('dashboard');
      setPasswordInput('');
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  // Appointment Status Updates (Confirm, Conclude, Cancel with slot release)
  const handleUpdateAppointmentStatus = async (appointment: Appointment, newStatus: AppointmentStatus) => {
    if (!appointment.id) return;
    try {
      if (newStatus === 'cancelled') {
        await cancelAppointmentAndFreeSlot(appointment);
      } else {
        const aptRef = doc(db, 'appointments', appointment.id);
        await updateDoc(aptRef, {
          status: newStatus,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Falha ao atualizar status:', err);
      alert('Erro ao atualizar status do agendamento.');
    }
  };

  // Open Service Add
  const handleOpenNewService = () => {
    setServiceForm({
      name: '',
      description: '',
      price: 40,
      duration: 45,
      active: true,
      iconName: 'scissors',
      imageUrl: ''
    });
    setServiceImageFile(null);
    setServiceImageUrlInput('');
    setIsEditingService(true);
  };

  // Open Service Edit
  const handleOpenEditService = (service: Service) => {
    setServiceForm({
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      active: service.active !== false,
      iconName: service.iconName || 'scissors',
      imageUrl: service.imageUrl || ''
    });
    setServiceImageFile(null);
    setServiceImageUrlInput(service.imageUrl || '');
    setIsEditingService(true);
  };

  // Save Service
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name.trim()) {
      alert('Informe o nome do serviço.');
      return;
    }

    setServiceFormLoading(true);
    try {
      let finalImageUrl = serviceImageUrlInput.trim() || serviceForm.imageUrl || '';

      // If user uploaded a new image file for service, upload to Firebase Storage
      if (serviceImageFile) {
        finalImageUrl = await uploadServiceImage(serviceImageFile);
      }

      if (serviceForm.id) {
        await updateService(serviceForm.id, {
          name: serviceForm.name.trim(),
          description: serviceForm.description.trim(),
          price: Number(serviceForm.price),
          duration: Number(serviceForm.duration),
          active: serviceForm.active,
          iconName: serviceForm.iconName,
          imageUrl: finalImageUrl
        });
      } else {
        await createService({
          name: serviceForm.name.trim(),
          description: serviceForm.description.trim(),
          price: Number(serviceForm.price),
          duration: Number(serviceForm.duration),
          active: serviceForm.active,
          iconName: serviceForm.iconName,
          imageUrl: finalImageUrl
        });
      }
      setIsEditingService(false);
      setServiceImageFile(null);
      setServiceImageUrlInput('');
    } catch (err) {
      console.error('Erro ao salvar serviço:', err);
      alert('Erro ao salvar serviço no Firestore.');
    } finally {
      setServiceFormLoading(false);
    }
  };

  // Toggle Service active / inactive
  const handleToggleActiveService = async (service: Service) => {
    try {
      await toggleServiceStatus(service.id, !service.active);
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  // Deactivate or Delete service
  const handleConfirmDeactivateOrDeleteService = async (hardDelete: boolean) => {
    if (!deleteServiceConfirm) return;
    try {
      if (hardDelete) {
        await deleteService(deleteServiceConfirm.id);
      } else {
        await toggleServiceStatus(deleteServiceConfirm.id, false);
      }
      setDeleteServiceConfirm(null);
    } catch (err) {
      console.error('Erro ao desativar/remover serviço:', err);
      alert('Não foi possível remover o serviço.');
    }
  };

  // Add Carousel Image
  const handleAddCarouselImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploadingImage(true);
    try {
      if (imageInputMode === 'upload' && uploadFile) {
        await uploadCarouselImage(uploadFile, carouselImages.length, imageTitleInput.trim() || uploadFile.name);
      } else if (imageUrlInput.trim()) {
        await addCarouselImageUrl(imageUrlInput.trim(), carouselImages.length, imageTitleInput.trim());
      }
      setImageModalOpen(false);
      setImageUrlInput('');
      setImageTitleInput('');
      setUploadFile(null);
    } catch (err: any) {
      console.error('Erro ao adicionar imagem:', err);
      alert('Erro ao enviar imagem para o Firebase Storage / Firestore.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Replace Carousel Image (preserves original order)
  const handleReplaceImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceTargetImage) return;

    setIsReplacingImage(true);
    try {
      if (replaceMode === 'upload' && replaceFile) {
        await uploadAndReplaceCarouselImage(replaceTargetImage.id, replaceFile);
      } else if (replaceUrlInput.trim()) {
        await replaceCarouselImage(replaceTargetImage.id, replaceUrlInput.trim());
      }
      setReplaceTargetImage(null);
      setReplaceFile(null);
      setReplaceUrlInput('');
    } catch (err) {
      console.error('Erro ao substituir imagem:', err);
      alert('Erro ao substituir imagem.');
    } finally {
      setIsReplacingImage(false);
    }
  };

  // Move Carousel Image via buttons
  const handleMoveImage = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...carouselImages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    await updateCarouselOrder(newItems);
  };

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetIndex: number) => {
    if (draggedItemIndex === null || draggedItemIndex === targetIndex) return;

    const newItems = [...carouselImages];
    const [movedItem] = newItems.splice(draggedItemIndex, 1);
    newItems.splice(targetIndex, 0, movedItem);

    setDraggedItemIndex(null);
    await updateCarouselOrder(newItems);
  };

  // Confirm delete image
  const handleConfirmDeleteImage = async () => {
    if (!deleteConfirmId) return;
    try {
      const imgToDelete = carouselImages.find(img => img.id === deleteConfirmId);
      await deleteCarouselImage(deleteConfirmId, imgToDelete?.storageRefPath);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Erro ao remover imagem:', err);
      alert('Erro ao remover imagem.');
    }
  };

  // Block Slot
  const handleBlockSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await blockSlotAsAdmin({
        date: blockDate,
        startTime: blockStartTime,
        endTime: blockEndTime,
        reason: blockReason
      });
      setBlockModalOpen(false);
      alert('Horário bloqueado com sucesso na agenda.');
    } catch (err) {
      console.error('Erro ao bloquear horário:', err);
      alert('Erro ao bloquear horário.');
    }
  };

  if (!isOpen) return null;

  const todayStr = getEstablishmentNow().dateString;

  // Nomes dos dias da semana em português para cabeçalhos editoriais
  const WEEKDAY_NAMES_PT = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];

  const parseDateToParts = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return { year: y, month: m, day: d };
  };

  const formatDateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDayHeader = (dateStr: string): string => {
    const { year, month, day } = parseDateToParts(dateStr);
    const dt = new Date(year, month - 1, day, 12, 0, 0);
    const weekday = WEEKDAY_NAMES_PT[dt.getDay()] || 'DIA';
    const formattedDayMonth = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
    return `${weekday} — ${formattedDayMonth}`;
  };

  // Cálculo de intervalo semanal (Segunda a Domingo)
  const getWeekRange = (referenceDateStr: string, weekOffset: number = 0) => {
    const { year, month, day } = parseDateToParts(referenceDateStr);
    const refDate = new Date(year, month - 1, day, 12, 0, 0);
    const dayOfWeek = refDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(refDate);
    monday.setDate(refDate.getDate() + diffToMonday + (weekOffset * 7));

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      startDate: formatDateString(monday),
      endDate: formatDateString(sunday)
    };
  };

  // 1. Filtragem por Período (Hoje, Selecionar dia, Esta semana, Próxima semana, Todos)
  const periodFilteredAppointments = appointments.filter((apt) => {
    if (periodFilter === 'today') {
      return apt.date === todayStr;
    }
    if (periodFilter === 'custom_day') {
      return apt.date === customDate;
    }
    if (periodFilter === 'this_week') {
      const { startDate, endDate } = getWeekRange(todayStr, 0);
      return apt.date >= startDate && apt.date <= endDate;
    }
    if (periodFilter === 'next_week') {
      const { startDate, endDate } = getWeekRange(todayStr, 1);
      return apt.date >= startDate && apt.date <= endDate;
    }
    return true; // 'all'
  });

  // 2. Filtragem por Status dentro do período selecionado
  const statusFilteredAppointments = periodFilteredAppointments.filter((apt) => {
    if (appointmentFilter === 'all') return true;
    return apt.status === appointmentFilter;
  });

  // 3. Organização estrita e automática: 1. Data, 2. Horário crescente (08:00 antes de 09:30, nunca 17:00 antes de 09:00)
  const sortedAppointments = [...statusFilteredAppointments].sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime);
  });

  // 4. Agrupamento por dia para visualização estruturada (semanal, diária, etc.)
  const groupedByDate: { date: string; header: string; items: Appointment[] }[] = [];
  const dateMap = new Map<string, Appointment[]>();

  for (const apt of sortedAppointments) {
    if (!dateMap.has(apt.date)) {
      dateMap.set(apt.date, []);
    }
    dateMap.get(apt.date)!.push(apt);
  }

  dateMap.forEach((items, date) => {
    groupedByDate.push({
      date,
      header: formatDayHeader(date),
      items // já ordenados por horário crescente
    });
  });

  // Agendamentos futuros para a visualização na aba Dashboard
  const upcomingAppointments = [...appointments]
    .filter((a) => a.date >= todayStr)
    .sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      if (d !== 0) return d;
      return timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime);
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-[#0A0A0A] border-2 border-[#D4AF37]/50 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.95),0_0_30px_rgba(212,175,55,0.2)] overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-4 py-3.5 border-b border-[#D4AF37]/30 flex items-center justify-between bg-black/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1c1808] to-[#2d240d] border border-[#F1D77A]/60 flex items-center justify-center text-[#F1D77A] shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-white text-base leading-tight tracking-wider uppercase">
                PAINEL ADMIN
              </h3>
              <p className="text-[10px] text-[#F1D77A] font-medium tracking-wide">
                Flayder Willis Barbearia • Gestão Integrada
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar painel"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* VIEW 1: LOGIN (When user is not authenticated) */}
        {!user ? (
          <div className="p-6 sm:p-10 overflow-y-auto max-w-md mx-auto w-full my-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center mx-auto mb-3 text-[#F1D77A] shadow-[0_0_25px_rgba(212,175,55,0.25)]">
                <Lock size={30} />
              </div>
              <h4 className="font-serif font-bold text-xl text-white uppercase tracking-wider">
                Acesso Administrativo
              </h4>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Área restrita para o proprietário gerenciar serviços, carrossel e agendamentos com autenticação segura.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {authSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>{authSuccess}</span>
                </div>
              )}

              {providerNotEnabled && (
                <div className="p-4 rounded-2xl bg-[#1A1406] border border-[#D4AF37]/60 text-left space-y-3 shadow-lg">
                  <div className="flex items-center gap-2 text-[#F1D77A] font-bold text-xs uppercase tracking-wider">
                    <AlertCircle size={17} className="text-[#D4AF37] shrink-0" />
                    <span>Configuração do Provedor no Firebase</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    O provedor <strong>Email/Password</strong> precisa ser ativado no Firebase Console para que o administrador realize o login com segurança:
                  </p>
                  <div className="bg-black/60 p-3 rounded-xl border border-white/10 text-[11px] text-zinc-300 space-y-1.5">
                    <p className="font-semibold text-[#F1D77A]">Como ativar no Firebase Console:</p>
                    <p>1. Acesse o <strong>Firebase Console</strong> do seu projeto</p>
                    <p>2. Vá em <strong>Authentication</strong> → aba <strong>Sign-in method</strong></p>
                    <p>3. Clique no provedor <strong>Email/Password</strong> e ative (Enabled)</p>
                    <p>4. Clique em Salvar e tente entrar novamente com <strong>34 9250-4146</strong> e <strong>Fwillis4146@</strong>.</p>
                  </div>
                  <a
                    href="https://console.firebase.google.com/project/gen-lang-client-0356741920/authentication/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 py-2 px-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F1D77A] text-black text-xs font-bold uppercase tracking-wider hover:brightness-105 transition-all shadow-md cursor-pointer"
                  >
                    <span>Abrir Configuração no Firebase Console</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}

              {authError && !providerNotEnabled && (
                <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Login Administrativo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="34 9250-4146"
                    className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F1D77A] transition-colors"
                    required
                  />
                  <span className="absolute right-3 top-3 text-[11px] text-[#F1D77A] font-semibold bg-[#D4AF37]/10 px-2 py-0.5 rounded">
                    Telefone
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Identificação: Telefone (34 9250-4146)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Digite sua senha de administrador"
                    className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F1D77A] transition-colors pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-white cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F1D77A] to-[#B38728] text-black font-serif font-bold uppercase text-xs tracking-widest shadow-[0_4px_20px_rgba(212,175,55,0.4)] hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer mt-3 disabled:opacity-50"
              >
                {authLoading ? 'Autenticando...' : 'ENTRAR NO PAINEL'}
              </button>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-zinc-500">
                  Protegido via Firebase Authentication (Zero-Trust)
                </span>
              </div>
            </form>
          </div>
        ) : (
          /* VIEW 2: AUTHENTICATED ADMIN PANEL */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Nav Menu: DASHBOARD | SERVIÇOS | CARROSSEL | AGENDAMENTOS | CONFIGURAÇÕES | SAIR */}
            <div className="flex border-b border-white/10 bg-black/60 overflow-x-auto text-xs font-bold uppercase tracking-wider scrollbar-none shrink-0">
              <button
                onClick={() => { setActiveTab('dashboard'); setIsEditingService(false); }}
                className={`px-4 py-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'border-[#D4AF37] text-[#F1D77A] bg-[#D4AF37]/10'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LayoutDashboard size={15} />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => { setActiveTab('services'); setIsEditingService(false); }}
                className={`px-4 py-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'services'
                    ? 'border-[#D4AF37] text-[#F1D77A] bg-[#D4AF37]/10'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Scissors size={15} />
                <span>Serviços ({services.length})</span>
              </button>

              <button
                onClick={() => { setActiveTab('carousel'); setIsEditingService(false); }}
                className={`px-4 py-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'carousel'
                    ? 'border-[#D4AF37] text-[#F1D77A] bg-[#D4AF37]/10'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ImageIcon size={15} />
                <span>Carrossel ({carouselImages.length})</span>
              </button>

              <button
                onClick={() => { setActiveTab('appointments'); setIsEditingService(false); }}
                className={`px-4 py-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'appointments'
                    ? 'border-[#D4AF37] text-[#F1D77A] bg-[#D4AF37]/10'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Calendar size={15} />
                <span>Agendamentos ({appointments.length})</span>
              </button>

              <button
                onClick={() => { setActiveTab('settings'); setIsEditingService(false); }}
                className={`px-4 py-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'border-[#D4AF37] text-[#F1D77A] bg-[#D4AF37]/10'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Settings size={15} />
                <span>Configurações</span>
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-3.5 ml-auto flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-950/20 whitespace-nowrap transition-colors cursor-pointer"
                title="Sair do painel administrativo"
              >
                <LogOut size={15} />
                <span>Sair</span>
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#050505]">

              {/* 1. TAB: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-5">
                  {/* Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-2xl bg-black/90 border border-[#D4AF37]/35 shadow-md">
                      <span className="text-[11px] uppercase text-zinc-400 font-semibold block">Total de Agendamentos</span>
                      <span className="text-2xl font-bold font-serif text-[#F1D77A] mt-1.5 block">{appointments.length}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/90 border border-[#D4AF37]/35 shadow-md">
                      <span className="text-[11px] uppercase text-zinc-400 font-semibold block">Confirmados</span>
                      <span className="text-2xl font-bold font-serif text-emerald-400 mt-1.5 block">
                        {appointments.filter(a => a.status === 'confirmed').length}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/90 border border-[#D4AF37]/35 shadow-md">
                      <span className="text-[11px] uppercase text-zinc-400 font-semibold block">Serviços Ativos</span>
                      <span className="text-2xl font-bold font-serif text-white mt-1.5 block">
                        {services.filter(s => s.active !== false).length}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/90 border border-[#D4AF37]/35 shadow-md">
                      <span className="text-[11px] uppercase text-zinc-400 font-semibold block">Fotos no Carrossel</span>
                      <span className="text-2xl font-bold font-serif text-white mt-1.5 block">
                        {carouselImages.filter(img => img.active !== false).length}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Shortcuts */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => { setActiveTab('services'); handleOpenNewService(); }}
                      className="p-4 rounded-2xl bg-gradient-to-r from-[#181406] to-[#0A0A0A] border border-[#D4AF37]/40 hover:border-[#D4AF37] text-left transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div>
                        <span className="block text-xs font-bold text-white uppercase tracking-wider group-hover:text-[#F1D77A] transition-colors">
                          + Adicionar Serviço
                        </span>
                        <span className="text-[11px] text-zinc-400">Criar novo corte, barba ou química</span>
                      </div>
                      <Plus size={18} className="text-[#F1D77A] group-hover:scale-110 transition-transform" />
                    </button>

                    <button
                      onClick={() => { setActiveTab('carousel'); setImageModalOpen(true); }}
                      className="p-4 rounded-2xl bg-gradient-to-r from-[#181406] to-[#0A0A0A] border border-[#D4AF37]/40 hover:border-[#D4AF37] text-left transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div>
                        <span className="block text-xs font-bold text-white uppercase tracking-wider group-hover:text-[#F1D77A] transition-colors">
                          + Adicionar Imagem
                        </span>
                        <span className="text-[11px] text-zinc-400">Upload de fotos do celular/PC</span>
                      </div>
                      <Upload size={18} className="text-[#F1D77A] group-hover:scale-110 transition-transform" />
                    </button>

                    <button
                      onClick={() => setBlockModalOpen(true)}
                      className="p-4 rounded-2xl bg-gradient-to-r from-[#181406] to-[#0A0A0A] border border-[#D4AF37]/40 hover:border-[#D4AF37] text-left transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div>
                        <span className="block text-xs font-bold text-white uppercase tracking-wider group-hover:text-red-400 transition-colors">
                          Bloquear Horário
                        </span>
                        <span className="text-[11px] text-zinc-400">Pausar horários de expediente</span>
                      </div>
                      <Ban size={18} className="text-red-400 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>

                  {/* Recent Appointments Preview */}
                  <div className="bg-black/90 border border-[#D4AF37]/30 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#F1D77A]">
                        Próximos Agendamentos
                      </h4>
                      <button
                        onClick={() => setActiveTab('appointments')}
                        className="text-xs text-zinc-400 hover:text-white uppercase tracking-wider underline cursor-pointer"
                      >
                        Ver Todos
                      </button>
                    </div>

                    {appointments.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-4 text-center">Nenhum agendamento cadastrado no momento.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {(upcomingAppointments.length > 0 ? upcomingAppointments : sortedAppointments).slice(0, 5).map((apt) => (
                          <div
                            key={apt.id}
                            className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <span className="font-bold text-white block">{apt.customerName}</span>
                              <span className="text-[11px] text-[#F1D77A]">
                                {apt.serviceName} • {apt.date.split('-').reverse().join('/')} às {apt.startTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-zinc-300">
                                R$ {Number(apt.servicePrice).toFixed(2).replace('.', ',')}
                              </span>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                apt.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                apt.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                apt.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              }`}>
                                {apt.status === 'confirmed' ? 'Confirmado' : apt.status === 'completed' ? 'Concluído' : apt.status === 'cancelled' ? '🔴 CANCELADO' : 'Pendente'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. TAB: SERVIÇOS (Manage Services) */}
              {activeTab === 'services' && (
                <div>
                  {!isEditingService ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-serif font-bold uppercase tracking-wider text-white">
                            Catálogo de Serviços da Barbearia
                          </h4>
                          <p className="text-xs text-zinc-400">
                            Adicione novos serviços, altere nomes, preços, durações e imagens.
                          </p>
                        </div>
                        <button
                          onClick={handleOpenNewService}
                          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F1D77A] text-black font-serif font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:brightness-105 active:scale-95 shadow-md cursor-pointer"
                        >
                          <Plus size={16} />
                          <span>+ ADICIONAR SERVIÇO</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {services.map((service) => (
                          <div
                            key={service.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              service.active !== false
                                ? 'bg-black/90 border-[#D4AF37]/35 shadow-md'
                                : 'bg-zinc-950/60 border-zinc-800 opacity-60'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                {service.imageUrl ? (
                                  <img
                                    src={service.imageUrl}
                                    alt={service.name}
                                    className="w-12 h-12 rounded-xl object-cover border border-[#D4AF37]/40 shrink-0 bg-zinc-900"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center shrink-0">
                                    <PremiumIcon name={(service.iconName as any) || 'scissors'} size={24} />
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-bold text-sm text-white">{service.name}</h5>
                                    <span
                                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                        service.active !== false
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                          : 'bg-zinc-800 text-zinc-400'
                                      }`}
                                    >
                                      {service.active !== false ? 'Ativo' : 'Desativado'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{service.description}</p>
                                  <div className="flex items-center gap-4 mt-2.5 text-xs">
                                    <span className="text-[#F1D77A] font-bold text-sm">
                                      R$ {service.price.toFixed(2).replace('.', ',')}
                                    </span>
                                    <span className="text-zinc-400 flex items-center gap-1">
                                      <Clock size={12} className="text-[#D4AF37]" />
                                      <span>{service.duration} minutos</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleOpenEditService(service)}
                                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-[#F1D77A] border border-white/5 transition-colors cursor-pointer"
                                  title="Editar Serviço"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  onClick={() => handleToggleActiveService(service)}
                                  className={`p-2 rounded-xl border border-white/5 transition-colors cursor-pointer ${
                                    service.active !== false
                                      ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                  }`}
                                  title={service.active !== false ? 'Desativar Serviço' : 'Ativar Serviço'}
                                >
                                  {service.active !== false ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                                <button
                                  onClick={() => setDeleteServiceConfirm(service)}
                                  className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-white/5 transition-colors cursor-pointer"
                                  title="Remover / Desativar Serviço"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Service Add/Edit Form */
                    <form onSubmit={handleSaveService} className="space-y-4 max-w-xl mx-auto bg-black border border-[#D4AF37]/40 p-6 rounded-2xl shadow-xl">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <h4 className="font-serif font-bold text-base text-white uppercase tracking-wider">
                          {serviceForm.id ? 'EDITAR SERVIÇO' : 'ADICIONAR SERVIÇO'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsEditingService(false)}
                          className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome do Serviço</label>
                        <input
                          type="text"
                          value={serviceForm.name}
                          onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                          placeholder="Ex: Corte Degradê Navalhado"
                          className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#F1D77A]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">Descrição</label>
                        <textarea
                          rows={2}
                          value={serviceForm.description}
                          onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                          placeholder="Detalhes sobre o procedimento e acabamento"
                          className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-4 py-2 text-white text-sm focus:border-[#F1D77A]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">Preço (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={serviceForm.price}
                            onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#F1D77A]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">Duração (minutos)</label>
                          <input
                            type="number"
                            step="5"
                            value={serviceForm.duration}
                            onChange={(e) => setServiceForm({ ...serviceForm, duration: parseInt(e.target.value, 10) || 15 })}
                            className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#F1D77A]"
                            required
                          />
                        </div>
                      </div>

                      {/* Image of the service */}
                      <div className="space-y-2 pt-1 border-t border-white/5">
                        <label className="block text-xs font-semibold text-zinc-300">
                          Imagem do Serviço (Opcional - Upload ou Link)
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setServiceImageFile(e.target.files?.[0] || null)}
                            className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#D4AF37] file:text-black cursor-pointer"
                          />
                        </div>
                        <input
                          type="url"
                          placeholder="Ou insira a URL da imagem (https://...)"
                          value={serviceImageUrlInput}
                          onChange={(e) => setServiceImageUrlInput(e.target.value)}
                          className="w-full bg-[#121212] border border-white/10 rounded-xl px-3 py-2 text-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">Ícone Temático</label>
                        <select
                          value={serviceForm.iconName}
                          onChange={(e) => setServiceForm({ ...serviceForm, iconName: e.target.value })}
                          className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3 py-2.5 text-white text-sm focus:border-[#F1D77A]"
                        >
                          <option value="scissors">Tesoura (Corte)</option>
                          <option value="beard">Barba (Navalha)</option>
                          <option value="combo">Combo (Coroa / Corte+Barba)</option>
                          <option value="hair">Cabelo (Selagem)</option>
                          <option value="straight">Alisamento</option>
                          <option value="platinum">Platinado</option>
                          <option value="eyebrow">Sobrancelha</option>
                          <option value="dye">Pintura</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2.5 pt-2">
                        <input
                          type="checkbox"
                          id="activeCheckbox"
                          checked={serviceForm.active}
                          onChange={(e) => setServiceForm({ ...serviceForm, active: e.target.checked })}
                          className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                        />
                        <label htmlFor="activeCheckbox" className="text-xs text-zinc-300 cursor-pointer">
                          Serviço Ativo (visível no biosite público para agendamento)
                        </label>
                      </div>

                      <div className="pt-3 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setIsEditingService(false)}
                          className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-bold text-zinc-400 hover:text-white cursor-pointer uppercase tracking-wider"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={serviceFormLoading}
                          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F1D77A] text-black text-xs font-serif font-bold uppercase tracking-widest shadow-md hover:brightness-105 cursor-pointer disabled:opacity-50"
                        >
                          {serviceFormLoading ? 'Salvando...' : 'SALVAR SERVIÇO'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* 3. TAB: CARROSSEL (Manage Carousel) */}
              {activeTab === 'carousel' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-serif font-bold uppercase tracking-wider text-white">
                        GERENCIAR CARROSSEL
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Arraste para reordenar, adicione novas fotos via upload ou substitua imagens.
                      </p>
                    </div>
                    <button
                      onClick={() => setImageModalOpen(true)}
                      className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F1D77A] text-black font-serif font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:brightness-105 shadow-md cursor-pointer"
                    >
                      <Plus size={16} />
                      <span>+ ADICIONAR IMAGEM</span>
                    </button>
                  </div>

                  {/* Carousel Items list with Drag & Drop */}
                  <div className="space-y-2.5">
                    {carouselImages.map((img, idx) => (
                      <div
                        key={img.id}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(idx)}
                        className={`p-3 rounded-2xl border flex items-center gap-3 transition-all cursor-move select-none ${
                          draggedItemIndex === idx ? 'opacity-40 border-[#F1D77A] scale-[0.99]' : ''
                        } ${
                          img.active !== false ? 'bg-black/90 border-[#D4AF37]/35 shadow-sm' : 'bg-zinc-950/60 border-zinc-800 opacity-50'
                        }`}
                      >
                        {/* Drag Handle */}
                        <div className="text-zinc-500 hover:text-[#F1D77A] cursor-grab">
                          <GripVertical size={16} />
                        </div>

                        {/* Order position badge */}
                        <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-[#F1D77A] shrink-0">
                          {idx + 1}
                        </div>

                        {/* Thumbnail */}
                        <img
                          src={img.url}
                          alt={img.title || `Foto ${idx + 1}`}
                          className="w-16 h-16 object-cover rounded-xl border border-white/10 shrink-0 bg-zinc-900"
                        />

                        {/* Title / Info */}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-white block truncate">
                            {img.title || `Imagem ${idx + 1}`}
                          </span>
                          <span className="text-[10px] text-zinc-500 block truncate mt-0.5">{img.url}</span>
                          <span className={`inline-block mt-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            img.active !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {img.active !== false ? 'ATIVA' : 'INATIVA'}
                          </span>
                        </div>

                        {/* Controls: Up, Down, Replace, Toggle, Delete */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveImage(idx, 'up')}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 text-zinc-300 cursor-pointer"
                            title="Mover para cima"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            disabled={idx === carouselImages.length - 1}
                            onClick={() => handleMoveImage(idx, 'down')}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 text-zinc-300 cursor-pointer"
                            title="Mover para baixo"
                          >
                            <ArrowDown size={14} />
                          </button>

                          {/* Substituir imagem */}
                          <button
                            onClick={() => {
                              setReplaceTargetImage(img);
                              setReplaceFile(null);
                              setReplaceUrlInput('');
                            }}
                            className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 text-[11px] font-bold cursor-pointer"
                            title="Substituir Imagem Mantendo a Posição"
                          >
                            SUBSTITUIR
                          </button>

                          {/* Toggle Active / Inactive */}
                          <button
                            onClick={() => toggleCarouselImageActive(img.id, !img.active)}
                            className={`p-2 rounded-lg transition-colors cursor-pointer ${
                              img.active !== false
                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                            title={img.active !== false ? 'Desativar Imagem' : 'Ativar Imagem'}
                          >
                            {img.active !== false ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteConfirmId(img.id)}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer"
                            title="Remover Imagem"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Image Modal */}
                  {imageModalOpen && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85">
                      <div className="bg-[#0F0F0F] border border-[#D4AF37]/50 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                          <h4 className="font-serif font-bold text-sm text-white uppercase tracking-wider">
                            + ADICIONAR IMAGEM AO CARROSSEL
                          </h4>
                          <button onClick={() => setImageModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                            <X size={16} />
                          </button>
                        </div>

                        <div className="flex border-b border-white/10 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => setImageInputMode('upload')}
                            className={`flex-1 py-2 cursor-pointer ${imageInputMode === 'upload' ? 'text-[#F1D77A] border-b-2 border-[#D4AF37]' : 'text-zinc-400'}`}
                          >
                            Upload do Celular / PC
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageInputMode('url')}
                            className={`flex-1 py-2 cursor-pointer ${imageInputMode === 'url' ? 'text-[#F1D77A] border-b-2 border-[#D4AF37]' : 'text-zinc-400'}`}
                          >
                            Via Link / URL
                          </button>
                        </div>

                        <form onSubmit={handleAddCarouselImage} className="space-y-3.5">
                          {imageInputMode === 'upload' ? (
                            <div>
                              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                                Selecione o arquivo de imagem
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                className="w-full bg-black border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#D4AF37] file:text-black cursor-pointer"
                                required
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                                URL da Imagem
                              </label>
                              <input
                                type="url"
                                placeholder="https://i.imgur.com/..."
                                value={imageUrlInput}
                                onChange={(e) => setImageUrlInput(e.target.value)}
                                className="w-full bg-black border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-xs"
                                required
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-semibold text-zinc-300 mb-1">
                              Legenda / Título (opcional)
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Corte Degradê Alinhado"
                              value={imageTitleInput}
                              onChange={(e) => setImageTitleInput(e.target.value)}
                              className="w-full bg-black border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-xs"
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setImageModalOpen(false)}
                              className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs text-zinc-400 hover:text-white cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={isUploadingImage}
                              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F1D77A] text-black font-bold uppercase text-xs tracking-wider cursor-pointer"
                            >
                              {isUploadingImage ? 'Enviando...' : 'Adicionar ao Carrossel'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Replace Image Modal */}
                  {replaceTargetImage && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85">
                      <div className="bg-[#0F0F0F] border border-[#D4AF37]/50 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                          <h4 className="font-serif font-bold text-sm text-white uppercase tracking-wider">
                            SUBSTITUIR IMAGEM (Posição {replaceTargetImage.order + 1})
                          </h4>
                          <button onClick={() => setReplaceTargetImage(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                            <X size={16} />
                          </button>
                        </div>

                        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10">
                          <img
                            src={replaceTargetImage.url}
                            alt="Atual"
                            className="w-14 h-14 object-cover rounded-lg border border-white/10"
                          />
                          <div className="text-xs text-zinc-300">
                            <span className="text-zinc-500 block">Imagem atual na posição:</span>
                            <span className="font-semibold">{replaceTargetImage.title || `Posição ${replaceTargetImage.order + 1}`}</span>
                          </div>
                        </div>

                        <div className="flex border-b border-white/10 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => setReplaceMode('upload')}
                            className={`flex-1 py-2 cursor-pointer ${replaceMode === 'upload' ? 'text-[#F1D77A] border-b-2 border-[#D4AF37]' : 'text-zinc-400'}`}
                          >
                            Upload do Celular / PC
                          </button>
                          <button
                            type="button"
                            onClick={() => setReplaceMode('url')}
                            className={`flex-1 py-2 cursor-pointer ${replaceMode === 'url' ? 'text-[#F1D77A] border-b-2 border-[#D4AF37]' : 'text-zinc-400'}`}
                          >
                            Via Link / URL
                          </button>
                        </div>

                        <form onSubmit={handleReplaceImageSubmit} className="space-y-3.5">
                          {replaceMode === 'upload' ? (
                            <div>
                              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                                Selecione a nova imagem
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                                className="w-full bg-black border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#D4AF37] file:text-black cursor-pointer"
                                required
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                                Nova URL da Imagem
                              </label>
                              <input
                                type="url"
                                placeholder="https://..."
                                value={replaceUrlInput}
                                onChange={(e) => setReplaceUrlInput(e.target.value)}
                                className="w-full bg-black border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-xs"
                                required
                              />
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setReplaceTargetImage(null)}
                              className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs text-zinc-400 hover:text-white cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={isReplacingImage}
                              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F1D77A] text-black font-bold uppercase text-xs tracking-wider cursor-pointer"
                            >
                              {isReplacingImage ? 'Substituindo...' : 'Substituir Imagem'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Remove Image Confirmation Modal */}
                  {deleteConfirmId && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85">
                      <div className="bg-[#121212] border border-red-500/50 rounded-2xl p-6 w-full max-w-sm text-center space-y-4 shadow-2xl">
                        <AlertCircle size={36} className="mx-auto text-red-400" />
                        <div>
                          <h4 className="text-base font-bold text-white uppercase tracking-wider">
                            Remover Imagem
                          </h4>
                          <p className="text-xs text-zinc-400 mt-2">
                            Tem certeza que deseja remover esta imagem?
                          </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs text-zinc-300 hover:bg-white/5 cursor-pointer uppercase font-bold"
                          >
                            CANCELAR
                          </button>
                          <button
                            onClick={handleConfirmDeleteImage}
                            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs uppercase hover:bg-red-700 cursor-pointer shadow-md"
                          >
                            REMOVER
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. TAB: AGENDAMENTOS (Appointments Management) */}
              {activeTab === 'appointments' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-serif font-bold uppercase tracking-wider text-white">
                        AGENDAMENTOS DA BARBEARIA
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Consulte clientes, múltiplos serviços, confirme, conclua ou libere horários.
                      </p>
                    </div>
                    <button
                      onClick={() => setBlockModalOpen(true)}
                      className="py-2.5 px-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-red-500/30 cursor-pointer"
                    >
                      <Ban size={15} />
                      <span>BLOQUEAR HORÁRIO</span>
                    </button>
                  </div>

                  {/* 1. Period Selector Filter Bar (Mobile-friendly horizontal scroll) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar size={13} className="text-[#D4AF37]" />
                        <span>Filtrar Período:</span>
                      </span>
                      {periodFilter === 'this_week' && (
                        <span className="text-[10px] text-[#F1D77A] font-medium tracking-wide">
                          Semana Atual (Seg a Dom)
                        </span>
                      )}
                      {periodFilter === 'next_week' && (
                        <span className="text-[10px] text-[#F1D77A] font-medium tracking-wide">
                          Próxima Semana
                        </span>
                      )}
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setPeriodFilter('today')}
                        className={`py-2 px-3.5 rounded-xl whitespace-nowrap cursor-pointer transition-colors ${
                          periodFilter === 'today'
                            ? 'bg-[#D4AF37] text-black font-bold shadow-sm'
                            : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
                        }`}
                      >
                        Hoje
                      </button>
                      <button
                        type="button"
                        onClick={() => setPeriodFilter('custom_day')}
                        className={`py-2 px-3.5 rounded-xl whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
                          periodFilter === 'custom_day'
                            ? 'bg-[#D4AF37] text-black font-bold shadow-sm'
                            : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
                        }`}
                      >
                        <Calendar size={13} />
                        <span>Selecionar dia</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPeriodFilter('this_week')}
                        className={`py-2 px-3.5 rounded-xl whitespace-nowrap cursor-pointer transition-colors ${
                          periodFilter === 'this_week'
                            ? 'bg-[#D4AF37] text-black font-bold shadow-sm'
                            : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
                        }`}
                      >
                        Esta semana
                      </button>
                      <button
                        type="button"
                        onClick={() => setPeriodFilter('next_week')}
                        className={`py-2 px-3.5 rounded-xl whitespace-nowrap cursor-pointer transition-colors ${
                          periodFilter === 'next_week'
                            ? 'bg-[#D4AF37] text-black font-bold shadow-sm'
                            : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
                        }`}
                      >
                        Próxima semana
                      </button>
                      <button
                        type="button"
                        onClick={() => setPeriodFilter('all')}
                        className={`py-2 px-3.5 rounded-xl whitespace-nowrap cursor-pointer transition-colors ${
                          periodFilter === 'all'
                            ? 'bg-[#D4AF37] text-black font-bold shadow-sm'
                            : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
                        }`}
                      >
                        Todos ({appointments.length})
                      </button>
                    </div>

                    {/* Date picker modal/card when 'custom_day' is selected */}
                    {periodFilter === 'custom_day' && (
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-black/60 border border-[#D4AF37]/35 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <Calendar size={15} className="text-[#F1D77A] shrink-0" />
                          <span className="text-xs text-zinc-300 font-medium">Data específica:</span>
                          <input
                            type="date"
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
                            className="bg-[#141418] border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] [color-scheme:dark] cursor-pointer"
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-[#F1D77A]">
                          {formatDayHeader(customDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 2. Status Filter Pills */}
                  <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setAppointmentFilter('all')}
                      className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors whitespace-nowrap ${
                        appointmentFilter === 'all' ? 'bg-[#D4AF37] text-black font-bold' : 'bg-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Todos ({periodFilteredAppointments.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppointmentFilter('confirmed')}
                      className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors whitespace-nowrap ${
                        appointmentFilter === 'confirmed' ? 'bg-emerald-500 text-black font-bold' : 'bg-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Confirmados ({periodFilteredAppointments.filter(a => a.status === 'confirmed').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppointmentFilter('completed')}
                      className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors whitespace-nowrap ${
                        appointmentFilter === 'completed' ? 'bg-blue-500 text-white font-bold' : 'bg-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Concluídos ({periodFilteredAppointments.filter(a => a.status === 'completed').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppointmentFilter('cancelled')}
                      className={`px-3 py-1.5 rounded-full cursor-pointer transition-colors whitespace-nowrap ${
                        appointmentFilter === 'cancelled' ? 'bg-red-500 text-white font-bold' : 'bg-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Cancelados ({periodFilteredAppointments.filter(a => a.status === 'cancelled').length})
                    </button>
                  </div>

                  {/* 3. Appointment Groups by Day & Time */}
                  {loadingAppointments ? (
                    <div className="text-center py-12 text-zinc-500 text-xs">Carregando agendamentos...</div>
                  ) : sortedAppointments.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400 text-xs bg-black/60 rounded-2xl border border-zinc-800 p-6 space-y-2">
                      <Calendar size={28} className="mx-auto text-zinc-600 mb-1" />
                      <p className="font-semibold text-zinc-300">Nenhum agendamento encontrado para este período.</p>
                      <p className="text-[11px] text-zinc-500">
                        {periodFilter === 'today'
                          ? 'Não há agendamentos cadastrados para a data de hoje.'
                          : periodFilter === 'custom_day'
                          ? `Nenhum horário marcado em ${formatDayHeader(customDate)}.`
                          : periodFilter === 'this_week'
                          ? 'Não há agendamentos cadastrados para esta semana.'
                          : periodFilter === 'next_week'
                          ? 'Não há agendamentos cadastrados para a próxima semana.'
                          : 'Tente selecionar outro período ou filtro de status acima.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {groupedByDate.map((group) => (
                        <div key={group.date} className="space-y-3">
                          {/* Day Header (Exemplo do Prompt: SEGUNDA — 28/09) */}
                          <div className="flex items-center justify-between border-b border-[#D4AF37]/35 pb-2 pt-1 bg-white/[0.02] px-2 rounded-t-lg">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                              <h5 className="font-serif font-bold text-xs uppercase tracking-wider text-[#F1D77A]">
                                {group.header}
                              </h5>
                              {group.date === todayStr && (
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#F1D77A] border border-[#D4AF37]/40">
                                  Hoje
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-400 font-mono">
                              {group.items.length} {group.items.length === 1 ? 'cliente' : 'clientes'}
                            </span>
                          </div>

                          {/* Lista do dia ordenada estritamente do horário mais cedo para o mais tarde */}
                          <div className="space-y-3">
                            {group.items.map((apt) => {
                              const cleanPhone = apt.customerPhone.replace(/\D/g, '');
                              const waUrl = cleanPhone.length >= 10
                                ? `https://api.whatsapp.com/send?phone=55${cleanPhone}`
                                : null;

                              const servicesListDisplay = apt.services && apt.services.length > 0
                                ? apt.services.map(s => s.name).join(' + ')
                                : apt.serviceName;

                              return (
                                <div
                                  key={apt.id}
                                  className="p-4 rounded-2xl bg-black border border-[#D4AF37]/30 space-y-3 text-xs shadow-md"
                                >
                                  <div className="flex flex-wrap justify-between items-start gap-2">
                                    <div>
                                      <div className="font-bold text-sm text-white flex items-center gap-2">
                                        <span className="text-[#F1D77A] font-mono text-sm font-semibold">
                                          {apt.startTime}
                                        </span>
                                        <span className="text-zinc-500">—</span>
                                        <span>{apt.customerName}</span>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-zinc-400 flex items-center gap-1">
                                          <Phone size={12} className="text-[#D4AF37]" />
                                          <span>{apt.customerPhone}</span>
                                        </span>
                                        {waUrl && (
                                          <a
                                            href={waUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#25D366] hover:underline ml-1"
                                          >
                                            <span>WhatsApp</span>
                                            <ExternalLink size={10} />
                                          </a>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${
                                          apt.status === 'confirmed'
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : apt.status === 'completed'
                                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                            : apt.status === 'cancelled'
                                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                        }`}
                                      >
                                        {apt.status === 'confirmed' ? 'Confirmado' : apt.status === 'completed' ? 'Concluído' : apt.status === 'cancelled' ? '🔴 CANCELADO' : 'Pendente'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Details Grid */}
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white/5 p-3 rounded-xl text-[11px] border border-white/5">
                                    <div>
                                      <span className="text-zinc-500 block uppercase text-[10px]">Serviços Selecionados:</span>
                                      <strong className="text-[#F1D77A] text-xs font-semibold">{servicesListDisplay}</strong>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 block uppercase text-[10px]">Data & Horário:</span>
                                      <strong className="text-white text-xs">
                                        {apt.date.split('-').reverse().join('/')} às {apt.startTime}
                                      </strong>
                                      <span className="text-zinc-400 block text-[10px] mt-0.5">
                                        Término previsto: {apt.endTime}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 block uppercase text-[10px]">Duração & Valor Total:</span>
                                      <span className="text-white font-semibold">{apt.serviceDuration} minutos</span>
                                      <span className="text-[#F1D77A] font-bold block text-xs mt-0.5">
                                        Total: R$ {Number(apt.servicePrice).toFixed(2).replace('.', ',')}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Status Actions */}
                                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                                    {apt.status !== 'confirmed' && apt.status !== 'completed' && (
                                      <button
                                        onClick={() => handleUpdateAppointmentStatus(apt, 'confirmed')}
                                        className="flex-1 min-w-[90px] py-1.5 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 cursor-pointer uppercase"
                                      >
                                        CONFIRMAR
                                      </button>
                                    )}
                                    {apt.status !== 'completed' && (
                                      <button
                                        onClick={() => handleUpdateAppointmentStatus(apt, 'completed')}
                                        className="flex-1 min-w-[90px] py-1.5 px-3 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs font-bold hover:bg-blue-500/30 cursor-pointer uppercase"
                                      >
                                        CONCLUIR
                                      </button>
                                    )}
                                    {apt.status !== 'cancelled' && (
                                      <button
                                        onClick={() => handleUpdateAppointmentStatus(apt, 'cancelled')}
                                        className="flex-1 min-w-[120px] py-1.5 px-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold hover:bg-red-500/30 cursor-pointer uppercase"
                                      >
                                        CANCELAR & LIBERAR
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: CONFIGURAÇÕES */}
              {activeTab === 'settings' && (
                <div className="space-y-5 max-w-xl mx-auto">
                  {/* Sessão Administrativa */}
                  <div className="bg-black/90 border border-white/10 rounded-2xl p-5 space-y-3">
                    <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-zinc-400">
                      Sessão Administrativa
                    </h4>
                    <div className="text-xs text-zinc-300 space-y-1">
                      <div>E-mail técnico: <strong className="text-white font-mono">{user.email}</strong></div>
                      <div>UID: <span className="text-zinc-500 font-mono text-[11px]">{user.uid}</span></div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full mt-2 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-xs uppercase hover:bg-red-500/30 transition-colors cursor-pointer"
                    >
                      SAIR DO PAINEL ADMIN
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Service Deactivation / Logical Removal */}
        {deleteServiceConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85">
            <div className="bg-[#121212] border border-[#D4AF37]/50 rounded-2xl p-6 w-full max-w-md text-center space-y-4 shadow-2xl">
              <AlertCircle size={36} className="mx-auto text-yellow-400" />
              <div>
                <h4 className="text-base font-bold text-white uppercase tracking-wider">
                  Remover / Desativar Serviço
                </h4>
                <p className="text-xs text-zinc-300 mt-2">
                  Deseja desativar o serviço <strong className="text-[#F1D77A]">{deleteServiceConfirm.name}</strong>?
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Ao desativar logicamente, ele deixará de aparecer no biosite para novos clientes, preservando os agendamentos já realizados.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleConfirmDeactivateOrDeleteService(false)}
                  className="w-full py-2.5 rounded-xl bg-[#D4AF37] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#F1D77A] cursor-pointer"
                >
                  DESATIVAR SERVIÇO (Recomendado)
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteServiceConfirm(null)}
                    className="flex-1 py-2 rounded-xl border border-white/10 text-xs text-zinc-400 hover:text-white cursor-pointer"
                  >
                    CANCELAR
                  </button>
                  <button
                    onClick={() => handleConfirmDeactivateOrDeleteService(true)}
                    className="flex-1 py-2 rounded-xl bg-red-950/80 border border-red-500/50 text-red-400 font-bold text-xs uppercase hover:bg-red-900 cursor-pointer"
                  >
                    EXCLUIR DEFINITIVO
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Bloquear Horário */}
        {blockModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85">
            <div className="bg-[#101010] border border-[#D4AF37]/50 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                <h4 className="font-serif font-bold text-sm text-white uppercase tracking-wider">
                  BLOQUEAR HORÁRIO NA AGENDA
                </h4>
                <button onClick={() => setBlockModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleBlockSlot} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Data</label>
                  <input
                    type="date"
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    className="w-full bg-black border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-xs [color-scheme:dark]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Horário Início</label>
                    <input
                      type="time"
                      value={blockStartTime}
                      onChange={(e) => setBlockStartTime(e.target.value)}
                      className="w-full bg-black border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-xs [color-scheme:dark]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Horário Fim</label>
                    <input
                      type="time"
                      value={blockEndTime}
                      onChange={(e) => setBlockEndTime(e.target.value)}
                      className="w-full bg-black border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-xs [color-scheme:dark]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Motivo do Bloqueio</label>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Ex: Almoço / Manutenção / Compromisso Pessoal"
                    className="w-full bg-black border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-xs"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBlockModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold uppercase text-xs hover:bg-red-700 cursor-pointer shadow-md"
                  >
                    Bloquear Horário
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
