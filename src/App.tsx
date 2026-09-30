import { useState, useEffect } from 'react';
import {
  LOGO_URL,
  HEADER_BANNER_URL,
  WHATSAPP_URL,
  INSTAGRAM_URL,
  GOOGLE_REVIEW_URL,
  BARBERSHOP_ADDRESS
} from './constants';
import { Carousel } from './components/Carousel';
import { ServicesList } from './components/ServicesList';
import { BookingFlow } from './components/BookingFlow';
import { TeamSection } from './components/TeamSection';
import { CourseSection } from './components/CourseSection';
import { GoogleReviewSection } from './components/GoogleReviewSection';
import { LocationSection } from './components/LocationSection';
import { BottomNav } from './components/BottomNav';
import { AdminDashboard } from './components/AdminDashboard';
import { DirectionsModal } from './components/DirectionsModal';
import { Service, CarouselImageItem, Barber } from './types';
import { subscribeToServices, subscribeToCarousel } from './services/bookingService';
import { Calendar, Lock, MapPin, Clock } from 'lucide-react';

export default function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImageItem[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'booking'>('home');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDirectionsOpen, setIsDirectionsOpen] = useState(false);

  // Subscribe to live Firestore services
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

  const handleSelectBarberFromTeam = (barber: Barber) => {
    setSelectedBarber(barber);
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
    <div className="w-full min-h-screen bg-[#09090B] text-zinc-100 font-sans selection:bg-[#C5A059] selection:text-black">
      {/* 1. SEÇÃO INÍCIO COM BOTÃO "AGENDAR HORÁRIO" */}
      <header id="inicio" className="relative w-full overflow-hidden border-b border-zinc-800/80">
        {/* Cinematic Backdrop Image with Dark Editorial Vignette */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center pointer-events-none opacity-40 scale-105"
          style={{
            backgroundImage: `url('${HEADER_BANNER_URL}')`,
            backgroundPosition: 'center 20%'
          }}
        />

        {/* Gradiente escuro fotográfico */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(9,9,11,0.6) 0%, rgba(9,9,11,0.85) 50%, rgba(9,9,11,1) 100%)'
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-xl mx-auto pt-10 sm:pt-14 pb-10 px-4 text-center">
          {/* Logo Oficial */}
          <div className="inline-block relative">
            <img
              src={LOGO_URL}
              alt="Flayder Willis Barbearia Logo"
              className="h-28 sm:h-36 mx-auto object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.85)] select-none transition-transform hover:scale-[1.02] duration-300 animate-logo-entrance"
            />
          </div>

          {/* Nome & Posicionamento */}
          <div className="mt-4">
            <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-[0.2em] text-zinc-100 uppercase">
              Flayder Willis Barbearia
            </h1>

            <p className="text-xs sm:text-sm font-light text-zinc-300 mt-1.5 tracking-wide">
              Precisão no corte. Respeito ao seu estilo.
            </p>

            <div className="flex items-center justify-center gap-3 mt-3 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-[#C5A059]" />
                <span>Luizote de Freitas • Uberlândia</span>
              </span>
              <span className="text-zinc-600">·</span>
              <span className="flex items-center gap-1">
                <Clock size={12} className="text-[#C5A059]" />
                <span>Seg a Sáb 08h–19h30</span>
              </span>
            </div>

            {/* Botão Principal Agendar Horário */}
            <div className="mt-6 max-w-xs mx-auto">
              <button
                onClick={() => handleNavigate('booking')}
                className="w-full py-3.5 px-6 rounded-lg font-serif font-bold uppercase tracking-[0.16em] text-xs sm:text-sm text-black bg-[#C5A059] hover:bg-[#D5B069] active:translate-y-0.5 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2.5"
              >
                <Calendar size={17} />
                <span>Agendar Horário</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER COM PADDING INFERIOR SUFICIENTE (Requirement 3: barra fixa não esconde nada) */}
      <main className="relative z-10 w-full max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto pb-32 sm:pb-36">
        
        {/* 2. SEÇÃO SERVIÇOS */}
        <ServicesList
          services={services}
          selectedServiceIds={selectedServices.map((s) => s.id)}
          onToggleService={handleToggleServiceFromList}
          isLoading={isLoadingServices}
        />

        {/* BLOCO DE AGENDAMENTO (LOGO APÓS OS SERVIÇOS) */}
        <BookingFlow
          services={services}
          selectedServices={selectedServices}
          onToggleService={handleToggleServiceFromList}
          onClearServices={() => setSelectedServices([])}
          initialBarber={selectedBarber}
        />

        {/* 3. GALERIA DE CORTES */}
        <section className="pt-8 pb-4">
          <div className="text-center mb-1 px-4">
            <span className="text-[10px] font-semibold tracking-[0.25em] text-[#C5A059] uppercase">
              Galeria de Cortes
            </span>
          </div>
          <Carousel images={carouselImages} />
        </section>

        {/* 4. NOSSA EQUIPE */}
        <TeamSection onSelectBarberForBooking={handleSelectBarberFromTeam} />

        {/* 5. CURSO */}
        <CourseSection />

        {/* 6. AVALIAÇÃO NO GOOGLE */}
        <GoogleReviewSection />

        {/* 7. LOCALIZAÇÃO (ONDE ESTAMOS) */}
        <LocationSection onOpenDirections={() => setIsDirectionsOpen(true)} />

        {/* FOOTER */}
        <footer className="text-center px-4 pt-12 pb-8 mt-12 border-t border-zinc-800/80">
          <div className="inline-block mb-3">
            <img
              src={LOGO_URL}
              alt="Flayder Willis Barbearia Logo"
              className="h-16 mx-auto object-contain select-none opacity-90"
            />
          </div>

          <h3 className="font-serif font-bold text-sm tracking-[0.18em] text-zinc-200 uppercase">
            Flayder Willis Barbearia
          </h3>

          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {BARBERSHOP_ADDRESS}
          </p>

          <p className="text-[11px] text-zinc-500 mt-1">
            Segunda a Sábado das 08:00 às 19:30 • Domingo Fechado
          </p>

          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-zinc-400">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-200 transition-colors"
            >
              Instagram
            </a>
            <span className="text-zinc-700">·</span>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              WhatsApp
            </a>
            <span className="text-zinc-700">·</span>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-200 transition-colors"
            >
              Google
            </a>
          </div>

          {/* PAINEL ADMIN Access in Footer */}
          <div className="mt-8 pt-4 border-t border-zinc-800/60 flex items-center justify-center">
            <button
              onClick={() => setIsAdminOpen(true)}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors py-1.5 px-3 rounded border border-zinc-800 hover:border-zinc-700 cursor-pointer uppercase tracking-wider font-medium"
            >
              <Lock size={12} className="text-[#C5A059]" />
              <span>Painel Admin</span>
            </button>
          </div>
        </footer>

        {/* Modal: Como Chegar (Google Maps / Waze) */}
        <DirectionsModal
          isOpen={isDirectionsOpen}
          onClose={() => setIsDirectionsOpen(false)}
        />

        {/* Admin Dashboard */}
        <AdminDashboard
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          services={services}
          carouselImages={carouselImages}
        />

        {/* Fixed Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onNavigate={handleNavigate}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />
      </main>
    </div>
  );
}
