import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import {
  BARBERSHOP_ADDRESS,
  GOOGLE_MAPS_NAV_URL,
  GOOGLE_MAPS_EMBED_URL,
  WHATSAPP_URL,
  FACHADA_IMAGE_URL
} from '../constants';
import { PremiumIcon } from './PremiumIcon';

interface LocationSectionProps {
  onOpenDirections?: () => void;
  fachadaImageUrl?: string;
}

export const LocationSection: React.FC<LocationSectionProps> = ({
  fachadaImageUrl = FACHADA_IMAGE_URL
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  // Animação sutil disparada apenas quando a seção entra na área visível (viewport)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const hasPhoto = Boolean(fachadaImageUrl && fachadaImageUrl.trim().length > 0);

  return (
    <section
      id="onde-estamos"
      ref={sectionRef}
      className={`w-full max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 py-12 scroll-mt-16 transition-opacity duration-700 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className={`grid grid-cols-1 ${hasPhoto ? 'md:grid-cols-2' : 'md:grid-cols-2'} gap-6 md:gap-8 items-start`}>
        
        {/* =======================================================
            1. TÍTULO E ENDEREÇO (Coluna Esquerda)
           ======================================================= */}
        <div className="space-y-5">
          <div>
            <span className="text-[11px] font-semibold tracking-[0.28em] text-[#C5A059] uppercase block mb-1">
              Localização
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif tracking-wide text-zinc-100 uppercase font-semibold">
              Onde estamos
            </h2>
            <div className="w-10 h-px bg-[#C5A059]/60 mt-2.5 mb-2" />
          </div>

          {/* Endereço Completo: Limpo, sem contorno/card ao redor, diretamente sobre o fundo */}
          <div className="flex items-start gap-3.5 pt-1">
            <div className="w-9 h-9 rounded-lg bg-zinc-900/90 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5 text-[#C5A059]">
              <MapPin size={18} />
            </div>
            <div className="text-left space-y-0.5">
              <span className="text-[10px] font-semibold tracking-wider text-[#C5A059] uppercase block">
                Endereço
              </span>
              <p className="text-sm sm:text-base font-medium text-zinc-100 leading-snug">
                R. Roberto Margonari, 827
              </p>
              <p className="text-xs sm:text-sm text-zinc-400 leading-snug">
                Luizote de Freitas, Uberlândia - MG
              </p>
              <p className="text-xs font-mono text-zinc-500">
                CEP 38414-465
              </p>
            </div>
          </div>

          {/* Botão COMO CHEGAR (Único botão de rotas do site) */}
          <div className="pt-2">
            <a
              href={GOOGLE_MAPS_NAV_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-lg font-serif font-bold uppercase tracking-[0.16em] text-xs sm:text-sm text-black bg-[#C5A059] hover:bg-[#D5B069] active:translate-y-0.5 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2.5 group"
            >
              <Navigation size={16} className="group-hover:translate-x-0.5 transition-transform" />
              <span>COMO CHEGAR</span>
            </a>
          </div>

          {/* Botão Único "Agendar pelo WhatsApp" perto do final */}
          <div className="pt-2">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] active:translate-y-0.5 text-black font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <PremiumIcon name="whatsapp" size={17} />
              <span>Agendar pelo WhatsApp</span>
            </a>
          </div>
        </div>

        {/* =======================================================
            2. FOTO DA FACHADA (Se houver) & MAPA RESPONSIVO (Coluna Direita)
           ======================================================= */}
        <div className="space-y-4">
          {/* Se houver foto da fachada, exibe a imagem. Se NÃO houver foto, o bloco fica totalmente oculto */}
          {hasPhoto && (
            <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-[#0F0F12] shadow-sm">
              <img
                src={fachadaImageUrl}
                alt="Fachada da Flayder Willis Barbearia"
                className="w-full h-48 sm:h-56 object-cover transition-transform duration-500 hover:scale-[1.02]"
                loading="lazy"
              />
            </div>
          )}

          {/* Mapa Interativo e Responsivo */}
          <div className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden border border-zinc-800/90 bg-[#0F0F12] shadow-sm">
            <iframe
              title="Localização da Flayder Willis Barbearia no Google Maps"
              src={GOOGLE_MAPS_EMBED_URL}
              className="w-full h-full border-0 filter contrast-[0.95] opacity-90 hover:opacity-100 transition-opacity"
              loading="lazy"
              allowFullScreen={false}
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Opção para abrir a localização diretamente no Google Maps */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-zinc-500">
              R. Roberto Margonari, 827 • Uberlândia - MG
            </span>
            <a
              href={GOOGLE_MAPS_NAV_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#C5A059] hover:text-[#E5CA85] transition-colors font-medium cursor-pointer"
            >
              <span>Abrir no Google Maps</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
