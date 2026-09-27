import { useState, useEffect } from 'react';
import { LOGO_URL, WHATSAPP_URL, INSTAGRAM_URL } from './constants';
import { Carousel } from './components/Carousel';
import { ServicesList } from './components/ServicesList';
import { BookingFlow } from './components/BookingFlow';
import { BottomNav } from './components/BottomNav';
import { AdminDashboard } from './components/AdminDashboard';
import { PremiumIcon } from './components/PremiumIcon';
import { Service } from './types';
import { subscribeToServices } from './services/bookingService';
import { Calendar, Shield, ExternalLink, Lock } from 'lucide-react';

export default function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'booking'>('home');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Subscribe to live Firestore services
  useEffect(() => {
    const unsubscribe = subscribeToServices((fetchedServices) => {
      setServices(fetchedServices);
      setIsLoadingServices(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSelectServiceFromList = (service: Service) => {
    setSelectedService(service);
    setActiveTab('booking');
    const bookingEl = document.getElementById('agendamento');
    if (bookingEl) {
      bookingEl.scrollIntoView({ behavior: 'smooth' });
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
    <div className="w-full max-w-100vw min-h-screen bg-[#050505] text-zinc-100 overflow-x-hidden font-sans selection:bg-[#D4AF37] selection:text-black pb-24">
      {/* Background ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#D4AF37]/8 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] -left-32 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] -right-32 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Top Header & Logo */}
        <header className="pt-8 pb-4 px-4 text-center">
          <div className="inline-block relative">
            <img
              src={LOGO_URL}
              alt="Flayder Willis Barbearia Logo"
              className="h-28 sm:h-32 mx-auto object-contain drop-shadow-[0_8px_25px_rgba(212,175,55,0.25)] select-none"
            />
          </div>
        </header>

        {/* Hero Section */}
        <section className="text-center px-6 py-2">
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-[#FFF5C0] via-[#D4AF37] to-[#997722] uppercase">
            FLAYDER WILLIS BARBEARIA
          </h1>
          <p className="text-xs sm:text-sm font-medium tracking-widest text-[#F1D77A] mt-1.5 uppercase">
            "Seu estilo. Seu momento. Sua marca."
          </p>
          <p className="text-xs text-zinc-400 mt-2 font-light">
            Agende seu horário de forma rápida e fácil.
          </p>

          {/* Primary Call to Action */}
          <div className="mt-5">
            <button
              onClick={() => handleNavigate('booking')}
              className="w-full py-4 px-6 rounded-xl font-serif font-bold uppercase tracking-[0.18em] text-sm text-black bg-gradient-to-r from-[#D4AF37] via-[#F1D77A] to-[#B38728] shadow-[0_6px_25px_rgba(212,175,55,0.4)] hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer border border-[#FFF1B8]/40 flex items-center justify-center gap-3"
            >
              <Calendar size={18} className="text-black" />
              <span>AGENDAR HORÁRIO</span>
            </button>
          </div>
        </section>

        {/* 3D Social Media Buttons */}
        <section className="px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            {/* WhatsApp 3D Link */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-[#0D0D0D] to-[#050505] border border-[#25D366]/40 hover:border-[#25D366] shadow-[0_4px_15px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(37,211,102,0.25)] transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-black/80 border border-[#25D366]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <PremiumIcon name="whatsapp" size={24} />
              </div>
              <div className="text-left overflow-hidden">
                <span className="block text-[10px] text-zinc-400 uppercase tracking-wider">Fale Conosco</span>
                <span className="block text-xs font-bold text-white group-hover:text-[#25D366] truncate transition-colors">WhatsApp</span>
              </div>
            </a>

            {/* Instagram 3D Link */}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-[#0D0D0D] to-[#050505] border border-[#D4AF37]/40 hover:border-[#F1D77A] shadow-[0_4px_15px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(212,175,55,0.25)] transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-black/80 border border-[#D4AF37]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <PremiumIcon name="instagram" size={24} />
              </div>
              <div className="text-left overflow-hidden">
                <span className="block text-[10px] text-zinc-400 uppercase tracking-wider">Siga Nosso Perfil</span>
                <span className="block text-xs font-bold text-white group-hover:text-[#F1D77A] truncate transition-colors">Instagram</span>
              </div>
            </a>
          </div>
        </section>

        {/* Works Carousel */}
        <section className="py-2">
          <div className="px-4 text-center">
            <span className="text-[10px] font-bold tracking-[0.25em] text-[#D4AF37] uppercase">Galeria de Cortes & Estilo</span>
          </div>
          <Carousel />
        </section>

        {/* Services Section */}
        <ServicesList
          services={services}
          selectedServiceId={selectedService?.id || null}
          onSelectService={handleSelectServiceFromList}
          isLoading={isLoadingServices}
        />

        {/* Real-time Firebase Booking Flow */}
        <BookingFlow
          services={services}
          initialSelectedService={selectedService}
          onClearService={() => setSelectedService(null)}
        />

        {/* Footer */}
        <footer className="text-center px-4 py-10 mt-10 border-t border-[#D4AF37]/20 bg-[#0A0A0A]/80">
          <div className="w-8 h-8 mx-auto mb-3 opacity-80">
            <PremiumIcon name="scissors" size={32} />
          </div>

          <h3 className="font-serif font-bold text-base tracking-widest text-[#F1D77A] uppercase">
            FLAYDER WILLIS BARBEARIA
          </h3>
          <p className="text-xs text-zinc-400 mt-1 italic">
            "Estilo, cuidado e personalidade."
          </p>

          <div className="flex items-center justify-center gap-6 mt-4 text-xs">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-[#F1D77A] flex items-center gap-1.5 transition-colors"
            >
              <span>Instagram</span>
              <ExternalLink size={12} />
            </a>
            <span className="text-zinc-700">•</span>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
            >
              <span>WhatsApp</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="mt-5 text-[11px] text-[#D4AF37]/80 uppercase tracking-widest">
            Agende seu horário online.
          </div>

          {/* Admin link button for staff */}
          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-center">
            <button
              onClick={() => setIsAdminOpen(true)}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 flex items-center gap-1.5 transition-colors py-1 px-2.5 rounded-full hover:bg-white/5 cursor-pointer"
            >
              <Lock size={11} />
              <span>Acesso Administrativo</span>
            </button>
          </div>
        </footer>

        {/* Admin Dashboard Modal */}
        <AdminDashboard
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
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
