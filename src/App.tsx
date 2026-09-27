import { useState, useEffect } from 'react';
import { LOGO_URL, HEADER_BANNER_URL, WHATSAPP_URL, INSTAGRAM_URL, GOOGLE_REVIEW_URL } from './constants';
import { Carousel } from './components/Carousel';
import { ServicesList } from './components/ServicesList';
import { BookingFlow } from './components/BookingFlow';
import { BottomNav } from './components/BottomNav';
import { AdminDashboard } from './components/AdminDashboard';
import { DirectionsModal } from './components/DirectionsModal';
import { PremiumIcon } from './components/PremiumIcon';
import { Service, CarouselImageItem } from './types';
import { subscribeToServices, subscribeToCarousel } from './services/bookingService';
import { Calendar, ExternalLink, Lock, Star } from 'lucide-react';

export default function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImageItem[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'booking'>('home');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDirectionsOpen, setIsDirectionsOpen] = useState(false);

  // Subscribe to live Firestore services internally
  useEffect(() => {
    const unsubscribe = subscribeToServices((fetchedServices) => {
      setServices(fetchedServices);
      setIsLoadingServices(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to live Firestore Carousel images
  useEffect(() => {
    const unsubscribe = subscribeToCarousel((fetchedImages) => {
      setCarouselImages(fetchedImages);
    });

    return () => unsubscribe();
  }, []);

  // Multiple or single services selection toggle behavior
  const handleToggleServiceFromList = (service: Service) => {
    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.id === service.id);
      if (exists) {
        return prev.filter((s) => s.id !== service.id);
      } else {
        const updated = [...prev, service];
        const bookingEl = document.getElementById('agendamento');
        if (bookingEl) {
          bookingEl.scrollIntoView({ behavior: 'smooth' });
        }
        return updated;
      }
    });
  };

  const handleNavigate = (tab: 'home' | 'services' | 'booking') => {
    setActiveTab(tab);
    if (tab === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'services') {
      const el = document.getElementById('servicos');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'booking') {
      const el = document.getElementById('agendamento');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-100vw min-h-screen bg-[#050505] text-zinc-100 overflow-x-hidden font-sans selection:bg-[#D4AF37] selection:text-black pb-28">
      {/* Background ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-[#D4AF37]/8 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] -left-32 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] -right-32 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-[100px]" />
      </div>

      {/* HEADER SECTION WITH HERO BANNER BACKGROUND */}
      <section className="relative w-full overflow-hidden">
        {/* Background Image Layer (background-image: cover, center) */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center sm:bg-[center_top] pointer-events-none z-0"
          style={{
            backgroundImage: `url('${HEADER_BANNER_URL}')`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover'
          }}
        />

        {/* Gradiente Preto Overlay (Transição suave) */}
        <div
          className="absolute inset-0 pointer-events-none z-1"
          style={{
            background: 'linear-gradient(to top, rgba(5,5,5,1) 0%, rgba(5,5,5,0.92) 20%, rgba(0,0,0,0.72) 45%, rgba(0,0,0,0.30) 75%, rgba(0,0,0,0.08) 100%)'
          }}
        />

        {/* Foreground Content: Logo e Nome da Barbearia centralizados na frente */}
        <div className="relative z-10 w-full max-w-md mx-auto pt-10 sm:pt-14 pb-4 px-4 text-center">
          {/* Logo Oficial Grande e Centralizada */}
          <div className="inline-block relative">
            <img
              src={LOGO_URL}
              alt="Flayder Willis Barbearia Logo"
              className="h-36 sm:h-44 mx-auto object-contain drop-shadow-[0_12px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(212,175,55,0.4)] select-none transition-transform hover:scale-105 duration-300"
            />
          </div>

          {/* Nome da Barbearia e slogan */}
          <div className="mt-3">
            <h1 className="text-lg sm:text-xl font-serif font-bold tracking-[0.22em] text-[#E5C158] uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              FLAYDER WILLIS BARBEARIA
            </h1>
            <p className="text-xs font-medium tracking-widest text-[#F1D77A]/90 mt-1 uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
              "Seu estilo. Seu momento. Sua marca."
            </p>
            <p className="text-xs text-zinc-300 mt-2 font-light drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              Agende seu horário de forma rápida e fácil.
            </p>

            {/* Primary Call to Action Button */}
            <div className="mt-5 max-w-sm mx-auto">
              <button
                onClick={() => handleNavigate('booking')}
                className="w-full py-4 px-6 rounded-2xl font-serif font-bold uppercase tracking-[0.18em] text-sm text-black bg-gradient-to-r from-[#D4AF37] via-[#F1D77A] to-[#B38728] shadow-[0_8px_30px_rgba(212,175,55,0.45)] hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer border border-[#FFF1B8]/40 flex items-center justify-center gap-3"
              >
                <Calendar size={18} className="text-black" />
                <span>AGENDAR HORÁRIO</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* RESTANTE DO BIOSITE (Mantendo layout existente de contatos, carrossel, serviços e agendamento) */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Contact & Social Section: WhatsApp, Instagram, Google Review e Único Botão "COMO CHEGAR" */}
        <section className="px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* 1. ENTRE EM CONTATO CONOSCO NO WHATSAPP (Original Green) */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-[#0D140F] to-[#050505] border border-[#25D366]/35 hover:border-[#25D366] shadow-[0_4px_15px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(37,211,102,0.3)] transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-black/60 border border-[#25D366]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <PremiumIcon name="whatsapp" size={26} />
              </div>
              <div className="text-left overflow-hidden">
                <span className="block text-[10px] text-zinc-400 uppercase tracking-wider">Contato</span>
                <span className="block text-xs font-bold text-white group-hover:text-[#25D366] truncate transition-colors">WhatsApp</span>
              </div>
            </a>

            {/* 2. SIGA NOSSA PÁGINA NO INSTAGRAM (Original Instagram Colors) */}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-[#160D14] to-[#050505] border border-[#E1306C]/35 hover:border-[#E1306C] shadow-[0_4px_15px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(225,48,108,0.3)] transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-black/60 border border-[#E1306C]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <PremiumIcon name="instagram" size={26} />
              </div>
              <div className="text-left overflow-hidden">
                <span className="block text-[10px] text-zinc-400 uppercase tracking-wider">Nosso Perfil</span>
                <span className="block text-xs font-bold text-white group-hover:text-[#E1306C] truncate transition-colors">Instagram</span>
              </div>
            </a>
          </div>

          {/* 3. AVALIE-NOS NO GOOGLE (Original Google Colors: Blue, Red, Yellow, Green) */}
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#121215] via-[#0E0E10] to-[#08080A] border border-blue-500/30 hover:border-blue-400 shadow-[0_4px_15px_rgba(0,0,0,0.7)] hover:shadow-[0_0_25px_rgba(66,133,244,0.25)] transition-all cursor-pointer select-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-black/80 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <PremiumIcon name="google" size={28} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-white group-hover:text-blue-400 transition-colors">
                    AVALIE-NOS NO GOOGLE
                  </span>
                  <div className="flex text-[#FBBC05]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={11} className="fill-[#FBBC05]" />
                    ))}
                  </div>
                </div>
                <span className="block text-[10px] text-zinc-400 mt-0.5">
                  Sua opinião é fundamental para nossa excelência
                </span>
              </div>
            </div>
            <ExternalLink size={16} className="text-zinc-400 group-hover:text-blue-400 shrink-0 mr-1 transition-colors" />
          </a>

          {/* 4. ÚNICO BOTÃO: COMO CHEGAR (Padrão Preto e Dourado com Ícone 3D) */}
          <button
            type="button"
            onClick={() => setIsDirectionsOpen(true)}
            className="w-full group flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#141006] via-[#0D0B04] to-[#171305] border border-[#D4AF37]/50 hover:border-[#F1D77A] shadow-[0_4px_18px_rgba(0,0,0,0.7)] hover:shadow-[0_0_25px_rgba(212,175,55,0.35)] transition-all cursor-pointer select-none active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-black/85 border border-[#D4AF37]/45 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(212,175,55,0.25)]">
                <PremiumIcon name="location" size={26} />
              </div>
              <div className="text-left">
                <span className="block text-xs font-serif font-bold uppercase tracking-wider text-[#F1D77A] group-hover:text-white transition-colors">
                  📍 COMO CHEGAR
                </span>
                <span className="block text-[10px] text-zinc-400 mt-0.5">
                  Rotas rápidas com Google Maps ou Waze
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#F1D77A] group-hover:bg-[#D4AF37] group-hover:text-black transition-all text-[11px] font-bold tracking-wider uppercase">
              <span>ABRIR</span>
            </div>
          </button>
        </section>

        {/* Works Carousel with dynamic Firestore images */}
        <section className="py-2">
          <div className="px-4 text-center mb-1">
            <span className="text-[10px] font-bold tracking-[0.25em] text-[#D4AF37] uppercase">Galeria de Cortes & Estilo</span>
          </div>
          <Carousel images={carouselImages} />
        </section>

        {/* Services Section with Multi-Service Selection */}
        <ServicesList
          services={services}
          selectedServiceIds={selectedServices.map(s => s.id)}
          onToggleService={handleToggleServiceFromList}
          isLoading={isLoadingServices}
        />

        {/* Booking Flow: Synchronized Multiple Services, Date & Slots */}
        <BookingFlow
          services={services}
          selectedServices={selectedServices}
          onToggleService={handleToggleServiceFromList}
          onClearServices={() => setSelectedServices([])}
        />

        {/* Footer with OFFICIAL LOGO */}
        <footer className="text-center px-4 py-10 mt-10 border-t border-[#D4AF37]/20 bg-[#0A0A0A]/80">
          <div className="inline-block mb-3">
            <img
              src={LOGO_URL}
              alt="Flayder Willis Barbearia Logo"
              className="h-20 sm:h-24 mx-auto object-contain drop-shadow-[0_4px_15px_rgba(212,175,55,0.25)] select-none"
            />
          </div>

          <h3 className="font-serif font-bold text-sm tracking-widest text-[#F1D77A] uppercase">
            FLAYDER WILLIS BARBEARIA
          </h3>
          <p className="text-xs text-zinc-400 mt-1 italic">
            "Estilo, cuidado e personalidade."
          </p>

          <div className="flex items-center justify-center gap-5 mt-4 text-xs">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-[#E1306C] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Instagram</span>
              <ExternalLink size={12} />
            </a>
            <span className="text-zinc-700">•</span>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-[#25D366] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>WhatsApp</span>
              <ExternalLink size={12} />
            </a>
            <span className="text-zinc-700">•</span>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-blue-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Google</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="mt-5 text-[11px] text-[#D4AF37]/80 uppercase tracking-widest">
            Agende seu horário online.
          </div>

          {/* PAINEL ADMIN Access Button in Footer */}
          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-center">
            <button
              onClick={() => setIsAdminOpen(true)}
              className="text-[11px] text-zinc-400 hover:text-[#F1D77A] flex items-center gap-2 transition-colors py-2 px-4 rounded-xl border border-white/10 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 cursor-pointer uppercase font-semibold tracking-wider"
            >
              <Lock size={13} className="text-[#D4AF37]" />
              <span>PAINEL ADMIN</span>
            </button>
          </div>
        </footer>

        {/* Modal Elegante: Como Você Quer Chegar? (Google Maps vs Waze) */}
        <DirectionsModal
          isOpen={isDirectionsOpen}
          onClose={() => setIsDirectionsOpen(false)}
        />

        {/* Admin Dashboard Modal with Complete Firebase Auth & CRUD */}
        <AdminDashboard
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          services={services}
          carouselImages={carouselImages}
        />

        {/* Mobile-first bottom navigation bar */}
        <BottomNav
          activeTab={activeTab}
          onNavigate={handleNavigate}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />
      </div>
    </div>
  );
}
