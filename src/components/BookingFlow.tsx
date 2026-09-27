import React, { useState, useEffect } from 'react';
import { Service, Appointment } from '../types';
import { BASE_TIME_SLOTS } from '../constants';
import {
  subscribeToAppointmentsForDate,
  computeSlotAvailability,
  bookAppointmentAtomically,
  generateWhatsAppUrl,
  calculateEndTime
} from '../services/bookingService';
import { PremiumIcon } from './PremiumIcon';
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertTriangle, User, Phone, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface BookingFlowProps {
  services: Service[];
  initialSelectedService: Service | null;
  onClearService: () => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({
  services,
  initialSelectedService,
}) => {
  // Today formatted as YYYY-MM-DD in Brazilian local time zone
  const getTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedService, setSelectedService] = useState<Service | null>(
    initialSelectedService || (services.length > 0 ? services[0] : null)
  );
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Firestore live state
  const [appointmentsOnDate, setAppointmentsOnDate] = useState<Appointment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    id: string;
    serviceName: string;
    servicePrice: number;
    date: string;
    startTime: string;
    customerName: string;
  } | null>(null);

  // Sync initialSelectedService when changed externally
  useEffect(() => {
    if (initialSelectedService) {
      setSelectedService(initialSelectedService);
    }
  }, [initialSelectedService]);

  // Real-time Firestore subscription for the chosen date
  useEffect(() => {
    if (!selectedDate) return;
    const unsubscribe = subscribeToAppointmentsForDate(selectedDate, (apts) => {
      setAppointmentsOnDate(apts);
    });
    return () => unsubscribe();
  }, [selectedDate]);

  // Whenever date or duration changes, reset selected time if it becomes invalid
  const serviceDuration = selectedService ? selectedService.duration : 45;
  const availableSlots = computeSlotAvailability(BASE_TIME_SLOTS, appointmentsOnDate, serviceDuration);

  // Auto-clear selectedTime if it is no longer available in real-time
  useEffect(() => {
    if (selectedTime) {
      const slot = availableSlots.find(s => s.time === selectedTime);
      if (!slot || !slot.available) {
        setSelectedTime(null);
      }
    }
  }, [availableSlots, selectedTime]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format Brazilian phone mask: (XX) 9XXXX-XXXX
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);

    if (val.length > 6) {
      val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
    } else if (val.length > 2) {
      val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    } else if (val.length > 0) {
      val = `(${val}`;
    }
    setCustomerPhone(val);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!selectedService) {
      setBookingError('Por favor, selecione um serviço.');
      return;
    }
    if (!selectedDate) {
      setBookingError('Por favor, selecione uma data.');
      return;
    }
    if (!selectedTime) {
      setBookingError('Por favor, selecione um horário disponível.');
      return;
    }
    if (!customerName.trim()) {
      setBookingError('Por favor, informe seu nome completo.');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setBookingError('Por favor, informe um número de WhatsApp válido.');
      return;
    }

    setIsSubmitting(true);

    // Call atomic Firestore transaction
    const result = await bookAppointmentAtomically({
      customerName,
      customerPhone,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      serviceDuration: selectedService.duration,
      servicePrice: selectedService.price,
      date: selectedDate,
      startTime: selectedTime,
    });

    setIsSubmitting(false);

    if (result.success && result.appointmentId) {
      setConfirmedBooking({
        id: result.appointmentId,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        date: selectedDate,
        startTime: selectedTime,
        customerName: customerName.trim(),
      });
    } else {
      setBookingError(result.error || 'Erro ao agendar horário. Tente novamente.');
    }
  };

  const handleOpenWhatsApp = () => {
    if (!confirmedBooking) return;
    const url = generateWhatsAppUrl(confirmedBooking);
    window.location.href = url;
  };

  // If confirmed, display the official confirmation screen with WhatsApp trigger
  if (confirmedBooking) {
    const [y, m, d] = confirmedBooking.date.split('-');
    const formattedDate = `${d}/${m}/${y}`;
    const calculatedEnd = calculateEndTime(
      confirmedBooking.startTime,
      selectedService?.duration || 45
    );

    return (
      <section id="agendamento" className="w-full max-w-md mx-auto px-4 py-8 scroll-mt-14">
        <div className="bg-[#0A0A0A] border-2 border-[#D4AF37] rounded-2xl p-6 shadow-[0_0_35px_rgba(212,175,55,0.3)] text-center relative overflow-hidden">
          {/* Subtle gold sheen */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-[#1a1608] to-[#2d240d] border border-[#F1D77A] flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
            <PremiumIcon name="check" size={34} />
          </div>

          <span className="text-[10px] font-extrabold tracking-[0.25em] text-[#D4AF37] uppercase bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30">
            Registro Firestore Verificado
          </span>

          <h2 className="text-2xl font-serif font-bold text-white mt-3 uppercase tracking-wide">
            Agendamento Confirmado!
          </h2>

          <p className="text-xs text-zinc-300 mt-2">
            Seu horário foi bloqueado com sucesso no banco de dados centralizado.
          </p>

          {/* Details Card */}
          <div className="bg-black/70 border border-[#D4AF37]/30 rounded-xl p-4 my-5 text-left space-y-2.5">
            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
              <span className="text-zinc-400">Cliente:</span>
              <span className="font-semibold text-white">{confirmedBooking.customerName}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
              <span className="text-zinc-400">Serviço:</span>
              <span className="font-semibold text-[#F1D77A]">{confirmedBooking.serviceName}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
              <span className="text-zinc-400">Data:</span>
              <span className="font-semibold text-white">{formattedDate}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
              <span className="text-zinc-400">Horário:</span>
              <span className="font-semibold text-white">
                {confirmedBooking.startTime} às {calculatedEnd}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm pt-1">
              <span className="text-zinc-400">Valor Total:</span>
              <span className="font-bold text-lg text-[#F1D77A]">
                R$ {confirmedBooking.servicePrice.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* WhatsApp Direct Action Button */}
          <button
            onClick={handleOpenWhatsApp}
            className="w-full py-4 px-5 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_6px_20px_rgba(37,211,102,0.4)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            <PremiumIcon name="whatsapp" size={24} />
            <span>Continuar no WhatsApp</span>
          </button>

          <button
            onClick={() => {
              setConfirmedBooking(null);
              setSelectedTime(null);
            }}
            className="w-full mt-3 py-2 text-xs text-zinc-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
          >
            Agendar outro serviço
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="agendamento" className="w-full max-w-md mx-auto px-4 py-8 scroll-mt-14">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121212] border border-[#D4AF37]/30 mb-2">
          <ShieldCheck size={14} className="text-[#D4AF37]" />
          <span className="text-[10px] font-bold tracking-widest text-[#F1D77A] uppercase">
            Sistema Oficial Firebase
          </span>
        </div>
        <h2 className="text-2xl font-serif tracking-wide text-white uppercase font-semibold">
          Agendar Horário
        </h2>
        <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-2" />
        <p className="text-xs text-zinc-400 mt-2">
          Sem necessidade de conta. Escolha data e horário em tempo real.
        </p>
      </div>

      <form onSubmit={handleBookingSubmit} className="space-y-6">
        {/* Step 1: Service Selection */}
        <div className="bg-[#0A0A0A] border border-[#D4AF37]/25 rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-zinc-200">
            <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-black text-xs flex items-center justify-center font-bold">1</span>
            <span>Serviço Selecionado</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <select
              value={selectedService?.id || ''}
              onChange={(e) => {
                const s = services.find((srv) => srv.id === e.target.value);
                if (s) setSelectedService(s);
              }}
              className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[#F1D77A] transition-colors"
            >
              {services.map((service) => (
                <option key={service.id} value={service.id} className="bg-black text-white">
                  {service.name} — R$ {service.price.toFixed(2).replace('.', ',')} ({service.duration} min)
                </option>
              ))}
            </select>
          </div>

          {selectedService && (
            <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-400 px-1">
              <span>Duração: <strong className="text-white">{selectedService.duration} minutos</strong></span>
              <span>Valor: <strong className="text-[#F1D77A]">R$ {selectedService.price.toFixed(2).replace('.', ',')}</strong></span>
            </div>
          )}
        </div>

        {/* Step 2: Date Picker */}
        <div className="bg-[#0A0A0A] border border-[#D4AF37]/25 rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-zinc-200">
            <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-black text-xs flex items-center justify-center font-bold">2</span>
            <span>Escolha a Data</span>
          </div>

          <div className="relative">
            <input
              type="date"
              min={getTodayString()}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime(null);
              }}
              className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-[#F1D77A] transition-colors [color-scheme:dark]"
              required
            />
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            * Horário de atendimento: Segunda a Sábado das 08:00 às 19:30.
          </p>
        </div>

        {/* Step 3: Slots Grid (Real-time Firestore) */}
        <div className="bg-[#0A0A0A] border border-[#D4AF37]/25 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-black text-xs flex items-center justify-center font-bold">3</span>
              <span>Horários Disponíveis</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>Firestore Ao Vivo</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {availableSlots.map((slot) => {
              const isSelected = selectedTime === slot.time;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setSelectedTime(slot.time)}
                  title={slot.reason || (slot.available ? 'Disponível' : 'Indisponível')}
                  className={`py-2.5 px-1 rounded-lg text-xs font-semibold transition-all relative flex flex-col items-center justify-center ${
                    !slot.available
                      ? 'bg-zinc-900/60 text-zinc-600 border border-zinc-800/60 cursor-not-allowed line-through'
                      : isSelected
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#F1D77A] text-black shadow-[0_0_12px_rgba(212,175,55,0.6)] font-bold scale-[1.02]'
                      : 'bg-[#151515] text-zinc-200 border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:text-[#F1D77A]'
                  }`}
                >
                  <span>{slot.time}</span>
                  {!slot.available && (
                    <span className="text-[8px] no-underline uppercase tracking-tight text-red-400/80">
                      Ocupado
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Slots Legend */}
          <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-zinc-400 pt-2 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span>Indisponível / Ocupado</span>
            </div>
          </div>
        </div>

        {/* Step 4: Customer Details */}
        <div className="bg-[#0A0A0A] border border-[#D4AF37]/25 rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-center gap-2 mb-1 text-sm font-semibold text-zinc-200">
            <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-black text-xs flex items-center justify-center font-bold">4</span>
            <span>Seus Dados</span>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Ex: Carlos Silva"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-[#121212] border border-[#D4AF37]/35 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F1D77A]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">WhatsApp para Confirmação</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="tel"
                placeholder="(31) 99999-9999"
                value={customerPhone}
                onChange={handlePhoneChange}
                className="w-full bg-[#121212] border border-[#D4AF37]/35 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F1D77A]"
                required
              />
            </div>
          </div>
        </div>

        {/* Step 5: Summary & Confirmation */}
        {selectedService && selectedTime && (
          <div className="bg-gradient-to-br from-[#121212] via-[#0A0A0A] to-[#171305] border border-[#F1D77A]/50 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
              <span className="text-xs uppercase tracking-wider text-zinc-400">Resumo da Reserva</span>
              <span className="text-[10px] text-[#F1D77A] font-semibold bg-[#F1D77A]/10 px-2 py-0.5 rounded-full">
                Proteção Anti-Concorrência
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Serviço:</span>
                <span className="text-white font-medium">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Duração:</span>
                <span className="text-white font-medium">{selectedService.duration} min (até {calculateEndTime(selectedTime, selectedService.duration)})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Data & Horário:</span>
                <span className="text-white font-medium">{selectedDate.split('-').reverse().join('/')} às {selectedTime}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/5">
                <span className="text-zinc-300 font-semibold">Valor:</span>
                <span className="text-[#F1D77A] font-bold text-sm">
                  R$ {selectedService.price.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error notification */}
        {bookingError && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 flex items-start gap-2.5 text-red-200 text-xs shadow-md">
            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{bookingError}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !selectedTime}
          className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_6px_25px_rgba(212,175,55,0.35)] ${
            isSubmitting || !selectedTime
              ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#D4AF37] via-[#F1D77A] to-[#B38728] text-black hover:brightness-105 active:scale-[0.98]'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Verificando no Firestore...</span>
            </div>
          ) : (
            <>
              <span>Confirmar Agendamento</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </section>
  );
};
