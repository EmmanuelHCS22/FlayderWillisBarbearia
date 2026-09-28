import React from 'react';
import { Home, Scissors, Calendar } from 'lucide-react';
import { WHATSAPP_URL, INSTAGRAM_URL } from '../constants';
import { PremiumIcon } from './PremiumIcon';

interface BottomNavProps {
  activeTab: 'home' | 'services' | 'booking';
  onNavigate: (tab: 'home' | 'services' | 'booking') => void;
  onOpenAdmin: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onNavigate
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0C0C0E]/95 border-t border-zinc-800/90 backdrop-blur-md px-3 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] max-w-xl mx-auto">
      <div className="flex items-center justify-around">
        {/* Início */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-[#C5A059]' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Home size={19} className={activeTab === 'home' ? 'text-[#C5A059]' : ''} />
          <span className="text-[10px] mt-1 font-medium tracking-wide">Início</span>
        </button>

        {/* Serviços */}
        <button
          onClick={() => onNavigate('services')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'services' ? 'text-[#C5A059]' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Scissors size={19} className={activeTab === 'services' ? 'text-[#C5A059]' : ''} />
          <span className="text-[10px] mt-1 font-medium tracking-wide">Serviços</span>
        </button>

        {/* Agendar Central Focal Button */}
        <button
          onClick={() => onNavigate('booking')}
          className="flex flex-col items-center justify-center -mt-5 cursor-pointer group px-2"
        >
          <div className="w-12 h-12 rounded-full bg-[#C5A059] p-0.5 shadow-lg group-hover:scale-105 group-hover:bg-[#D5B069] transition-all flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#0D0D10] flex items-center justify-center">
              <Calendar size={20} className="text-[#C5A059]" />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-[#C5A059] mt-1 tracking-wider uppercase">
            Agendar
          </span>
        </button>

        {/* Instagram */}
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <PremiumIcon name="instagram" size={19} />
          <span className="text-[10px] mt-1 font-medium tracking-wide">Instagram</span>
        </a>

        {/* WhatsApp */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <PremiumIcon name="whatsapp" size={19} />
          <span className="text-[10px] mt-1 font-medium tracking-wide">WhatsApp</span>
        </a>
      </div>
    </nav>
  );
};
