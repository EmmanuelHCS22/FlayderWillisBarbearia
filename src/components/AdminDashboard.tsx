import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Appointment, AppointmentStatus } from '../types';
import { Lock, Unlock, Calendar, Clock, User, Phone, CheckCircle, XCircle, RefreshCw, X } from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'upcoming'>('all');
  const [loading, setLoading] = useState(false);

  // Simple admin PIN for barber staff access protection (can be configured)
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
      console.error('Error fetching admin appointments:', err);
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
      console.error('Failed to update status:', err);
      alert('Erro ao atualizar status');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0A0A0A] border-2 border-[#D4AF37]/50 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#D4AF37]/30 flex items-center justify-between bg-black/60">
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
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          <form onSubmit={handlePinSubmit} className="p-6 text-center space-y-4">
            <p className="text-xs text-zinc-400">
              Área restrita para a equipe da barbearia gerenciar os agendamentos.
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
              className="w-full py-3 bg-[#D4AF37] text-black font-bold uppercase text-xs tracking-wider rounded-xl hover:bg-[#F1D77A] transition-colors"
            >
              Acessar Agenda
            </button>
          </form>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Total de agendamentos: {appointments.length}</span>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="text-[11px] text-red-400 hover:underline"
              >
                Bloquear painel
              </button>
            </div>

            {loading ? (
              <div className="text-center py-10 text-zinc-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin" />
                <span>Carregando do Firebase...</span>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-xs">
                Nenhum agendamento registrado no banco ainda.
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
                          className="flex-1 py-1 px-2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/30"
                        >
                          Concluir
                        </button>
                      )}
                      {apt.status !== 'cancelled' && (
                        <button
                          onClick={() => apt.id && handleUpdateStatus(apt.id, 'cancelled')}
                          className="flex-1 py-1 px-2 rounded bg-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/30"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
