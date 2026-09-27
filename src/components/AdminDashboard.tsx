import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Appointment, AppointmentStatus, Service } from '../types';
import { createService, updateService, toggleServiceStatus } from '../services/bookingService';
import { Lock, Scissors, Calendar, Clock, Phone, Plus, Edit2, Check, X, Eye, EyeOff, Trash2 } from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose, services }) => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'appointments' | 'services'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  // New or Edit Service state
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

  const ADMIN_PIN = '1234';

  useEffect(() => {
    if (!isAuthenticated) return;

    setLoading(true);
    const q = query(collection(db, 'appointments'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apts: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        apts.push({ ...docSnap.data(), id: docSnap.id } as Appointment);
      });
      setAppointments(apts);
      setLoading(false);
    }, (err) => {
      console.error('Erro ao buscar agendamentos:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setIsAuthenticated(true);
      setPin('');
    } else {
      alert('PIN incorreto');
    }
  };

  const handleUpdateStatus = async (appointmentId: string, newStatus: AppointmentStatus) => {
    try {
      const aptRef = doc(db, 'appointments', appointmentId);
      await updateDoc(aptRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Falha ao atualizar status:', err);
      alert('Erro ao atualizar status');
    }
  };

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

  const handleToggleActive = async (service: Service) => {
    try {
      await toggleServiceStatus(service.id, !service.active);
    } catch (err) {
      console.error('Erro ao alterar status do serviço:', err);
      alert('Erro ao alterar status do serviço.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0A0A0A] border-2 border-[#D4AF37]/50 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#D4AF37]/30 flex items-center justify-between bg-black/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#F1D77A]">
              <Lock size={16} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-white text-base">Painel Administrativo</h3>
              <p className="text-[10px] text-zinc-400">Flayder Willis Barbearia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          <form onSubmit={handlePinSubmit} className="p-6 text-center space-y-4">
            <p className="text-xs text-zinc-400">
              Área restrita para a equipe gerenciar agendamentos e catálogo de serviços.
            </p>
            <div>
              <input
                type="password"
                maxLength={6}
                placeholder="Digite o PIN de acesso (1234)"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full text-center tracking-[0.5em] text-lg font-mono bg-black border border-[#D4AF37]/40 rounded-xl py-3 text-white focus:outline-none focus:border-[#F1D77A]"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#D4AF37] text-black font-bold uppercase text-xs tracking-wider rounded-xl hover:bg-[#F1D77A] transition-colors cursor-pointer"
            >
              Acessar Painel
            </button>
          </form>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Nav Tabs: Appointments vs Services Management */}
            <div className="flex border-b border-white/10 bg-black/40">
              <button
                onClick={() => {
                  setActiveTab('appointments');
                  setIsEditingService(false);
                }}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'appointments'
                    ? 'border-[#D4AF37] text-[#F1D77A] bg-[#D4AF37]/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Calendar size={14} />
                <span>Agendamentos ({appointments.length})</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('services');
                  setIsEditingService(false);
                }}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'services'
                    ? 'border-[#D4AF37] text-[#F1D77A] bg-[#D4AF37]/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Scissors size={14} />
                <span>Gerenciar Serviços ({services.length})</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* TAB 1: APPOINTMENTS */}
              {activeTab === 'appointments' && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium">Histórico e reservas ativas</span>
                    <button
                      onClick={() => setIsAuthenticated(false)}
                      className="text-[11px] text-red-400 hover:underline cursor-pointer"
                    >
                      Bloquear painel
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-10 text-zinc-500 text-xs">
                      Carregando agenda...
                    </div>
                  ) : appointments.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500 text-xs">
                      Nenhum agendamento registrado ainda.
                    </div>
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
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
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
                              <strong className="text-[#F1D77A]">{apt.serviceName}</strong> (R$ {apt.servicePrice})
                            </div>
                            <div>
                              <span className="text-zinc-500 block">Horário:</span>
                              <strong>{apt.date.split('-').reverse().join('/')}</strong> das <strong>{apt.startTime} às {apt.endTime}</strong>
                            </div>
                          </div>

                          {/* Quick status actions */}
                          <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                            {apt.status !== 'completed' && (
                              <button
                                onClick={() => apt.id && handleUpdateStatus(apt.id, 'completed')}
                                className="flex-1 py-1 px-2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/30 cursor-pointer"
                              >
                                Concluir
                              </button>
                            )}
                            {apt.status !== 'cancelled' && (
                              <button
                                onClick={() => apt.id && handleUpdateStatus(apt.id, 'cancelled')}
                                className="flex-1 py-1 px-2 rounded bg-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/30 cursor-pointer"
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: SERVICES MANAGEMENT */}
              {activeTab === 'services' && (
                <>
                  {!isEditingService ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-zinc-400">Catálogo de Serviços</span>
                        <button
                          onClick={handleOpenNewService}
                          className="py-1.5 px-3 rounded-lg bg-[#D4AF37] text-black font-bold text-xs uppercase flex items-center gap-1.5 hover:bg-[#F1D77A] cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>Novo Serviço</span>
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
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm text-white">{service.name}</h4>
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
                                <div className="flex items-center gap-3 mt-2 text-xs font-medium">
                                  <span className="text-[#F1D77A]">R$ {service.price.toFixed(2).replace('.', ',')}</span>
                                  <span className="text-zinc-500">•</span>
                                  <span className="text-zinc-300">{service.duration} minutos</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleOpenEditService(service)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer"
                                  title="Editar Serviço"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleToggleActive(service)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    service.active !== false
                                      ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                  }`}
                                  title={service.active !== false ? 'Desativar Serviço' : 'Ativar Serviço'}
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
                    <form onSubmit={handleSaveService} className="space-y-4">
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
                          className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Descrição</label>
                        <textarea
                          rows={2}
                          value={serviceForm.description}
                          onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                          className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-sm"
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
                            className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-sm"
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
                            className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-sm"
                            required
                          />
                        </div>
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
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
