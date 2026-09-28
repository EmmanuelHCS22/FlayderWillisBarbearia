import React from 'react';
import { X, Navigation, ExternalLink, MapPin } from 'lucide-react';
import { BARBERSHOP_ADDRESS, GOOGLE_MAPS_NAV_URL, WAZE_NAV_URL } from '../constants';
import { PremiumIcon } from './PremiumIcon';

interface DirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DirectionsModal: React.FC<DirectionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-[#101014] border border-zinc-800 rounded-2xl p-6 shadow-2xl text-center animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Fechar modal de rotas"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Location Icon */}
        <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center mb-3">
          <MapPin size={22} className="text-[#C5A059]" />
        </div>

        {/* Title */}
        <h3 className="text-base font-serif font-bold text-zinc-100 uppercase tracking-wider">
          Como Chegar
        </h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-[260px] mx-auto leading-relaxed">
          Inicie a rota com o aplicativo de sua preferência:
        </p>

        {/* Destination Address */}
        <div className="mt-4 mb-5 p-3 rounded-lg bg-black/40 border border-zinc-800/80 text-left">
          <span className="text-[10px] font-semibold tracking-wider text-[#C5A059] uppercase block">
            Endereço
          </span>
          <span className="text-xs text-zinc-300 block mt-0.5 leading-snug">
            {BARBERSHOP_ADDRESS}
          </span>
        </div>

        {/* Navigation Options */}
        <div className="space-y-2.5">
          {/* Google Maps */}
          <a
            href={GOOGLE_MAPS_NAV_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="group flex items-center justify-between p-3 rounded-xl bg-[#16161C] border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-black/60 border border-white/5 flex items-center justify-center shrink-0">
                <PremiumIcon name="google-maps" size={22} />
              </div>
              <div>
                <span className="block text-xs font-semibold text-zinc-100 uppercase tracking-wide group-hover:text-blue-400 transition-colors">
                  Google Maps
                </span>
                <span className="block text-[11px] text-zinc-400">
                  Abrir no aplicativo Maps
                </span>
              </div>
            </div>
            <ExternalLink size={15} className="text-zinc-500 group-hover:text-blue-400 transition-colors mr-1" />
          </a>

          {/* Waze */}
          <a
            href={WAZE_NAV_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="group flex items-center justify-between p-3 rounded-xl bg-[#16161C] border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-black/60 border border-white/5 flex items-center justify-center shrink-0">
                <PremiumIcon name="waze" size={22} />
              </div>
              <div>
                <span className="block text-xs font-semibold text-zinc-100 uppercase tracking-wide group-hover:text-cyan-400 transition-colors">
                  Waze
                </span>
                <span className="block text-[11px] text-zinc-400">
                  Navegar com alertas no Waze
                </span>
              </div>
            </div>
            <Navigation size={15} className="text-zinc-500 group-hover:text-cyan-400 transition-colors mr-1" />
          </a>
        </div>

        {/* Close Button */}
        <div className="mt-5 pt-3 border-t border-zinc-800/80">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors uppercase tracking-wider cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
