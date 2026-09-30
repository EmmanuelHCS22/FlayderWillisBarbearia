import React, { useState, useEffect, useMemo } from 'react';
import { Service, Appointment, Barber } from '../types';
import { BASE_TIME_SLOTS, DEFAULT_BARBERS } from '../constants';
import {
  subscribeToAppointmentsForDate,
  computeSlotAvailability,
  bookAppointmentAtomically,
  generateWhatsAppUrl,
  getEstablishmentNow,
  timeStringToMinutes,
  formatDuration,
  formatDate
} from '../services/bookingService';
import { PremiumIcon } from './PremiumIcon';
import {
  AlertTriangle,
  User,
  Phone,
  ArrowRight,
  Check,
  X,
  Clock,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Scissors
} from 'lucide-react';

interface BookingFlowProps {
  services: Service[];
  selectedService?: Service | null;
  selectedServices?: Service[];
  onSelectService?: (service: Service | null) => void;
  onToggleService?: (service: Service) => void;
  onClearServices?: () => void;
  initialBarber?: Barber | null;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({
  services,
  selectedService,
  selectedServices = [],
  onSelectService,
  onToggleService,
  onClearServices,
  initialBarber = null
}) => {
  // Determine effective selected services list
  const effectiveServices: Service[] = selectedServices.length > 0
    ? selectedServices
    : selectedService
    ? [selectedService]
    : [];

  const totalDuration = effectiveServices.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = effectiveServices.reduce((sum, s) => sum + s.price, 0);
  const serviceNamesDisplay = effectiveServices.map(s => s.name).join(' + ');

  // Professional / Barber state (default: 'any' = "Sem preferência")
  const [selectedBarberId, setSelectedBarberId] = useState<string>('any');
  const [selectedBarberName, setSelectedBarberName] = useState<string>('Sem preferência');

  useEffect(() => {
    if (initialBarber) {
      setSelectedBarberId(initialBarber.id);
      setSelectedBarberName(initialBarber.name);
    }
  }, [initialBarber]);

  // Dynamic establishment current time & date (America/Sao_Paulo)
  const [establishmentNow, setEstablishmentNow] = useState(() => getEstablishmentNow());

  useEffect(() => {
    const updateTime = () => {
      setEstablishmentNow(getEstablishmentNow());
    };
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Today formatted as YYYY-MM-DD
  const getTodayString = () => establishmentNow.dateString;

  const isSunday = (dateStr: string) => {
    if (!dateStr) return false;
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.getDay() === 0;
  };

  // Generate the next 14 open working days (Mon-Sat, skipping Sundays)
  const upcomingWorkingDays = useMemo(() => {
    const days: Array<{ dateStr: string; label: string; weekday: string }> = [];
    const [y, m, d] = establishmentNow.dateString.split('-').map(Number);
    const cursor = new Date(y, m - 1, d, 12, 0, 0);

    const weekdayShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    let count = 0;
    while (count < 14) {
      if (cursor.getDay() !== 0) { // Skip Sunday
        const curY = cursor.getFullYear();
        const curM = String(cursor.getMonth() + 1).padStart(2, '0');
        const curD = String(cursor.getDate()).padStart(2, '0');
        const curDateStr = `${curY}-${curM}-${curD}`;

        let label = '';
        if (curDateStr === establishmentNow.dateString) {
          label = `Hoje (${curD}/${curM})`;
        } else {
          label = `${curD}/${curM}`;
        }

        days.push({
          dateStr: curDateStr,
          label,
          weekday: weekdayShort[cursor.getDay()]
        });
        count++;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [establishmentNow.dateString]);

  // Form states
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [lgpdAccepted, setLgpdAccepted] = useState<boolean>(false);

  // Live state from appointments
  const [appointmentsOnDate, setAppointmentsOnDate] = useState<Appointment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Completed booking data for Success Screen
  const [confirmedBooking, setConfirmedBooking] = useState<{
    customerName: string;
    customerPhone: string;
    services: Service[];
    serviceNames: string;
    totalPrice: number;
    totalDuration: number;
    date: string;
    startTime: string;
    endTime: string;
    barberName: string;
    whatsappUrl: string;
  } | null>(null);

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

  // Compute slot availability based on sum of durations, closing time (19:30) and barber
  const isSundaySelected = isSunday(selectedDate);
  const availableSlots = (!selectedDate || isSundaySelected || effectiveServices.length === 0)
    ? []
    : computeSlotAvailability(
        BASE_TIME_SLOTS,
        appointmentsOnDate,
        totalDuration,
        selectedDate,
        establishmentNow.currentMinutes,
        establishmentNow.dateString,
        selectedBarberId
      );

  // Auto-clear selectedTime if it becomes unavailable
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
    if (!lgpdAccepted) {
      setBookingError('É necessário concordar com o uso de seus dados para confirmação do agendamento.');
      return;
    }

    setIsSubmitting(true);

    const bookingPayload = {
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
      barberId: selectedBarberId,
      barberName: selectedBarberName,
      date: selectedDate,
      startTime: selectedTime,
    };

    const result = await bookAppointmentAtomically(bookingPayload);

    if (result.success && result.appointmentId) {
      const waUrl = generateWhatsAppUrl(bookingPayload);

      // Save confirmed details for the success screen
      setConfirmedBooking({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        services: effectiveServices,
        serviceNames: serviceNamesDisplay,
        totalPrice,
        totalDuration,
        date: selectedDate,
        startTime: selectedTime,
        endTime: '',
        barberName: selectedBarberName,
        whatsappUrl: waUrl
      });

      // Reset form fields
      if (onClearServices) onClearServices();
      if (onSelectService) onSelectService(null);
      setSelectedDate('');
      setSelectedTime(null);
      setCustomerName('');
      setCustomerPhone('');
      setLgpdAccepted(false);
      setBookingError(null);
      setIsSubmitting(false);

      const el = document.getElementById('agendamento');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setIsSubmitting(false);
      setBookingError(result.error || 'Esse horário acabou de ser reservado. Escolha outro horário disponível.');
    }
  };

  const handleResetForNewBooking = () => {
    setConfirmedBooking(null);
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
          Selecione o profissional, a data e o horário para o seu atendimento.
        </p>
      </div>

      {/* 12. TELA DE SUCESSO COM RESUMO E BOTÃO DE WHATSAPP */}
      {confirmedBooking ? (
        <div className="p-5 sm:p-7 rounded-2xl bg-[#0F1411] border-2 border-emerald-500/50 text-zinc-100 shadow-2xl space-y-5 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} className="text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase block">
                Agendamento Confirmado
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                Tudo pronto para sua visita!
              </h3>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Olá, <strong className="text-white">{confirmedBooking.customerName}</strong>! Seu horário foi reservado em nosso sistema.
            Clique no botão abaixo para avisar a barbearia pelo WhatsApp e confirmar seu atendimento.
          </p>

          {/* Resumo do Agendamento */}
          <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/30 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-zinc-400">Cliente:</span>
              <strong className="text-white font-medium">{confirmedBooking.customerName}</strong>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-zinc-400">Profissional:</span>
              <strong className="text-[#E5CA85] font-medium">{confirmedBooking.barberName}</strong>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-zinc-400">Data:</span>
              <strong className="text-white font-mono">{formatDate(confirmedBooking.date)}</strong>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-zinc-400">Horário:</span>
              <strong className="text-emerald-400 font-mono text-sm">{confirmedBooking.startTime}</strong>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-zinc-400">Duração Estimada:</span>
              <strong className="text-zinc-200">{formatDuration(confirmedBooking.totalDuration)}</strong>
            </div>

            <div>
              <span className="text-zinc-400 block mb-1">Serviço(s):</span>
              <div className="pl-2 space-y-1">
                {confirmedBooking.services.map(s => (
                  <div key={s.id} className="flex justify-between text-[11px] text-zinc-300">
                    <span>• {s.name}</span>
                    <span className="font-mono text-zinc-400">R$ {s.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-sm">
              <span className="text-white font-semibold">Valor Total:</span>
              <strong className="text-[#E5CA85] font-mono text-base font-bold">
                R$ {confirmedBooking.totalPrice.toFixed(2).replace('.', ',')}
              </strong>
            </div>
          </div>

          {/* Botão Avisar pelo WhatsApp com mensagem pronta */}
          <div className="space-y-2 pt-1">
            <a
              href={confirmedBooking.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-6 rounded-lg bg-[#25D366] hover:bg-[#20ba59] active:translate-y-0.5 text-black font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-lg cursor-pointer text-center font-serif"
            >
              <PremiumIcon name="whatsapp" size={18} />
              <span>Avisar Barbearia pelo WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleResetForNewBooking}
              className="w-full py-2.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer text-center"
            >
              Fazer outro agendamento
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleBookingSubmit} className="space-y-6">
          {/* Step 1: Services Selection & Real-Time Summary (Requirements 4, 6) */}
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
                  Limpar todos
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
                    e.target.value = '';
                  }}
                  className="mt-3 w-full bg-[#16161A] border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-[#C5A059] cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>Selecione um serviço para começar...</option>
                  {activeServices.map(srv => (
                    <option key={srv.id} value={srv.id}>
                      {srv.name} — R$ {srv.price.toFixed(2).replace('.', ',')} ({srv.duration} min)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Lista de Serviços com Remoção Rápida */}
                <div className="flex flex-wrap gap-2">
                  {effectiveServices.map((srv) => (
                    <span
                      key={srv.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 text-xs text-zinc-200"
                    >
                      <span className="font-medium">{srv.name}</span>
                      <span className="text-[11px] text-[#E5CA85] font-mono">
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

                {/* Adicionar outro serviço */}
                {onToggleService && activeServices.some(s => !effectiveServices.some(es => es.id === s.id)) && (
                  <div className="pt-1">
                    <select
                      onChange={(e) => {
                        const s = activeServices.find(srv => srv.id === e.target.value);
                        if (s) onToggleService(s);
                        e.target.value = '';
                      }}
                      defaultValue=""
                      className="w-full bg-[#141418] border border-zinc-800 rounded-lg px-3 py-2 text-zinc-400 text-xs focus:outline-none focus:border-[#C5A059] cursor-pointer"
                    >
                      <option value="" disabled>+ Adicionar mais um serviço...</option>
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

                {/* 6. RESUMO TOTAL E DURAÇÃO ATUALIZADO EM TEMPO REAL */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs bg-black/40 p-3 rounded-lg">
                  <span className="flex items-center gap-1.5 text-zinc-300">
                    <Clock size={14} className="text-[#C5A059]" />
                    <span>Duração Total: <strong className="text-white font-medium">{formatDuration(totalDuration)}</strong></span>
                  </span>
                  <span>
                    Total: <strong className="text-[#E5CA85] text-sm font-mono font-bold">R$ {totalPrice.toFixed(2).replace('.', ',')}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Escolher Profissional (Requirement 8) */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#0F0F12] border border-zinc-800/90">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#C5A059] font-bold">02.</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Escolher Profissional
                </span>
              </div>
              <span className="text-[11px] text-[#C5A059] font-medium">
                {selectedBarberName}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Opção Sem preferência */}
              <button
                type="button"
                onClick={() => {
                  setSelectedBarberId('any');
                  setSelectedBarberName('Sem preferência');
                }}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedBarberId === 'any'
                    ? 'border-[#C5A059] bg-[#C5A059]/10 text-white shadow-sm'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#C5A059]">
                    <Scissors size={13} />
                  </div>
                  <span className="text-xs font-medium block text-zinc-200">Qualquer</span>
                </div>
                <span className="text-[10px] text-zinc-400">Sem preferência</span>
              </button>

              {/* Barbeiros da Equipe */}
              {DEFAULT_BARBERS.map((barber) => {
                const isSelected = selectedBarberId === barber.id;
                return (
                  <button
                    key={barber.id}
                    type="button"
                    onClick={() => {
                      setSelectedBarberId(barber.id);
                      setSelectedBarberName(barber.name);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#C5A059] bg-[#C5A059]/10 text-white shadow-sm'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <img
                        src={barber.imageUrl}
                        alt={barber.name}
                        className="w-7 h-7 rounded-full object-cover border border-zinc-700 shrink-0"
                      />
                      <span className="text-xs font-medium block text-zinc-200 truncate">
                        {barber.name.split(' ')[0]}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 truncate block">
                      {barber.role.split('&')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Escolha a Data (Requirement 2) */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#0F0F12] border border-zinc-800/90">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#C5A059] font-bold">03.</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Escolha a Data
                </span>
              </div>
              <span className="text-[11px] text-zinc-400">
                {selectedDate ? formatDate(selectedDate) : 'Selecione uma data'}
              </span>
            </div>

            {/* Chips Rápidos de Dias da Semana (Apenas Segunda a Sábado, Domingo oculto) */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {upcomingWorkingDays.map((day) => {
                const isSelected = selectedDate === day.dateStr;
                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(day.dateStr);
                      setSelectedTime(null);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs whitespace-nowrap cursor-pointer transition-all flex flex-col items-center min-w-[70px] ${
                      isSelected
                        ? 'bg-[#C5A059] text-black font-bold shadow-sm'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <span className="text-[10px] opacity-80 uppercase tracking-wider">{day.weekday}</span>
                    <span className="text-xs font-mono font-semibold">{day.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Seletor com Placeholder Explícito "Selecione uma data" */}
            <div className="mt-3 relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="date"
                    min={getTodayString()}
                    value={selectedDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (isSunday(val)) {
                        setBookingError('A barbearia está fechada aos domingos. Selecione uma data de segunda a sábado.');
                        setSelectedDate('');
                        setSelectedTime(null);
                        return;
                      }
                      setBookingError(null);
                      setSelectedDate(val);
                      setSelectedTime(null);
                    }}
                    className="w-full bg-[#16161A] border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-zinc-100 text-xs sm:text-sm focus:outline-none focus:border-[#C5A059] transition-colors [color-scheme:dark] cursor-pointer"
                  />
                  {!selectedDate && (
                    <span className="absolute left-3.5 top-3 pointer-events-none text-zinc-500 text-xs sm:text-sm flex items-center gap-2 bg-[#16161A] pr-3">
                      <Calendar size={14} className="text-[#C5A059]" />
                      <span>Selecione uma data</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isSundaySelected ? (
              <div className="mt-3 p-3 rounded bg-red-950/60 border border-red-800/50 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-red-400" />
                <span>A barbearia está fechada aos domingos. Selecione de segunda a sábado.</span>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-500 mt-2">
                Funcionamento: Segunda a Sábado das 08:00 às 19:30 • Domingo Fechado.
              </p>
            )}
          </div>

          {/* Step 4: Horários Disponíveis (Requirement 7) */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#0F0F12] border border-zinc-800/90">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#C5A059] font-bold">04.</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Horários Disponíveis
                </span>
              </div>
              {selectedDate && (
                <span className="text-[11px] font-mono text-[#C5A059]">
                  {formatDate(selectedDate)}
                </span>
              )}
            </div>

            {!selectedDate ? (
              <div className="py-6 px-4 rounded-lg bg-black/30 border border-zinc-800/80 text-center text-xs text-zinc-500">
                Selecione uma data no passo anterior para visualizar os horários disponíveis.
              </div>
            ) : effectiveServices.length === 0 ? (
              <div className="py-6 px-4 rounded-lg bg-black/30 border border-zinc-800/80 text-center text-xs text-zinc-500">
                Selecione pelo menos um serviço para calcular a duração contínua e os horários.
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
                        className={`py-2.5 px-2 rounded-lg text-xs font-mono font-medium transition-all relative flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-[#C5A059] text-black font-bold shadow-sm scale-105'
                            : slot.available
                            ? 'bg-[#18181D] border border-zinc-700/80 text-zinc-200 hover:border-[#C5A059] hover:text-white'
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
                    Não há mais horários disponíveis com tempo contínuo suficiente para este dia. Por favor, escolha outra data.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Step 5: Customer Details & LGPD (Requirement 11) */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#0F0F12] border border-zinc-800/90 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono text-[#C5A059] font-bold">05.</span>
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

            {/* 11. AVISO DE DADOS (LGPD) & CHECKBOX OBRIGATÓRIO */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-2">
              <p className="text-[11px] text-zinc-400 leading-relaxed flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#C5A059] shrink-0" />
                <span>Usamos seu nome e telefone apenas para confirmar seu agendamento.</span>
              </p>

              <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={lgpdAccepted}
                  onChange={(e) => setLgpdAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-[#16161A] text-[#C5A059] focus:ring-0 focus:outline-none cursor-pointer accent-[#C5A059]"
                  required
                />
                <span className="text-[11px] text-zinc-300">
                  Estou ciente e concordo com o uso dos meus dados exclusivamente para o agendamento.
                </span>
              </label>
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
            disabled={
              isSubmitting ||
              !selectedTime ||
              !selectedDate ||
              effectiveServices.length === 0 ||
              isSundaySelected ||
              !lgpdAccepted
            }
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
      )}
    </section>
  );
};
