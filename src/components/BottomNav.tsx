import React from 'react';
import { Home, Scissors, Calendar, Shield } from 'lucide-react';
import { WHATSAPP_URL, INSTAGRAM_URL } from '../constants';
import { PremiumIcon } from './PremiumIcon';

interface BottomNavProps {
  activeTab: 'home' | 'services' | 'booking';
  onNavigate: (tab: 'home' | 'services' | 'booking') => void;
  onOpenAdmin: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onNavigate,
  onOpenAdmin
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#050505]/95 border-t border-[#D4AF37]/30 backdrop-blur-lg px-2 py-1.5 shadow-[0_-5px_25px_rgba(0,0,0,0.8)] max-w-md mx-auto">
      <div className="flex items-center justify-around">
        {/* Início */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-[#F1D77A]' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Home size={20} className={activeTab === 'home' ? 'text-[#D4AF37]' : ''} />
          <span className="text-[10px] mt-1 font-medium tracking-wide">Início</span>
        </button>

        {/* Serviços */}
        <button
          onClick={() => onNavigate('services')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'services' ? 'text-[#F1D77A]' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Scissors size={20} className={activeTab === 'services' ? 'text-[#D4AF37]' : ''} />
          <span className="text-[10px] mt-1 font-medium tracking-wide">Serviços</span>
        </button>

        {/* Agendar Central Featured Button */}
        <button
          onClick={() => onNavigate('booking')}
          className="flex flex-col items-center justify-center -mt-5 cursor-pointer group"
        >
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#D4AF37] via-[#F1D77A] to-[#B38728] p-0.5 shadow-[0_0_18px_rgba(212,175,55,0.6)] group-hover:scale-105 transition-transform flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <Calendar size={22} className="text-[#F1D77A]" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#F1D77A] mt-1 tracking-wider uppercase">
            Agendar
          </span>
        </button>

        {/* Instagram */}
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-zinc-400 hover:text-[#F1D77A] transition-colors cursor-pointer"
        >
          <PremiumIcon name="instagram" size={20} />
          <span className="text-[10px] mt-1 font-medium tracking-wide">Instagram</span>
        </a>

        {/* WhatsApp */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <PremiumIcon name="whatsapp" size={20} />
          <span className="text-[10px] mt-1 font-medium tracking-wide">WhatsApp</span>
        </a>
      </div>
    </nav>
  );
};
