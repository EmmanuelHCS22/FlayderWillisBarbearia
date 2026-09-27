import React from 'react';
import { Service } from '../types';
import { PremiumIcon } from './PremiumIcon';
import { Clock, Check } from 'lucide-react';

interface ServicesListProps {
  services: Service[];
  selectedServiceId: string | null;
  onToggleService: (service: Service) => void;
  isLoading: boolean;
}

export const ServicesList: React.FC<ServicesListProps> = ({
  services,
  selectedServiceId,
  onToggleService,
  isLoading
}) => {
  const mapIcon = (service: Service) => {
    switch (service.iconName || service.id) {
      case 'corte':
      case 'scissors': return 'scissors';
      case 'barba':
      case 'beard': return 'beard';
      case 'corte-barba':
      case 'combo': return 'combo';
      case 'selagem':
      case 'hair': return 'hair';
      case 'alisamento':
      case 'straight': return 'straight';
      case 'platinado':
      case 'platinum': return 'platinum';
      case 'sobrancelha':
      case 'eyebrow': return 'eyebrow';
      case 'pintura':
      case 'dye': return 'dye';
      default: return 'scissors';
    }
  };

  // Only display active services for clients
  const activeServices = services.filter((s) => s.active !== false);

  return (
    <section id="servicos" className="w-full max-w-md mx-auto px-4 py-6 scroll-mt-14">
      <div className="text-center mb-6">
        <span className="text-[11px] font-bold tracking-[0.25em] text-[#D4AF37] uppercase">
          Técnica & Precisão
        </span>
        <h2 className="text-2xl font-serif tracking-wide text-white mt-1 uppercase font-semibold">
          Nossos Serviços
        </h2>
        <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-2" />
        <p className="text-xs text-zinc-400 mt-2">
          Toque para selecionar o serviço desejado ou toque novamente para desmarcar.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-[#0A0A0A] border border-[#D4AF37]/20 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : activeServices.length === 0 ? (
        <div className="text-center py-8 text-xs text-zinc-500 bg-[#0A0A0A] rounded-xl border border-zinc-800">
          Nenhum serviço disponível no momento.
        </div>
      ) : (
        <div className="space-y-3.5">
          {activeServices.map((service) => {
            const isSelected = selectedServiceId === service.id;

            return (
              <div
                key={service.id}
                onClick={() => onToggleService(service)}
                className={`relative group cursor-pointer rounded-2xl p-4 transition-all duration-300 border ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#181406] via-[#0E0C05] to-[#1a1506] border-[#F1D77A] shadow-[0_0_25px_rgba(212,175,55,0.35)] ring-1 ring-[#F1D77A]'
                    : 'bg-[#0A0A0A]/95 hover:bg-[#121212] border-[#D4AF37]/25 hover:border-[#D4AF37]/50 shadow-[0_4px_16px_rgba(0,0,0,0.7)]'
                }`}
              >
                {/* Highlight ribbon for combo/featured */}
                {service.highlight && (
                  <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-[#D4AF37] to-[#F1D77A] text-black text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-md tracking-wider">
                    {service.highlightText || 'COMBO — ECONOMIZE'}
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    {/* 3D Icon container */}
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-inner transition-colors ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#2a220a] to-[#120f04] border-[#F1D77A]'
                        : 'bg-gradient-to-br from-[#151515] to-[#050505] border-[#D4AF37]/30 group-hover:border-[#D4AF37]/60'
                    }`}>
                      <PremiumIcon name={mapIcon(service)} size={26} />
                    </div>

                    <div>
                      <h3 className={`font-serif font-bold text-base transition-colors ${
                        isSelected ? 'text-[#F1D77A]' : 'text-zinc-100 group-hover:text-[#F1D77A]'
                      }`}>
                        {service.name}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#D4AF37]">
                        <Clock size={12} className="text-[#D4AF37]" />
                        <span>{service.duration} minutos</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Selection Interactive Toggle Button */}
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-zinc-400 font-light block">Valor</span>
                    <div className="text-lg font-bold text-[#F1D77A] font-serif">
                      R$ {service.price.toFixed(2).replace('.', ',')}
                    </div>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleService(service);
                      }}
                      className={`mt-2 text-[11px] uppercase font-bold tracking-wider px-3.5 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#D4AF37] to-[#F1D77A] text-black shadow-[0_0_12px_rgba(212,175,55,0.6)]'
                          : 'bg-white/5 text-zinc-300 border border-white/15 hover:border-[#D4AF37]/50 hover:bg-white/10'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check size={12} className="stroke-[3]" />
                          <span>SELECIONADO</span>
                        </>
                      ) : (
                        <span>SELECIONAR</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
