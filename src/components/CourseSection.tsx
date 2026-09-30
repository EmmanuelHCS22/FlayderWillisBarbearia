import React from 'react';
import { COURSE_INFO, WHATSAPP_PHONE_NUMBER } from '../constants';
import { PremiumIcon } from './PremiumIcon';
import { GraduationCap, Award, Clock, ArrowRight } from 'lucide-react';

interface CourseSectionProps {
  info?: typeof COURSE_INFO;
}

export const CourseSection: React.FC<CourseSectionProps> = ({
  info = COURSE_INFO
}) => {
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE_NUMBER}&text=${encodeURIComponent(
    info.whatsappMessage
  )}`;

  return (
    <section id="curso" className="w-full max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 py-12 scroll-mt-16">
      {/* Editorial Header */}
      <div className="text-center mb-8">
        <span className="text-[11px] font-semibold tracking-[0.28em] text-[#C5A059] uppercase block mb-1">
          Capacitação Profissional
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif tracking-wide text-zinc-100 uppercase font-semibold">
          {info.title}
        </h2>
        <div className="w-10 h-px bg-[#C5A059]/60 mx-auto mt-3" />
        <p className="text-xs text-zinc-400 mt-2.5 max-w-md mx-auto leading-relaxed">
          {info.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center bg-[#0F0F12] border border-zinc-800/90 rounded-2xl p-5 sm:p-7 shadow-sm">
        {/* Foto da Entrega de Diplomas / Turma */}
        <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-[16/10] sm:aspect-[4/3] group">
          <img
            src={info.imageUrl}
            alt="Entrega de diplomas e aula prática do curso de barbeiro"
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 border border-[#C5A059]/50 text-[10px] sm:text-xs text-[#E5CA85] font-semibold tracking-wide backdrop-blur-md">
              <Award size={13} className="text-[#C5A059]" />
              <span>{info.certificate}</span>
            </span>
          </div>
        </div>

        {/* Informações do Curso */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#C5A059]">
            <GraduationCap size={20} />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Metodologia Prática
            </span>
          </div>

          <h3 className="font-serif text-lg sm:text-xl text-zinc-100 font-bold leading-snug">
            Aprenda técnicas de ponta e construa sua independência financeira.
          </h3>

          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            {info.description}
          </p>

          {/* Destaques (Carga Horária & Certificado) */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-black/40 border border-zinc-800/80">
              <div className="flex items-center gap-2 text-zinc-400 text-[11px] mb-1">
                <Clock size={13} className="text-[#C5A059]" />
                <span>Carga Horária</span>
              </div>
              <strong className="text-xs text-white font-medium block">
                {info.workload}
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-zinc-800/80">
              <div className="flex items-center gap-2 text-zinc-400 text-[11px] mb-1">
                <Award size={13} className="text-[#C5A059]" />
                <span>Certificação</span>
              </div>
              <strong className="text-xs text-white font-medium block">
                Válido em Todo Brasil
              </strong>
            </div>
          </div>

          {/* Botão Quero Saber Mais */}
          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-lg font-serif font-bold uppercase tracking-[0.16em] text-xs sm:text-sm text-black bg-[#C5A059] hover:bg-[#D5B069] active:translate-y-0.5 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2.5 group"
            >
              <PremiumIcon name="whatsapp" size={17} />
              <span>Quero Saber Mais</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
