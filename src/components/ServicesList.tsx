import React from 'react';
import { Service } from '../types';
import { PremiumIcon } from './PremiumIcon';
import { Clock } from 'lucide-react';

interface ServicesListProps {
  services: Service[];
  selectedServiceId: string | null;
  onSelectService: (service: Service) => void;
  isLoading: boolean;
}

export const ServicesList: React.FC<ServicesListProps> = ({
  services,
  selectedServiceId,
  onSelectService,
  isLoading
}) => {
  const mapIcon = (service: Service) => {
    switch (service.id) {
      case 'corte': return 'scissors';
      case 'barba': return 'beard';
      case 'corte-barba': return 'combo';
      case 'selagem': return 'hair';
      case 'alisamento': return 'straight';
      case 'platinado': return 'platinum';
      case 'sobrancelha': return 'eyebrow';
      case 'pintura': return 'dye';
      default: return 'scissors';
    }
  };

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
          Carregados diretamente do banco de dados centralizado Firebase
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
      ) : (
        <div className="space-y-3.5">
          {services.map((service) => {
            const isSelected = selectedServiceId === service.id;

            return (
              <div
                key={service.id}
                onClick={() => onSelectService(service)}
                className={`relative group cursor-pointer rounded-xl p-4 transition-all duration-300 border ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#121212] via-[#0A0A0A] to-[#1a1608] border-[#F1D77A] shadow-[0_0_20px_rgba(212,175,55,0.25)] ring-1 ring-[#F1D77A]'
                    : 'bg-[#0A0A0A]/90 hover:bg-[#121212] border-[#D4AF37]/25 hover:border-[#D4AF37]/60 shadow-[0_4px_12px_rgba(0,0,0,0.6)]'
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
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#151515] to-[#050505] border border-[#D4AF37]/30 flex items-center justify-center shrink-0 shadow-inner group-hover:border-[#D4AF37]/70 transition-colors">
                      <PremiumIcon name={mapIcon(service)} size={26} />
                    </div>

                    <div>
                      <h3 className="font-serif font-bold text-base text-zinc-100 group-hover:text-[#F1D77A] transition-colors">
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

                  {/* Price & Selection indicator */}
                  <div className="text-right shrink-0">
                    <span className="text-xs text-zinc-400 font-light">A partir de</span>
                    <div className="text-lg font-bold text-[#F1D77A] font-serif">
                      R$ {service.price.toFixed(2).replace('.', ',')}
                    </div>
                    <button
                      type="button"
                      className={`mt-2 text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-md transition-all ${
                        isSelected
                          ? 'bg-[#D4AF37] text-black shadow-[0_0_10px_rgba(212,175,55,0.5)]'
                          : 'bg-white/5 text-zinc-300 border border-white/10 group-hover:border-[#D4AF37]/40'
                      }`}
                    >
                      {isSelected ? 'Selecionado' : 'Escolher'}
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
