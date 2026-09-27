import React from 'react';
import { X, Navigation, ExternalLink } from 'lucide-react';
import { PremiumIcon } from './PremiumIcon';
import { BARBERSHOP_ADDRESS, GOOGLE_MAPS_NAV_URL, WAZE_NAV_URL } from '../constants';

interface DirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DirectionsModal: React.FC<DirectionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-[#0B0B0D] border border-[#D4AF37]/45 rounded-3xl p-6 shadow-[0_15px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(212,175,55,0.2)] text-center animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gold line accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-transparent via-[#F1D77A] to-transparent rounded-full" />

        {/* Close icon button */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* 3D Location Icon Header */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(212,175,55,0.25)]">
          <PremiumIcon name="location" size={32} />
        </div>

        {/* Title */}
        <h3 className="text-base font-serif font-bold text-white uppercase tracking-wider">
          COMO VOCÊ QUER CHEGAR?
        </h3>
        <p className="text-[11px] text-zinc-400 mt-1 max-w-[260px] mx-auto leading-relaxed">
          Escolha o aplicativo de sua preferência para iniciar a rota até a Flayder Willis Barbearia:
        </p>

        {/* Destination address hint (discreet, clean) */}
        <div className="mt-3.5 mb-5 px-3 py-2 rounded-xl bg-black/60 border border-white/5 text-[11px] text-zinc-300">
          <span className="text-[#F1D77A] font-semibold block text-[10px] uppercase tracking-wider mb-0.5">Destino</span>
          <span className="text-zinc-300 text-[11px] leading-tight block">{BARBERSHOP_ADDRESS}</span>
        </div>

        {/* Navigation App Options: Exactly Google Maps and Waze */}
        <div className="space-y-3">
          {/* 1. GOOGLE MAPS */}
          <a
            href={GOOGLE_MAPS_NAV_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="group flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#141416] to-[#0A0A0C] border border-[#4285F4]/40 hover:border-[#4285F4] hover:shadow-[0_0_25px_rgba(66,133,244,0.35)] transition-all cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-11 h-11 rounded-xl bg-black/70 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <PremiumIcon name="google-maps" size={26} />
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-white group-hover:text-[#4285F4] transition-colors">
                  GOOGLE MAPS
                </span>
                <span className="block text-[10px] text-zinc-400">
                  Navegar com Google Maps
                </span>
              </div>
            </div>
            <ExternalLink size={16} className="text-zinc-500 group-hover:text-[#4285F4] transition-colors mr-1" />
          </a>

          {/* 2. WAZE */}
          <a
            href={WAZE_NAV_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="group flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#11161B] to-[#0A0A0C] border border-[#33CCFF]/40 hover:border-[#33CCFF] hover:shadow-[0_0_25px_rgba(51,204,255,0.35)] transition-all cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-11 h-11 rounded-xl bg-black/70 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <PremiumIcon name="waze" size={26} />
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-white group-hover:text-[#33CCFF] transition-colors">
                  WAZE
                </span>
                <span className="block text-[10px] text-zinc-400">
                  Navegar com Waze
                </span>
              </div>
            </div>
            <Navigation size={16} className="text-zinc-500 group-hover:text-[#33CCFF] transition-colors mr-1" />
          </a>
        </div>

        {/* Small Close Button */}
        <div className="mt-5 pt-3 border-t border-white/5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-white/10 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-wider cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
