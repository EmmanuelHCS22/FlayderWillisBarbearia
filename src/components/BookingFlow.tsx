import React, { useState, useEffect } from 'react';
import { Service, Appointment } from '../types';
import { BASE_TIME_SLOTS } from '../constants';
import {
  subscribeToAppointmentsForDate,
  computeSlotAvailability,
  bookAppointmentAtomically,
  generateWhatsAppUrl
} from '../services/bookingService';
import { PremiumIcon } from './PremiumIcon';
import { AlertTriangle, User, Phone, ArrowRight, Check, X } from 'lucide-react';

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
  // Determine effective selected services list (combining single and multi props seamlessly)
  const effectiveServices: Service[] = selectedServices.length > 0
    ? selectedServices
    : selectedService
    ? [selectedService]
    : [];

  const totalDuration = effectiveServices.reduce((sum, s) => sum + s.duration, 0) || 45;
  const totalPrice = effectiveServices.reduce((sum, s) => sum + s.price, 0);
  const serviceNamesDisplay = effectiveServices.map(s => s.name).join(' + ');

  // Today formatted as YYYY-MM-DD
  const getTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

  // Compute slot availability: If Sunday or no date, no slots available
  const isSundaySelected = isSunday(selectedDate);
  const availableSlots = (!selectedDate || isSundaySelected)
    ? []
    : computeSlotAvailability(BASE_TIME_SLOTS, appointmentsOnDate, totalDuration);

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

    // Save appointment to Firestore first (Requirement #3)
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
      // 2, 3, 4, 5: Generate WhatsApp URL with prefilled message containing all details
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

      // Abrir o WhatsApp utilizando o link com a mensagem pré-preenchida
      try {
        const opened = window.open(waUrl, '_blank');
        if (!opened) {
          // Em caso de popup blocker, simula clique em tag âncora
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

      // Salva URL para banner informativo não-bloqueante
      setLastSubmittedUrl(waUrl);

      // Auto-remover banner informativo após 10 segundos
      setTimeout(() => {
        setLastSubmittedUrl(null);
      }, 10000);

      // 6, 7, 8, 9, 10: RESETAR COMPLETAMENTE O AGENDAMENTO APÓS A CONFIRMAÇÃO
      // Limpar todos os serviços selecionados
      if (onClearServices) onClearServices();
      if (onSelectService) onSelectService(null);

      // Limpar data e horário (voltar ao estado inicial)
      setSelectedDate('');
      setSelectedTime(null);

      // Limpar dados do cliente (deixar campos vazios)
      setCustomerName('');
      setCustomerPhone('');

      // Limpar erros e finalizar submissão
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
    <section id="agendamento" className="w-full max-w-md mx-auto px-4 py-8 scroll-mt-14">
      <div className="text-center mb-6">
        <span className="text-[11px] font-bold tracking-[0.25em] text-[#D4AF37] uppercase">
          Reserva Rápida
        </span>
        <h2 className="text-2xl font-serif tracking-wide text-white uppercase font-semibold mt-1">
          Agendar Horário
        </h2>
        <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-2" />
        <p className="text-xs text-zinc-400 mt-2">
          Escolha os serviços, a data e selecione o melhor horário para você.
        </p>
      </div>

      {/* Banner de sucesso pós-agendamento (não-bloqueante, desaparece ou pode ser fechado) */}
      {lastSubmittedUrl && (
        <div className="mb-5 p-4 rounded-2xl bg-[#0e1711] border border-emerald-500/50 text-emerald-200 text-xs shadow-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-white text-xs uppercase tracking-wider">
              <Check size={16} className="text-emerald-400 shrink-0" />
              <span>Agendamento salvo com sucesso!</span>
            </div>
            <button
              type="button"
              onClick={() => setLastSubmittedUrl(null)}
              className="text-zinc-400 hover:text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-[11px] text-zinc-300">
            O WhatsApp foi aberto com os dados do seu agendamento preenchidos. Basta tocar em <strong>ENVIAR</strong> para concluir!
          </p>
          <a
            href={lastSubmittedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#25D366] text-black font-bold text-xs uppercase tracking-wider hover:brightness-105 transition-all shadow-md cursor-pointer no-underline"
          >
            <PremiumIcon name="whatsapp" size={16} />
            <span>Abrir WhatsApp Novamente</span>
          </a>
        </div>
      )}

      <form onSubmit={handleBookingSubmit} className="space-y-5">
        {/* Step 1: Multiple Services Selection Badge / Dropdown */}
        <div className="bg-[#0A0A0A] border border-[#D4AF37]/25 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-black text-xs flex items-center justify-center font-bold">1</span>
              <span>Serviços Selecionados</span>
            </div>
            {effectiveServices.length > 0 && onClearServices && (
              <button
                type="button"
                onClick={onClearServices}
                className="text-[11px] text-zinc-400 hover:text-red-400 cursor-pointer"
              >
                Limpar seleção
              </button>
            )}
          </div>

          {effectiveServices.length === 0 ? (
            <div className="text-center py-3 px-2 border border-dashed border-zinc-800 rounded-xl bg-black/40">
              <p className="text-xs text-zinc-400">
                Nenhum serviço selecionado ainda. Toque na lista acima ou escolha abaixo:
              </p>
              <select
                onChange={(e) => {
                  const s = activeServices.find(srv => srv.id === e.target.value);
                  if (s && onToggleService) onToggleService(s);
                  else if (s && onSelectService) onSelectService(s);
                }}
                className="mt-2.5 w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-white text-xs"
                defaultValue=""
              >
                <option value="" disabled>Escolha um serviço...</option>
                {activeServices.map(srv => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name} — R$ {srv.price.toFixed(2).replace('.', ',')} ({srv.duration} min)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {effectiveServices.map((srv) => (
                  <span
                    key={srv.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-xs font-semibold text-[#F1D77A]"
                  >
                    <span>{srv.name}</span>
                    <span className="text-[10px] text-zinc-400">({srv.duration}m • R${srv.price})</span>
                    {onToggleService && (
                      <button
                        type="button"
                        onClick={() => onToggleService(srv)}
                        className="hover:text-red-400 ml-0.5 cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {/* Add more service quick selector */}
              {onToggleService && (
                <div className="pt-2 flex items-center gap-2">
                  <select
                    onChange={(e) => {
                      const s = activeServices.find(srv => srv.id === e.target.value);
                      if (s) onToggleService(s);
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="flex-1 bg-[#121212] border border-white/10 rounded-xl px-3 py-1.5 text-zinc-300 text-xs focus:border-[#D4AF37]"
                  >
                    <option value="" disabled>+ Adicionar outro serviço...</option>
                    {activeServices.filter(s => !effectiveServices.some(es => es.id === s.id)).map(srv => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name} — R$ {srv.price.toFixed(2).replace('.', ',')} ({srv.duration} min)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Total Calculation Display */}
              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs px-1">
                <span>Duração Total: <strong className="text-white">{totalDuration} minutos</strong></span>
                <span>Valor Total: <strong className="text-[#F1D77A] text-sm">R$ {totalPrice.toFixed(2).replace('.', ',')}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Date Picker (Sunday Closed Validation) */}
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
              className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-[#F1D77A] transition-colors [color-scheme:dark] cursor-pointer"
              required
            />
          </div>

          {isSundaySelected ? (
            <div className="mt-2.5 p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-red-400" />
              <span>A barbearia está fechada aos domingos. Selecione de segunda a sábado.</span>
            </div>
          ) : (
            <p className="text-[11px] text-zinc-400 mt-2">
              Funcionamento: Segunda a Sábado das 08:00 às 19:30. Domingo fechado.
            </p>
          )}
        </div>

        {/* Step 3: Slots Grid */}
        <div className="bg-[#0A0A0A] border border-[#D4AF37]/25 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-black text-xs flex items-center justify-center font-bold">3</span>
              <span>Horários Disponíveis</span>
            </div>
            {selectedDate && (
              <div className="text-[11px] text-[#F1D77A] font-medium">
                Data: {selectedDate.split('-').reverse().join('/')}
              </div>
            )}
          </div>

          {!selectedDate ? (
            <div className="p-4 rounded-xl bg-black/60 border border-white/5 text-center text-xs text-zinc-400">
              Selecione uma data no passo 2 para visualizar os horários disponíveis.
            </div>
          ) : effectiveServices.length === 0 ? (
            <div className="p-4 rounded-xl bg-black/60 border border-white/5 text-center text-xs text-zinc-400">
              Selecione primeiro pelo menos um serviço para calcular a duração e visualizar os horários.
            </div>
          ) : isSundaySelected ? (
            <div className="p-4 rounded-xl bg-black/60 border border-white/5 text-center text-xs text-zinc-400">
              Barbearia fechada aos domingos. Escolha outro dia da semana.
            </div>
          ) : (
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
                    className={`py-2.5 px-1 rounded-xl text-xs font-semibold transition-all relative flex flex-col items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#F1D77A] text-black shadow-[0_0_15px_rgba(212,175,55,0.7)] font-bold scale-[1.02]'
                        : slot.available
                        ? 'bg-black border border-[#D4AF37]/40 text-zinc-200 hover:border-[#F1D77A] hover:bg-[#151515]'
                        : 'bg-zinc-950 border border-zinc-800/60 text-zinc-600 line-through opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span>{slot.formatted}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 4: Customer Details & Confirmation */}
        <div className="bg-[#0A0A0A] border border-[#D4AF37]/25 rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-zinc-200">
            <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-black text-xs flex items-center justify-center font-bold">4</span>
            <span>Seus Dados</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Nome Completo
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: João da Silva"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F1D77A] pl-10"
                required
              />
              <User size={16} className="absolute left-3.5 top-3.5 text-zinc-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              WhatsApp com DDD
            </label>
            <div className="relative">
              <input
                type="tel"
                placeholder="(34) 90000-0000"
                value={customerPhone}
                onChange={handlePhoneChange}
                className="w-full bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F1D77A] pl-10"
                required
              />
              <Phone size={16} className="absolute left-3.5 top-3.5 text-zinc-400" />
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {bookingError && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5">
            <AlertTriangle size={16} className="shrink-0 text-red-400 mt-0.5" />
            <span>{bookingError}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !selectedTime || !selectedDate || effectiveServices.length === 0 || isSundaySelected}
          className="w-full py-4 px-6 rounded-2xl font-serif font-bold uppercase tracking-[0.16em] text-sm text-black bg-gradient-to-r from-[#D4AF37] via-[#F1D77A] to-[#B38728] shadow-[0_6px_25px_rgba(212,175,55,0.4)] hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer border border-[#FFF1B8]/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span>SALVANDO AGENDAMENTO...</span>
          ) : (
            <>
              <span>CONFIRMAR AGENDAMENTO</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </section>
  );
};

