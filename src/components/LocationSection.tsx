import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, ExternalLink, Navigation, Camera, Store } from 'lucide-react';
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
  onOpenDirections,
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

  return (
    <section
      id="onde-estamos"
      ref={sectionRef}
      className={`w-full max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 py-12 scroll-mt-16 transition-opacity duration-700 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* 
        ORGANIZAÇÃO VISUAL RESPONSIVA:
        - No DESKTOP (md:): Composição equilibrada em 2 colunas.
            Lado esquerdo: título, frase, endereço, horário, botão COMO CHEGAR, botão WhatsApp.
            Lado direito: foto da fachada, mapa.
        - No CELULAR: Coluna única ordenada exatamente na sequência solicitada:
            1. título + frase
            2. foto da fachada
            3. endereço
            4. horário
            5. botão COMO CHEGAR
            6. mapa
            7. botão WhatsApp
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        
        {/* =======================================================
            1. TÍTULO E FRASE (Mobile: 1º / Desktop: Coluna Esquerda, Topo)
           ======================================================= */}
        <div className="order-1 md:col-start-1 md:row-start-1">
          <span className="text-[11px] font-semibold tracking-[0.28em] text-[#C5A059] uppercase block mb-1">
            Localização
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif tracking-wide text-zinc-100 uppercase font-semibold">
            Onde estamos
          </h2>
          <div className="w-10 h-px bg-[#C5A059]/60 mt-2.5 mb-2" />
          <p className="text-xs sm:text-sm text-zinc-400 font-light">
            Venha nos visitar.
          </p>
        </div>

        {/* =======================================================
            2. FOTO DA FACHADA (Mobile: 2º / Desktop: Coluna Direita, Topo)
            Preparado para receber a foto real da fachada da barbearia.
            Para adicionar a foto real, configure FACHADA_IMAGE_URL em src/constants.ts
           ======================================================= */}
        <div className="order-2 md:col-start-2 md:row-start-1">
          {fachadaImageUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-[#0F0F12] shadow-sm">
              <img
                src={fachadaImageUrl}
                alt="Fachada da Flayder Willis Barbearia"
                className="w-full h-52 sm:h-60 md:h-64 object-cover transition-transform duration-500 hover:scale-[1.02]"
                loading="lazy"
              />
            </div>
          ) : (
            /* Placeholder discreto e profissional para quando a foto ainda não estiver configurada */
            <div className="w-full h-52 sm:h-60 md:h-64 rounded-xl border border-zinc-800/90 bg-[#0F0F12] flex flex-col items-center justify-center p-6 text-center shadow-sm group">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 text-[#C5A059] group-hover:scale-105 transition-transform">
                <Store size={22} className="text-[#C5A059]" />
              </div>
              <span className="text-xs font-medium text-zinc-200 uppercase tracking-wider block">
                Fachada da Barbearia
              </span>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-[240px] leading-relaxed">
                Espaço preparado para a foto real da fachada da Flayder Willis Barbearia.
              </p>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-600 mt-2.5 font-mono">
                <Camera size={11} />
                <span>R. Roberto Margonari, 827</span>
              </span>
            </div>
          )}
        </div>

        {/* =======================================================
            3. ENDEREÇO & HORÁRIO DE FUNCIONAMENTO
            (Mobile: 3º e 4º / Desktop: Coluna Esquerda, Meio)
           ======================================================= */}
        <div className="order-3 md:col-start-1 md:row-start-2 space-y-4">
          {/* Endereço Completo */}
          <div className="p-4 rounded-xl bg-[#0F0F12] border border-zinc-800/90">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={16} className="text-[#C5A059]" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-semibold tracking-wider text-[#C5A059] uppercase block mb-0.5">
                  Endereço
                </span>
                <p className="text-xs sm:text-sm font-medium text-zinc-100 leading-snug">
                  R. Roberto Margonari, 827
                </p>
                <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
                  Luizote de Freitas, Uberlândia - MG
                </p>
                <p className="text-xs font-mono text-zinc-500 mt-0.5">
                  38414-465
                </p>
              </div>
            </div>
          </div>

          {/* Horário de Funcionamento */}
          <div className="p-4 rounded-xl bg-[#0F0F12] border border-zinc-800/90">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                <Clock size={16} className="text-[#C5A059]" />
              </div>
              <div className="text-left flex-1">
                <span className="text-[10px] font-semibold tracking-wider text-[#C5A059] uppercase block mb-1">
                  Horário de funcionamento
                </span>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300">Segunda a sábado:</span>
                    <strong className="text-zinc-100 font-mono font-medium">08:00 às 19:30</strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                    <span className="text-zinc-400">Domingo:</span>
                    <span className="text-zinc-500 font-medium">Fechado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================
            4. BOTÃO COMO CHEGAR (Mobile: 5º / Desktop: Coluna Esquerda)
           ======================================================= */}
        <div className="order-4 md:col-start-1 md:row-start-3">
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

        {/* =======================================================
            5. MAPA RESPONSIVO (Mobile: 6º / Desktop: Coluna Direita, Abaixo da Fachada)
           ======================================================= */}
        <div className="order-5 md:col-start-2 md:row-start-2 md:row-span-3 space-y-2">
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
              R. Roberto Margonari, 827
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

        {/* =======================================================
            6. CONTATO WHATSAPP (Mobile: 7º / Desktop: Coluna Esquerda, Final)
           ======================================================= */}
        <div className="order-6 md:col-start-1 md:row-start-4 pt-1">
          <div className="p-4 rounded-xl bg-[#0F0F12] border border-zinc-800/90 space-y-2.5">
            <span className="block text-xs text-zinc-300 font-medium">
              Agende seu horário pelo WhatsApp
            </span>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-lg bg-[#25D366] hover:bg-[#20ba59] active:translate-y-0.5 text-black font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <PremiumIcon name="whatsapp" size={16} />
              <span>Agendar pelo WhatsApp</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
