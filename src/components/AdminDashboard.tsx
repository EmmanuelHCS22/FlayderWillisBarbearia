import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { Appointment, AppointmentStatus, Service, CarouselImageItem } from '../types';
import {
  createService,
  updateService,
  toggleServiceStatus,
  uploadCarouselImage,
  addCarouselImageUrl,
  toggleCarouselImageActive,
  deleteCarouselImage,
  updateCarouselOrder,
  cancelAppointmentAndFreeSlot,
  blockSlotAsAdmin,
  getAdminConfigStatus,
  setAdminConfigured
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
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Ban
} from 'lucide-react';

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
  const [isFirstSetup, setIsFirstSetup] = useState<boolean>(false);
  const [checkingSetup, setCheckingSetup] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Forms for Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Navigation tab inside Admin Dashboard
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'carousel' | 'appointments' | 'settings'>('dashboard');

  // Appointments data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Service form state
  const [isEditingService, setIsEditingService] = useState(false);
  const [serviceForm, setServiceForm] = useState<{
    id?: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    active: boolean;
    iconName: string;
  }>({
    name: '',
    description: '',
    price: 40,
    duration: 45,
    active: true,
    iconName: 'scissors'
  });

  // Carousel form state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('url');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageTitleInput, setImageTitleInput] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  // Check if first-time setup is needed
  useEffect(() => {
    if (!isOpen) return;
    setCheckingSetup(true);
    getAdminConfigStatus().then((status) => {
      // If no admin configuration exists in Firestore and no authenticated user, prompt for first setup
      setIsFirstSetup(!status.isConfigured && !auth.currentUser);
      setCheckingSetup(false);
    });
  }, [isOpen]);

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

  // First-time Admin Account Creation with Firebase Authentication
  const handleFirstTimeSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (password.length < 6) {
      setAuthError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('As senhas não coincidem.');
      return;
    }

    setAuthLoading(true);
    try {
      // Create user exclusively in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      // Mark admin configured in Firebase
      await setAdminConfigured(userCredential.user.email || email.trim());
      setIsFirstSetup(false);
      setAuthSuccess('Conta administrativa criada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao criar conta administrativa:', err);
      if (err.code === 'auth/email-already-in-use') {
        setAuthError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/invalid-email') {
        setAuthError('E-mail inválido.');
      } else {
        setAuthError('Erro ao registrar administrador no Firebase Authentication: ' + (err.message || ''));
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Regular Firebase Authentication Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      console.error('Erro no login:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setAuthError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/too-many-requests') {
        setAuthError('Muitas tentativas sem sucesso. Aguarde um momento.');
      } else {
        setAuthError('Falha na autenticação: ' + (err.message || ''));
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Password Reset with Firebase Authentication
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!email.trim()) {
      setAuthError('Informe seu e-mail para receber as instruções de recuperação.');
      return;
    }

    setAuthLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setAuthSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      setShowForgotPassword(false);
    } catch (err: any) {
      console.error('Erro ao enviar recuperação:', err);
      setAuthError('Não foi possível enviar o e-mail de recuperação: ' + (err.message || ''));
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  // Appointment Status Updates (Confirm, Conclude, Cancel with slot release)
  const handleUpdateAppointmentStatus = async (appointment: Appointment, newStatus: AppointmentStatus) => {
    if (!appointment.id) return;
    try {
      if (newStatus === 'cancelled') {
        // Free slot lock and mark cancelled
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
      alert('Erro ao atualizar agendamento.');
    }
  };

  // Service Management Handlers
  const handleOpenNewService = () => {
    setServiceForm({
      name: '',
      description: '',
      price: 40,
      duration: 45,
      active: true,
      iconName: 'scissors'
    });
    setIsEditingService(true);
  };

  const handleOpenEditService = (service: Service) => {
    setServiceForm({
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      active: service.active !== false,
      iconName: service.iconName || 'scissors'
    });
    setIsEditingService(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name.trim()) {
      alert('Nome do serviço é obrigatório.');
      return;
    }

    try {
      if (serviceForm.id) {
        await updateService(serviceForm.id, {
          name: serviceForm.name.trim(),
          description: serviceForm.description.trim(),
          price: Number(serviceForm.price),
          duration: Number(serviceForm.duration),
          active: serviceForm.active,
          iconName: serviceForm.iconName
        });
      } else {
        await createService({
          name: serviceForm.name.trim(),
          description: serviceForm.description.trim(),
          price: Number(serviceForm.price),
          duration: Number(serviceForm.duration),
          active: serviceForm.active,
          iconName: serviceForm.iconName
        });
      }
      setIsEditingService(false);
    } catch (err) {
      console.error('Erro ao salvar serviço:', err);
      alert('Erro ao salvar serviço.');
    }
  };

  const handleToggleActiveService = async (service: Service) => {
    try {
      await toggleServiceStatus(service.id, !service.active);
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  // Carousel Management Handlers
  const handleAddCarouselImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploadingImage(true);
    try {
      if (imageInputMode === 'upload' && uploadFile) {
        await uploadCarouselImage(uploadFile, carouselImages.length);
      } else if (imageUrlInput.trim()) {
        await addCarouselImageUrl(imageUrlInput.trim(), carouselImages.length, imageTitleInput.trim());
      }
      setImageModalOpen(false);
      setImageUrlInput('');
      setImageTitleInput('');
      setUploadFile(null);
    } catch (err: any) {
      console.error('Erro ao adicionar imagem:', err);
      alert('Erro ao adicionar imagem ao carrossel.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleMoveImage = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...carouselImages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    await updateCarouselOrder(newItems);
  };

  const handleConfirmDeleteImage = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteCarouselImage(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Erro ao remover imagem:', err);
      alert('Erro ao remover imagem.');
    }
  };

  // Block Slot Handler
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-[#0A0A0A] border-2 border-[#D4AF37]/50 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#D4AF37]/30 flex items-center justify-between bg-black/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#F1D77A]">
              <Lock size={16} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-white text-base leading-tight">Painel Administrativo</h3>
              <p className="text-[10px] text-[#F1D77A]">Flayder Willis Barbearia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Loading setup state */}
        {checkingSetup ? (
          <div className="p-10 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-[#D4AF37]" />
            <span>Verificando autenticação...</span>
          </div>
        ) : !user ? (
          /* AUTHENTICATION VIEWS: FIRST SETUP OR LOGIN */
          <div className="p-6 sm:p-8 overflow-y-auto max-w-md mx-auto w-full">
            {isFirstSetup ? (
              /* 1. FIRST-TIME SETUP: Define custom email and password */
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center mx-auto mb-3 text-[#F1D77A]">
                    <ShieldCheck size={26} />
                  </div>
                  <h4 className="font-serif font-bold text-lg text-white uppercase tracking-wider">
                    Configurar Acesso Administrativo
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1.5">
                    Defina seu e-mail e senha pessoais para a administração exclusiva da barbearia.
                  </p>
                </div>

                <form onSubmit={handleFirstTimeSetup} className="space-y-4">
                  {authError && (
                    <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
                      <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-400" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Seu E-mail Administrativo</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemplo@barbearia.com"
                      className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#F1D77A]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Criar Senha</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#F1D77A]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Confirmar Senha</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a mesma senha"
                      className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#F1D77A]"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F1D77A] text-black font-bold uppercase text-xs tracking-wider shadow-[0_4px_15px_rgba(212,175,55,0.3)] hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer mt-2"
                  >
                    {authLoading ? 'Criando Conta...' : 'CRIAR CONTA ADMINISTRATIVA'}
                  </button>
                </form>
              </div>
            ) : showForgotPassword ? (
              /* 2. FORGOT PASSWORD VIEW */
              <div>
                <div className="text-center mb-6">
                  <h4 className="font-serif font-bold text-lg text-white uppercase tracking-wider">
                    Recuperar Senha
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Informe seu e-mail para receber o link de redefinição de senha.
                  </p>
                </div>

                <form onSubmit={handlePasswordReset} className="space-y-4">
                  {authError && (
                    <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
                      {authError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu-email@exemplo.com"
                      className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#F1D77A]"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="flex-1 py-3 rounded-xl border border-white/10 text-xs text-zinc-400 hover:text-white"
                    >
                      Voltar ao Login
                    </button>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="flex-1 py-3 rounded-xl bg-[#D4AF37] text-black font-bold uppercase text-xs tracking-wider hover:bg-[#F1D77A]"
                    >
                      {authLoading ? 'Enviando...' : 'Enviar Link'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* 3. REGULAR LOGIN VIEW */
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center mx-auto mb-3 text-[#F1D77A]">
                    <Lock size={22} />
                  </div>
                  <h4 className="font-serif font-bold text-lg text-white uppercase tracking-wider">
                    Área Administrativa
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Entre com suas credenciais de administrador.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {authSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs">
                      {authSuccess}
                    </div>
                  )}
                  {authError && (
                    <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
                      {authError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@barbearia.com"
                      className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#F1D77A]"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs text-zinc-400">Senha</label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-[11px] text-[#F1D77A] hover:underline"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-[#F1D77A]"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F1D77A] text-black font-bold uppercase text-xs tracking-wider shadow-[0_4px_15px_rgba(212,175,55,0.3)] hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer mt-2"
                  >
                    {authLoading ? 'Autenticando...' : 'ENTRAR'}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* AUTHENTICATED ADMIN PANEL */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Nav Tabs: Dashboard | Serviços | Carrossel | Agendamentos | Configurações | Sair */}
            <div className="flex border-b border-white/10 bg-black/40 overflow-x-auto text-xs font-bold uppercase tracking-wider scrollbar-none">
              <button
                onClick={() => { setActiveTab('dashboard'); setIsEditingService(false); }}
                className={`px-4 py-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'border-[#D4AF37] text-[#F1D77A] bg-[#D4AF37]/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LayoutDashboard size={14} />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => { setActiveTab('services'); setIsEditingService(false); }}
                className={`px-4 py-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'services'
                    ? 'border-[#D4AF37] text-[#F1D77A] bg-[#D4AF37]/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Scissors size={14} />
                <span>Serviços ({services.length})</span>
              </button>

              <button
                onClick={() => { setActiveTab('carousel'); setIsEditingService(false); }}
                className={`px-4 py-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'carousel'
                    ? 'border-[#D4AF37] text-[#F1D77A] bg-[#D4AF37]/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ImageIcon size={14} />
                <span>Carrossel ({carouselImages.length})</span>
              </button>

              <button
                onClick={() => { setActiveTab('appointments'); setIsEditingService(false); }}
                className={`px-4 py-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'appointments'
                    ? 'border-[#D4AF37] text-[#F1D77A] bg-[#D4AF37]/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Calendar size={14} />
                <span>Agendamentos ({appointments.length})</span>
              </button>

              <button
                onClick={() => { setActiveTab('settings'); setIsEditingService(false); }}
                className={`px-4 py-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'border-[#D4AF37] text-[#F1D77A] bg-[#D4AF37]/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Settings size={14} />
                <span>Configurações</span>
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-3 ml-auto flex items-center gap-1.5 text-red-400 hover:text-red-300 whitespace-nowrap transition-colors cursor-pointer"
                title="Sair do painel"
              >
                <LogOut size={14} />
                <span>Sair</span>
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 1. DASHBOARD OVERVIEW */}
              {activeTab === 'dashboard' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-black border border-[#D4AF37]/30">
                      <span className="text-[10px] uppercase text-zinc-400 font-semibold block">Total Agendamentos</span>
                      <span className="text-xl font-bold font-serif text-[#F1D77A] mt-1 block">{appointments.length}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-black border border-[#D4AF37]/30">
                      <span className="text-[10px] uppercase text-zinc-400 font-semibold block">Confirmados</span>
                      <span className="text-xl font-bold font-serif text-emerald-400 mt-1 block">
                        {appointments.filter(a => a.status === 'confirmed').length}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-black border border-[#D4AF37]/30">
                      <span className="text-[10px] uppercase text-zinc-400 font-semibold block">Serviços Ativos</span>
                      <span className="text-xl font-bold font-serif text-white mt-1 block">
                        {services.filter(s => s.active !== false).length}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-black border border-[#D4AF37]/30">
                      <span className="text-[10px] uppercase text-zinc-400 font-semibold block">Fotos Carrossel</span>
                      <span className="text-xl font-bold font-serif text-white mt-1 block">
                        {carouselImages.filter(img => img.active !== false).length}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <button
                      onClick={() => { setActiveTab('services'); handleOpenNewService(); }}
                      className="p-3 rounded-xl bg-gradient-to-r from-[#181406] to-[#0A0A0A] border border-[#D4AF37]/30 hover:border-[#D4AF37] text-left transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <span className="block text-xs font-bold text-white">+ Adicionar Serviço</span>
                        <span className="text-[10px] text-zinc-400">Criar novo corte ou química</span>
                      </div>
                      <Plus size={16} className="text-[#F1D77A]" />
                    </button>

                    <button
                      onClick={() => { setActiveTab('carousel'); setImageModalOpen(true); }}
                      className="p-3 rounded-xl bg-gradient-to-r from-[#181406] to-[#0A0A0A] border border-[#D4AF37]/30 hover:border-[#D4AF37] text-left transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <span className="block text-xs font-bold text-white">+ Adicionar Foto</span>
                        <span className="text-[10px] text-zinc-400">Upload para o Carrossel</span>
                      </div>
                      <Upload size={16} className="text-[#F1D77A]" />
                    </button>

                    <button
                      onClick={() => setBlockModalOpen(true)}
                      className="p-3 rounded-xl bg-gradient-to-r from-[#181406] to-[#0A0A0A] border border-[#D4AF37]/30 hover:border-[#D4AF37] text-left transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <span className="block text-xs font-bold text-white">Bloquear Horário</span>
                        <span className="text-[10px] text-zinc-400">Pausar horários na agenda</span>
                      </div>
                      <Ban size={16} className="text-red-400" />
                    </button>
                  </div>

                  {/* Recent Appointments */}
                  <div className="bg-black border border-[#D4AF37]/20 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3">
                      Próximos Agendamentos
                    </h4>
                    {appointments.slice(0, 5).map((apt) => (
                      <div key={apt.id} className="py-2.5 border-b border-white/5 flex items-center justify-between text-xs last:border-none">
                        <div>
                          <span className="font-semibold text-white block">{apt.customerName}</span>
                          <span className="text-[11px] text-[#F1D77A]">{apt.serviceName} • {apt.date.split('-').reverse().join('/')} às {apt.startTime}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          apt.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {apt.status === 'confirmed' ? 'Confirmado' : apt.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. SERVICES MANAGEMENT */}
              {activeTab === 'services' && (
                <div>
                  {!isEditingService ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Catálogo de Serviços</h4>
                          <p className="text-[10px] text-zinc-400">Edite nomes, preços, durações e disponibilidades</p>
                        </div>
                        <button
                          onClick={handleOpenNewService}
                          className="py-1.5 px-3 rounded-lg bg-[#D4AF37] text-black font-bold text-xs uppercase flex items-center gap-1.5 hover:bg-[#F1D77A] cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>Adicionar Serviço</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {services.map((service) => (
                          <div
                            key={service.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              service.active !== false
                                ? 'bg-black border-[#D4AF37]/30'
                                : 'bg-zinc-950/60 border-zinc-800 opacity-60'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-sm text-white">{service.name}</h5>
                                  <span
                                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                      service.active !== false
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-zinc-800 text-zinc-400'
                                    }`}
                                  >
                                    {service.active !== false ? 'Ativo' : 'Desativado'}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-400 mt-1">{service.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs">
                                  <span className="text-[#F1D77A] font-bold">R$ {service.price.toFixed(2).replace('.', ',')}</span>
                                  <span className="text-zinc-400 flex items-center gap-1">
                                    <Clock size={12} className="text-[#D4AF37]" />
                                    <span>{service.duration} minutos</span>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleOpenEditService(service)}
                                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer"
                                  title="Editar Serviço"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleToggleActiveService(service)}
                                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                    service.active !== false
                                      ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                  }`}
                                  title={service.active !== false ? 'Desativar Serviço' : 'Reativar Serviço'}
                                >
                                  {service.active !== false ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Service Add/Edit Form */
                    <form onSubmit={handleSaveService} className="space-y-4 max-w-lg mx-auto bg-black p-4 rounded-xl border border-[#D4AF37]/30">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                          {serviceForm.id ? 'Editar Serviço' : 'Novo Serviço'}
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
                        <label className="block text-xs text-zinc-400 mb-1">Nome do Serviço</label>
                        <input
                          type="text"
                          value={serviceForm.name}
                          onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                          className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-sm focus:border-[#F1D77A]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Descrição</label>
                        <textarea
                          rows={2}
                          value={serviceForm.description}
                          onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                          className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-sm focus:border-[#F1D77A]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Preço (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={serviceForm.price}
                            onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-sm focus:border-[#F1D77A]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Duração (minutos)</label>
                          <input
                            type="number"
                            step="5"
                            value={serviceForm.duration}
                            onChange={(e) => setServiceForm({ ...serviceForm, duration: parseInt(e.target.value, 10) || 15 })}
                            className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-sm focus:border-[#F1D77A]"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Ícone Visual</label>
                        <select
                          value={serviceForm.iconName}
                          onChange={(e) => setServiceForm({ ...serviceForm, iconName: e.target.value })}
                          className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-sm focus:border-[#F1D77A]"
                        >
                          <option value="scissors">Tesoura (Corte)</option>
                          <option value="beard">Barba (Navalha)</option>
                          <option value="combo">Combo (Coroa/Corte+Barba)</option>
                          <option value="hair">Cabelo (Selagem)</option>
                          <option value="straight">Alisamento</option>
                          <option value="platinum">Platinado</option>
                          <option value="eyebrow">Sobrancelha</option>
                          <option value="dye">Pintura</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="activeCheckbox"
                          checked={serviceForm.active}
                          onChange={(e) => setServiceForm({ ...serviceForm, active: e.target.checked })}
                          className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                        />
                        <label htmlFor="activeCheckbox" className="text-xs text-zinc-300 cursor-pointer">
                          Serviço Ativo e visível no site para agendamentos
                        </label>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingService(false)}
                          className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
                        >
                          Voltar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F1D77A] text-black text-xs font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Salvar Serviço
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* 3. CAROUSEL MANAGEMENT */}
              {activeTab === 'carousel' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">Gerenciar Carrossel</h4>
                      <p className="text-[10px] text-zinc-400">Reorganize a ordem, ative/desative ou adicione novas fotos</p>
                    </div>
                    <button
                      onClick={() => setImageModalOpen(true)}
                      className="py-1.5 px-3 rounded-lg bg-[#D4AF37] text-black font-bold text-xs uppercase flex items-center gap-1.5 hover:bg-[#F1D77A] cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Adicionar Imagem</span>
                    </button>
                  </div>

                  {/* List of Carousel Images */}
                  <div className="space-y-2.5">
                    {carouselImages.map((img, idx) => (
                      <div
                        key={img.id}
                        className={`p-2.5 rounded-xl border flex items-center gap-3 transition-colors ${
                          img.active !== false ? 'bg-black border-[#D4AF37]/30' : 'bg-zinc-950/60 border-zinc-800 opacity-50'
                        }`}
                      >
                        {/* Order badge */}
                        <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-[#F1D77A] shrink-0">
                          {idx + 1}
                        </div>

                        {/* Thumbnail */}
                        <img
                          src={img.url}
                          alt={img.title || `Foto ${idx + 1}`}
                          className="w-14 h-14 object-cover rounded-lg border border-white/10 shrink-0 bg-zinc-900"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-white block truncate">
                            {img.title || `Imagem ${idx + 1}`}
                          </span>
                          <span className="text-[10px] text-zinc-500 block truncate">{img.url}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Move up / down */}
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveImage(idx, 'up')}
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-20 text-zinc-300"
                            title="Mover para cima"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            disabled={idx === carouselImages.length - 1}
                            onClick={() => handleMoveImage(idx, 'down')}
                            className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-20 text-zinc-300"
                            title="Mover para baixo"
                          >
                            <ArrowDown size={14} />
                          </button>

                          {/* Toggle Active */}
                          <button
                            onClick={() => toggleCarouselImageActive(img.id, !img.active)}
                            className={`p-1.5 rounded transition-colors ${
                              img.active !== false
                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                            title={img.active !== false ? 'Desativar foto' : 'Ativar foto'}
                          >
                            {img.active !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>

                          {/* Delete with prompt */}
                          <button
                            onClick={() => setDeleteConfirmId(img.id)}
                            className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            title="Remover foto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Image Modal */}
                  {imageModalOpen && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
                      <div className="bg-[#0F0F0F] border border-[#D4AF37]/50 rounded-2xl p-5 w-full max-w-md space-y-4">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                            Adicionar Imagem ao Carrossel
                          </h4>
                          <button onClick={() => setImageModalOpen(false)} className="text-zinc-400 hover:text-white">
                            <X size={16} />
                          </button>
                        </div>

                        <div className="flex border-b border-white/10">
                          <button
                            type="button"
                            onClick={() => setImageInputMode('url')}
                            className={`flex-1 py-2 text-xs font-bold ${imageInputMode === 'url' ? 'text-[#F1D77A] border-b-2 border-[#D4AF37]' : 'text-zinc-400'}`}
                          >
                            Via Link / URL
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageInputMode('upload')}
                            className={`flex-1 py-2 text-xs font-bold ${imageInputMode === 'upload' ? 'text-[#F1D77A] border-b-2 border-[#D4AF37]' : 'text-zinc-400'}`}
                          >
                            Upload de Arquivo (Storage)
                          </button>
                        </div>

                        <form onSubmit={handleAddCarouselImage} className="space-y-3">
                          {imageInputMode === 'url' ? (
                            <div>
                              <label className="block text-xs text-zinc-400 mb-1">URL da Imagem (Imgur ou direta)</label>
                              <input
                                type="url"
                                placeholder="https://i.imgur.com/..."
                                value={imageUrlInput}
                                onChange={(e) => setImageUrlInput(e.target.value)}
                                className="w-full bg-black border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-xs"
                                required
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-xs text-zinc-400 mb-1">Selecione o arquivo do dispositivo</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                className="w-full bg-black border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#D4AF37] file:text-black"
                                required
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-xs text-zinc-400 mb-1">Legenda / Título (opcional)</label>
                            <input
                              type="text"
                              placeholder="Ex: Degradê com navalha"
                              value={imageTitleInput}
                              onChange={(e) => setImageTitleInput(e.target.value)}
                              className="w-full bg-black border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-xs"
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setImageModalOpen(false)}
                              className="flex-1 py-2 rounded-xl border border-white/10 text-xs text-zinc-400"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={isUploadingImage}
                              className="flex-1 py-2 rounded-xl bg-[#D4AF37] text-black font-bold uppercase text-xs hover:bg-[#F1D77A]"
                            >
                              {isUploadingImage ? 'Enviando...' : 'Adicionar'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Delete Confirmation Prompt */}
                  {deleteConfirmId && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
                      <div className="bg-[#121212] border border-red-500/50 rounded-2xl p-5 w-full max-w-sm text-center space-y-4 shadow-xl">
                        <AlertCircle size={32} className="mx-auto text-red-400" />
                        <div>
                          <h4 className="text-sm font-bold text-white">Remover imagem do carrossel?</h4>
                          <p className="text-xs text-zinc-400 mt-1">
                            Tem certeza que deseja remover esta imagem do carrossel?
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex-1 py-2 rounded-xl border border-white/10 text-xs text-zinc-300"
                          >
                            CANCELAR
                          </button>
                          <button
                            onClick={handleConfirmDeleteImage}
                            className="flex-1 py-2 rounded-xl bg-red-600 text-white font-bold text-xs uppercase hover:bg-red-700"
                          >
                            REMOVER
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. APPOINTMENTS MANAGEMENT */}
              {activeTab === 'appointments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">Gerenciamento de Agendamentos</h4>
                      <p className="text-[10px] text-zinc-400">Ao cancelar, o horário é liberado automaticamente para outros clientes</p>
                    </div>
                    <button
                      onClick={() => setBlockModalOpen(true)}
                      className="py-1.5 px-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-xs uppercase flex items-center gap-1.5 hover:bg-red-500/30 cursor-pointer"
                    >
                      <Ban size={14} />
                      <span>Bloquear Horário</span>
                    </button>
                  </div>

                  {loadingAppointments ? (
                    <div className="text-center py-10 text-zinc-500 text-xs">Carregando agendamentos...</div>
                  ) : appointments.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500 text-xs">Nenhum agendamento registrado.</div>
                  ) : (
                    <div className="space-y-3">
                      {appointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="p-3.5 rounded-xl bg-black border border-[#D4AF37]/20 space-y-2 text-xs"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-sm text-white">{apt.customerName}</div>
                              <div className="text-zinc-400 flex items-center gap-1.5 mt-0.5">
                                <Phone size={12} className="text-[#D4AF37]" />
                                <span>{apt.customerPhone}</span>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                                apt.status === 'confirmed'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : apt.status === 'completed'
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : apt.status === 'cancelled'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              }`}
                            >
                              {apt.status === 'confirmed' ? 'Confirmado' : apt.status === 'completed' ? 'Concluído' : apt.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-zinc-300 bg-white/5 p-2 rounded-lg text-[11px]">
                            <div>
                              <span className="text-zinc-500 block">Serviço:</span>
                              <strong className="text-[#F1D77A]">{apt.serviceName}</strong> (R$ {Number(apt.servicePrice).toFixed(2).replace('.', ',')})
                            </div>
                            <div>
                              <span className="text-zinc-500 block">Data & Horário:</span>
                              <strong>{apt.date.split('-').reverse().join('/')}</strong> das <strong>{apt.startTime} às {apt.endTime}</strong>
                            </div>
                          </div>

                          {/* Actions: Confirm, Conclude, Cancel */}
                          <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                            {apt.status !== 'confirmed' && apt.status !== 'completed' && (
                              <button
                                onClick={() => handleUpdateAppointmentStatus(apt, 'confirmed')}
                                className="flex-1 py-1 px-2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/30 cursor-pointer"
                              >
                                Confirmar
                              </button>
                            )}
                            {apt.status !== 'completed' && (
                              <button
                                onClick={() => handleUpdateAppointmentStatus(apt, 'completed')}
                                className="flex-1 py-1 px-2 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold hover:bg-blue-500/30 cursor-pointer"
                              >
                                Concluir
                              </button>
                            )}
                            {apt.status !== 'cancelled' && (
                              <button
                                onClick={() => handleUpdateAppointmentStatus(apt, 'cancelled')}
                                className="flex-1 py-1 px-2 rounded bg-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/30 cursor-pointer"
                              >
                                Cancelar & Liberar Horário
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 5. SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="bg-black border border-[#D4AF37]/30 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-white/10 pb-2">
                      Conta Administrativa Atual
                    </h4>
                    <div className="text-xs text-zinc-300">
                      <span className="text-zinc-500 block">E-mail autenticado:</span>
                      <strong className="text-white">{user.email}</strong>
                    </div>
                    <button
                      onClick={handlePasswordReset}
                      className="text-xs text-[#F1D77A] hover:underline block pt-1"
                    >
                      Enviar e-mail para trocar senha
                    </button>
                  </div>

                  <div className="bg-black border border-white/10 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Sessão
                    </h4>
                    <button
                      onClick={handleLogout}
                      className="w-full py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-xs uppercase hover:bg-red-500/30 cursor-pointer"
                    >
                      Encerrar Sessão
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Block Slot Modal */}
        {blockModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
            <div className="bg-[#101010] border border-[#D4AF37]/50 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Bloquear Horário na Agenda
                </h4>
                <button onClick={() => setBlockModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleBlockSlot} className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Data</label>
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
                    <label className="block text-xs text-zinc-400 mb-1">Horário Início</label>
                    <input
                      type="time"
                      value={blockStartTime}
                      onChange={(e) => setBlockStartTime(e.target.value)}
                      className="w-full bg-black border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-xs [color-scheme:dark]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Horário Fim</label>
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
                  <label className="block text-xs text-zinc-400 mb-1">Motivo do Bloqueio</label>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Ex: Almoço / Manutenção / Compromisso"
                    className="w-full bg-black border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-xs"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBlockModalOpen(false)}
                    className="flex-1 py-2 rounded-xl border border-white/10 text-xs text-zinc-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-red-600 text-white font-bold uppercase text-xs hover:bg-red-700"
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
