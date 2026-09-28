import React, { useState, useEffect } from 'react';
import { Service, Appointment } from '../types';
import { BASE_TIME_SLOTS } from '../constants';
import {
  subscribeToAppointmentsForDate,
  computeSlotAvailability,
  bookAppointmentAtomically,
  generateWhatsAppUrl,
  getEstablishmentNow,
  timeStringToMinutes
} from '../services/bookingService';
import { PremiumIcon } from './PremiumIcon';
import { AlertTriangle, User, Phone, ArrowRight, Check, X, Clock, CalendarDays } from 'lucide-react';

interface BookingFlowProps {
  services: Service[];
  selectedService?: Service | null;
  selectedServices?: Service[];
  onSelectService?: (service: Service | null) => void;
  onToggleService?: (service: Service) => void;
  onClearServices?: () => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({
  services,
  selectedService,
  selectedServices = [],
  onSelectService,
  onToggleService,
  onClearServices
}) => {
  // Determine effective selected services list
  const effectiveServices: Service[] = selectedServices.length > 0
    ? selectedServices
    : selectedService
    ? [selectedService]
    : [];

  const totalDuration = effectiveServices.reduce((sum, s) => sum + s.duration, 0) || 45;
  const totalPrice = effectiveServices.reduce((sum, s) => sum + s.price, 0);
  const serviceNamesDisplay = effectiveServices.map(s => s.name).join(' + ');

  // Dynamic establishment current time & date (America/Sao_Paulo)
  const [establishmentNow, setEstablishmentNow] = useState(() => getEstablishmentNow());

  useEffect(() => {
    const updateTime = () => {
      setEstablishmentNow(getEstablishmentNow());
    };

    // Update real-time clock every 10 seconds
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Today formatted as YYYY-MM-DD in establishment timezone
  const getTodayString = () => establishmentNow.dateString;

  const isSunday = (dateStr: string) => {
    if (!dateStr) return false;
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.getDay() === 0;
  };

  // Form states: initially clean
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Live state from appointments
  const [appointmentsOnDate, setAppointmentsOnDate] = useState<Appointment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [lastSubmittedUrl, setLastSubmittedUrl] = useState<string | null>(null);

  // Active services list
  const activeServices = services.filter(s => s.active !== false);

  // Real-time subscription to appointments for the chosen date
  useEffect(() => {
    if (!selectedDate) {
      setAppointmentsOnDate([]);
      return;
    }
    const unsubscribe = subscribeToAppointmentsForDate(selectedDate, (apts) => {
      setAppointmentsOnDate(apts);
    });
    return () => unsubscribe();
  }, [selectedDate]);

  // Compute slot availability
  const isSundaySelected = isSunday(selectedDate);
  const availableSlots = (!selectedDate || isSundaySelected)
    ? []
    : computeSlotAvailability(
        BASE_TIME_SLOTS,
        appointmentsOnDate,
        totalDuration,
        selectedDate,
        establishmentNow.currentMinutes,
        establishmentNow.dateString
      );

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

    if (effectiveServices.length === 0) {
      setBookingError('Por favor, selecione pelo menos um serviço para continuar.');
      return;
    }
    if (!selectedDate) {
      setBookingError('Por favor, selecione a data do atendimento.');
      return;
    }
    if (isSundaySelected) {
      setBookingError('A barbearia está fechada aos domingos. Escolha uma data de segunda a sábado.');
      return;
    }
    if (!selectedTime) {
      setBookingError('Por favor, escolha um dos horários disponíveis.');
      return;
    }
    if (selectedDate < establishmentNow.dateString) {
      setBookingError('Não é possível agendar para uma data anterior à data atual.');
      return;
    }
    if (selectedDate === establishmentNow.dateString) {
      const slotMin = timeStringToMinutes(selectedTime);
      if (slotMin < establishmentNow.currentMinutes) {
        setBookingError('O horário selecionado já passou. Por favor, escolha um horário futuro disponível.');
        setSelectedTime(null);
        return;
      }
    }
    if (!customerName.trim()) {
      setBookingError('Por favor, informe seu nome completo.');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setBookingError('Por favor, informe um número de WhatsApp válido com DDD.');
      return;
    }

    setIsSubmitting(true);

    const result = await bookAppointmentAtomically({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      serviceId: effectiveServices[0]?.id || 'multi',
      serviceName: serviceNamesDisplay,
      services: effectiveServices.map(s => ({
        id: s.id,
        name: s.name,
        price: s.price,
        duration: s.duration
      })),
      serviceDuration: totalDuration,
      servicePrice: totalPrice,
      date: selectedDate,
      startTime: selectedTime,
    });

    if (result.success && result.appointmentId) {
      const waUrl = generateWhatsAppUrl({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        serviceName: serviceNamesDisplay,
        services: effectiveServices.map(s => ({
          id: s.id,
          name: s.name,
          price: s.price,
          duration: s.duration
        })),
        serviceDuration: totalDuration,
        servicePrice: totalPrice,
        date: selectedDate,
        startTime: selectedTime,
      });

      try {
        const opened = window.open(waUrl, '_blank');
        if (!opened) {
          const tempLink = document.createElement('a');
          tempLink.href = waUrl;
          tempLink.target = '_blank';
          tempLink.rel = 'noopener noreferrer';
          document.body.appendChild(tempLink);
          tempLink.click();
          document.body.removeChild(tempLink);
        }
      } catch (err) {
        console.error('Erro ao abrir WhatsApp:', err);
      }

      setLastSubmittedUrl(waUrl);

      setTimeout(() => {
        setLastSubmittedUrl(null);
      }, 12000);

      // Reset form states cleanly
      if (onClearServices) onClearServices();
      if (onSelectService) onSelectService(null);
      setSelectedDate('');
      setSelectedTime(null);
      setCustomerName('');
      setCustomerPhone('');
      setBookingError(null);
      setIsSubmitting(false);

      const el = document.getElementById('agendamento');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setIsSubmitting(false);
      setBookingError(result.error || 'Esse horário acabou de ser reservado. Escolha outro horário disponível.');
    }
  };

  return (
    <section id="agendamento" className="w-full max-w-xl mx-auto px-4 py-10 scroll-mt-16">
      {/* Section Header */}
      <div className="text-center mb-8">
        <span className="text-[11px] font-semibold tracking-[0.28em] text-[#C5A059] uppercase block mb-1">
          Reserva Direta
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif tracking-wide text-zinc-100 uppercase font-semibold">
          Agendar Horário
        </h2>
        <div className="w-10 h-px bg-[#C5A059]/60 mx-auto mt-3" />
        <p className="text-xs text-zinc-400 mt-2.5 max-w-md mx-auto leading-relaxed">
          Selecione data, horário e confirme sua visita em poucos toques.
        </p>
      </div>

      {/* Success Banner */}
      {lastSubmittedUrl && (
        <div className="mb-6 p-4 rounded-lg bg-[#0F1411] border border-emerald-500/40 text-emerald-100 text-xs shadow-md space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium text-white text-xs uppercase tracking-wider">
              <Check size={16} className="text-emerald-400 shrink-0" />
              <span>Agendamento Registrado com Sucesso</span>
            </div>
            <button
              type="button"
              onClick={() => setLastSubmittedUrl(null)}
              className="text-zinc-400 hover:text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-[11px] text-zinc-300 leading-relaxed">
            Seus dados foram salvos. O WhatsApp foi aberto para você enviar a mensagem de confirmação.
          </p>
          <a
            href={lastSubmittedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded bg-[#25D366] text-black font-semibold text-xs uppercase tracking-wider hover:brightness-105 transition-all cursor-pointer"
          >
            <PremiumIcon name="whatsapp" size={15} />
            <span>Reabrir WhatsApp</span>
          </a>
        </div>
      )}

      <form onSubmit={handleBookingSubmit} className="space-y-6">
        {/* Step 1: Services Selection */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0F0F12] border border-zinc-800/90">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#C5A059] font-bold">01.</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                Serviços Selecionados
              </span>
            </div>
            {effectiveServices.length > 0 && onClearServices && (
              <button
                type="button"
                onClick={onClearServices}
                className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          {effectiveServices.length === 0 ? (
            <div className="py-4 px-3 border border-dashed border-zinc-800 rounded-lg text-center bg-black/30">
              <p className="text-xs text-zinc-400">
                Nenhum serviço selecionado ainda. Escolha no menu acima ou selecione abaixo:
              </p>
              <select
                onChange={(e) => {
                  const s = activeServices.find(srv => srv.id === e.target.value);
                  if (s && onToggleService) onToggleService(s);
                  else if (s && onSelectService) onSelectService(s);
                }}
                className="mt-3 w-full bg-[#16161A] border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-[#C5A059]"
                defaultValue=""
              >
                <option value="" disabled>Selecione um serviço...</option>
                {activeServices.map(srv => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name} — R$ {srv.price.toFixed(2).replace('.', ',')} ({srv.duration} min)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {effectiveServices.map((srv) => (
                  <span
                    key={srv.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700/80 text-xs text-zinc-200"
                  >
                    <span className="font-medium">{srv.name}</span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      R$ {srv.price.toFixed(2).replace('.', ',')}
                    </span>
                    {onToggleService && (
                      <button
                        type="button"
                        onClick={() => onToggleService(srv)}
                        aria-label={`Remover ${srv.name}`}
                        className="text-zinc-500 hover:text-red-400 ml-0.5 cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {/* Quick Add Another Service */}
              {onToggleService && activeServices.some(s => !effectiveServices.some(es => es.id === s.id)) && (
                <div className="pt-1">
                  <select
                    onChange={(e) => {
                      const s = activeServices.find(srv => srv.id === e.target.value);
                      if (s) onToggleService(s);
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="w-full bg-[#141418] border border-zinc-800 rounded-lg px-3 py-2 text-zinc-400 text-xs focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="" disabled>+ Adicionar outro serviço...</option>
                    {activeServices
                      .filter(s => !effectiveServices.some(es => es.id === s.id))
                      .map(srv => (
                        <option key={srv.id} value={srv.id}>
                          {srv.name} — R$ {srv.price.toFixed(2).replace('.', ',')} ({srv.duration} min)
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Total Calculation Display */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-zinc-500" />
                  <span>Duração: <strong className="text-white font-medium">{totalDuration} min</strong></span>
                </span>
                <span>
                  Total: <strong className="text-[#E5CA85] text-sm font-mono font-semibold">R$ {totalPrice.toFixed(2).replace('.', ',')}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Date Picker */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0F0F12] border border-zinc-800/90">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-mono text-[#C5A059] font-bold">02.</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Escolha a Data
            </span>
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
              className="w-full bg-[#16161A] border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-[#C5A059] transition-colors [color-scheme:dark] cursor-pointer"
              required
            />
          </div>

          {isSundaySelected ? (
            <div className="mt-3 p-3 rounded bg-red-950/60 border border-red-800/50 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-red-400" />
              <span>A barbearia está fechada aos domingos. Selecione de segunda a sábado.</span>
            </div>
          ) : (
            <p className="text-[11px] text-zinc-500 mt-2">
              Segunda a Sábado: 08:00 às 19:30 • Domingo fechado.
            </p>
          )}
        </div>

        {/* Step 3: Slots Grid */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0F0F12] border border-zinc-800/90">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#C5A059] font-bold">03.</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                Horários Disponíveis
              </span>
            </div>
            {selectedDate && (
              <span className="text-[11px] font-mono text-[#C5A059]">
                {selectedDate.split('-').reverse().join('/')}
              </span>
            )}
          </div>

          {!selectedDate ? (
            <div className="py-6 px-4 rounded-lg bg-black/30 border border-zinc-800/80 text-center text-xs text-zinc-500">
              Selecione uma data no passo anterior para visualizar os horários.
            </div>
          ) : effectiveServices.length === 0 ? (
            <div className="py-6 px-4 rounded-lg bg-black/30 border border-zinc-800/80 text-center text-xs text-zinc-500">
              Selecione pelo menos um serviço para calcular a duração e os horários.
            </div>
          ) : isSundaySelected ? (
            <div className="py-6 px-4 rounded-lg bg-black/30 border border-zinc-800/80 text-center text-xs text-zinc-500">
              Barbearia fechada aos domingos. Selecione outro dia.
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                {availableSlots.map((slot) => {
                  const isSelected = selectedTime === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      title={slot.reason || (slot.available ? 'Disponível' : 'Indisponível')}
                      className={`py-2.5 px-2 rounded text-xs font-mono font-medium transition-all relative flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'bg-[#C5A059] text-black font-bold shadow-sm'
                          : slot.available
                          ? 'bg-[#18181D] border border-zinc-700/80 text-zinc-200 hover:border-zinc-500 hover:text-white'
                          : 'bg-zinc-950/60 border border-zinc-900 text-zinc-600 line-through opacity-35 cursor-not-allowed'
                      }`}
                    >
                      <span>{slot.formatted}</span>
                    </button>
                  );
                })}
              </div>

              {availableSlots.length > 0 && availableSlots.every(s => !s.available) && (
                <p className="text-[11px] text-zinc-400 text-center mt-3 leading-relaxed">
                  Não há mais horários disponíveis para hoje. Por favor, escolha outra data.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Step 4: Customer Details */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0F0F12] border border-zinc-800/90 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-[#C5A059] font-bold">04.</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Seus Dados
            </span>
          </div>

          <div>
            <label className="block text-xs text-zinc-300 font-medium mb-1.5">
              Nome Completo
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: João da Silva"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-[#16161A] border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-[#C5A059] pl-10"
                required
              />
              <User size={15} className="absolute left-3.5 top-3 text-zinc-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-300 font-medium mb-1.5">
              WhatsApp com DDD
            </label>
            <div className="relative">
              <input
                type="tel"
                placeholder="(34) 90000-0000"
                value={customerPhone}
                onChange={handlePhoneChange}
                className="w-full bg-[#16161A] border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-[#C5A059] pl-10"
                required
              />
              <Phone size={15} className="absolute left-3.5 top-3 text-zinc-500" />
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {bookingError && (
          <div className="p-3.5 rounded-lg bg-red-950/70 border border-red-800/50 text-red-200 text-xs flex items-start gap-2.5">
            <AlertTriangle size={15} className="shrink-0 text-red-400 mt-0.5" />
            <span>{bookingError}</span>
          </div>
        )}

        {/* Confirmation Button */}
        <button
          type="submit"
          disabled={isSubmitting || !selectedTime || !selectedDate || effectiveServices.length === 0 || isSundaySelected}
          className="w-full py-4 px-6 rounded-lg font-serif font-bold uppercase tracking-[0.16em] text-sm text-black bg-[#C5A059] hover:bg-[#D5B069] active:translate-y-0.5 transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span>Processando Agendamento...</span>
          ) : (
            <>
              <span>Confirmar Agendamento</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </section>
  );
};
