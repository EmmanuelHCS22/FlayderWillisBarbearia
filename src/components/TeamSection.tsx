import React from 'react';
import { Barber } from '../types';
import { DEFAULT_BARBERS } from '../constants';
import { Scissors } from 'lucide-react';

interface TeamSectionProps {
  barbers?: Barber[];
  onSelectBarberForBooking?: (barber: Barber) => void;
}

export const TeamSection: React.FC<TeamSectionProps> = ({
  barbers = DEFAULT_BARBERS,
  onSelectBarberForBooking
}) => {
  return (
    <section id="equipe" className="w-full max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 py-12 scroll-mt-16">
      {/* Editorial Header */}
      <div className="text-center mb-8">
        <span className="text-[11px] font-semibold tracking-[0.28em] text-[#C5A059] uppercase block mb-1">
          Profissionais
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif tracking-wide text-zinc-100 uppercase font-semibold">
          Nossa Equipe
        </h2>
        <div className="w-10 h-px bg-[#C5A059]/60 mx-auto mt-3" />
        <p className="text-xs text-zinc-400 mt-2.5 max-w-md mx-auto leading-relaxed">
          Especialistas dedicados a entregar excelência, estilo e cuidado em cada detalhe.
        </p>
      </div>

      {/* Barbers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {barbers.map((barber) => (
          <div
            key={barber.id}
            className="group rounded-xl bg-[#0F0F12] border border-zinc-800/90 overflow-hidden hover:border-[#C5A059]/50 transition-all duration-300 shadow-sm flex flex-col"
          >
            {/* Foto do Barbeiro */}
            <div className="relative aspect-[4/5] sm:aspect-square overflow-hidden bg-zinc-900">
              <img
                src={barber.imageUrl}
                alt={barber.name}
                loading="lazy"
                className="w-full h-full object-cover object-top filter grayscale contrast-105 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12] via-transparent to-transparent opacity-80" />
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059]">
                <Scissors size={14} />
              </div>
            </div>

            {/* Informações */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-semibold tracking-wider text-[#C5A059] uppercase block mb-0.5">
                  {barber.role}
                </span>
                <h3 className="font-serif text-base sm:text-lg text-zinc-100 font-bold tracking-wide">
                  {barber.name}
                </h3>
                <p className="text-xs text-zinc-300 font-medium mt-1">
                  {barber.specialty}
                </p>
                {barber.bio && (
                  <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                    {barber.bio}
                  </p>
                )}
              </div>

              {onSelectBarberForBooking && (
                <button
                  type="button"
                  onClick={() => onSelectBarberForBooking(barber)}
                  className="mt-4 w-full py-2 px-3 rounded-lg border border-[#C5A059]/40 hover:border-[#C5A059] hover:bg-[#C5A059]/10 text-[#C5A059] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Agendar com {barber.name.split(' ')[0]}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
