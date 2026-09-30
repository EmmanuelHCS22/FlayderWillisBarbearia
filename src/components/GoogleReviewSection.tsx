import React from 'react';
import { GOOGLE_REVIEW_URL } from '../constants';
import { PremiumIcon } from './PremiumIcon';
import { Star, ExternalLink } from 'lucide-react';

export const GoogleReviewSection: React.FC = () => {
  return (
    <section id="avaliacao" className="w-full max-w-xl mx-auto px-4 py-8 scroll-mt-16">
      <div className="text-center mb-4">
        <span className="text-[11px] font-semibold tracking-[0.28em] text-[#C5A059] uppercase block mb-1">
          Sua Opinião
        </span>
        <h2 className="text-xl sm:text-2xl font-serif tracking-wide text-zinc-100 uppercase font-semibold">
          Avalie no Google
        </h2>
        <div className="w-8 h-px bg-[#C5A059]/60 mx-auto mt-2" />
      </div>

      <a
        href={GOOGLE_REVIEW_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group block p-4 sm:p-5 rounded-xl bg-[#0F0F12] border border-zinc-800/90 hover:border-[#C5A059]/60 hover:bg-[#141418] transition-all cursor-pointer shadow-sm"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <PremiumIcon name="google" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-serif font-bold text-zinc-100 uppercase tracking-wide group-hover:text-[#E5CA85] transition-colors">
                  Flayder Willis Barbearia
                </span>
                {/* Estrelas puramente como ícone gráfico decorativo */}
                <div className="flex text-[#FBBC05] items-center gap-0.5" aria-hidden="true">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} className="fill-[#FBBC05]" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Deixe sua opinião e ajude outras pessoas a conhecerem nosso trabalho.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 text-xs text-[#C5A059] font-medium uppercase tracking-wider group-hover:underline">
            <span className="hidden sm:inline">Avaliar</span>
            <ExternalLink size={16} className="text-zinc-400 group-hover:text-[#C5A059] transition-colors" />
          </div>
        </div>
      </a>
    </section>
  );
};
