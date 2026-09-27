import { useState, useEffect } from 'react';
import { LOGO_URL, HEADER_BANNER_URL, WHATSAPP_URL, INSTAGRAM_URL, GOOGLE_REVIEW_URL } from './constants';
import { Carousel } from './components/Carousel';
import { ServicesList } from './components/ServicesList';
import { BookingFlow } from './components/BookingFlow';
import { BottomNav } from './components/BottomNav';
import { AdminDashboard } from './components/AdminDashboard';
import { PremiumIcon } from './components/PremiumIcon';
import { Service, CarouselImageItem } from './types';
import { subscribeToServices, subscribeToCarousel } from './services/bookingService';
import { Calendar, ExternalLink, Lock, Star } from 'lucide-react';

export default function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImageItem[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'booking'>('home');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

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

  // Selection toggle behavior: click once selects, click again deselects
  const handleToggleServiceFromList = (service: Service) => {
    if (selectedService?.id === service.id) {
      setSelectedService(null);
    } else {
      setSelectedService(service);
      const bookingEl = document.getElementById('agendamento');
      if (bookingEl) {
        bookingEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
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

        {/* Gradiente Preto Overlay (Transição suave: mais visível no topo, preto 100% na base) */}
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
        {/* Contact & Social Section: WhatsApp, Instagram and Google Review in Original Brand Colors */}
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
        </section>

        {/* Works Carousel with dynamic Firestore images */}
        <section className="py-2">
          <div className="px-4 text-center mb-1">
            <span className="text-[10px] font-bold tracking-[0.25em] text-[#D4AF37] uppercase">Galeria de Cortes & Estilo</span>
          </div>
          <Carousel images={carouselImages} />
        </section>

        {/* Services Section */}
        <ServicesList
          services={services}
          selectedServiceId={selectedService?.id || null}
          onToggleService={handleToggleServiceFromList}
          isLoading={isLoadingServices}
        />

        {/* Booking Flow: Synchronized Date & Slots */}
        <BookingFlow
          services={services}
          selectedService={selectedService}
          onSelectService={(srv) => setSelectedService(srv)}
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

          {/* Admin area button */}
          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-center">
            <button
              onClick={() => setIsAdminOpen(true)}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 flex items-center gap-1.5 transition-colors py-1.5 px-3 rounded-full hover:bg-white/5 cursor-pointer"
            >
              <Lock size={11} />
              <span>Painel Administrativo</span>
            </button>
          </div>
        </footer>

        {/* Admin Dashboard Modal with Firebase Auth */}
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
