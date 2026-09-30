import React, { useState } from 'react';
import { Service } from '../types';
import { Clock, Check, Plus, ChevronDown, ChevronUp } from 'lucide-react';

interface ServicesListProps {
  services: Service[];
  selectedServiceId?: string | null;
  selectedServiceIds?: string[];
  onToggleService: (service: Service) => void;
  isLoading: boolean;
}

export const ServicesList: React.FC<ServicesListProps> = ({
  services,
  selectedServiceId,
  selectedServiceIds = [],
  onToggleService,
  isLoading
}) => {
  // Only display active services for clients
  const activeServices = services.filter((s) => s.active !== false);

  // Set of service IDs whose full description is currently expanded
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="servicos" className="w-full max-w-xl mx-auto px-4 py-10 scroll-mt-16">
      {/* Section Editorial Header */}
      <div className="text-center mb-8">
        <span className="text-[11px] font-semibold tracking-[0.28em] text-[#C5A059] uppercase block mb-1">
          Menu de Cuidados
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif tracking-wide text-zinc-100 uppercase font-semibold">
          Nossos Serviços
        </h2>
        <div className="w-10 h-px bg-[#C5A059]/60 mx-auto mt-3" />
        <p className="text-xs text-zinc-400 mt-2.5 max-w-md mx-auto leading-relaxed">
          Selecione um ou mais serviços para o seu atendimento.
        </p>
      </div>

      {isLoading ? (
        <div className="divide-y divide-zinc-800/80 border-y border-zinc-800/80">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="py-4 animate-pulse flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-32" />
                <div className="h-3 bg-zinc-900 rounded w-48" />
              </div>
              <div className="h-6 bg-zinc-800 rounded w-16" />
            </div>
          ))}
        </div>
      ) : activeServices.length === 0 ? (
        <div className="text-center py-10 text-xs text-zinc-500 border border-zinc-800 rounded-lg">
          Nenhum serviço disponível no momento.
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/70 border-t border-b border-zinc-800/70">
          {activeServices.map((service) => {
            const isSelected = selectedServiceIds.includes(service.id) || selectedServiceId === service.id;
            const isExpanded = !!expandedIds[service.id];

            return (
              <div
                key={service.id}
                onClick={() => toggleExpand(service.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(service.id);
                  }
                }}
                className={`group py-4 px-3 sm:px-4 transition-all duration-200 cursor-pointer flex items-start justify-between gap-4 select-none ${
                  isSelected
                    ? 'bg-[#18181C]/90 border-l-2 border-l-[#C5A059] -ml-px'
                    : 'hover:bg-[#121215]/80'
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3
                      className={`text-sm sm:text-base font-medium tracking-wide uppercase transition-colors ${
                        isSelected ? 'text-[#E5CA85] font-semibold' : 'text-zinc-100 group-hover:text-zinc-50'
                      }`}
                    >
                      {service.name}
                    </h3>

                    {service.highlight && (
                      <span className="text-[9px] font-semibold tracking-wider text-[#C5A059] border border-[#C5A059]/40 px-1.5 py-0.5 rounded uppercase">
                        {service.highlightText || 'COMBO'}
                      </span>
                    )}
                  </div>

                  {service.description && (
                    <div className="mt-1">
                      <p
                        className={`text-xs text-zinc-400 leading-relaxed transition-all ${
                          isExpanded ? 'block' : 'line-clamp-2'
                        }`}
                      >
                        {service.description}
                      </p>
                      {service.description.length > 60 && (
                        <button
                          type="button"
                          onClick={(e) => toggleExpand(service.id, e)}
                          className="inline-flex items-center gap-1 text-[11px] text-[#C5A059] hover:text-[#E5CA85] font-medium mt-1 cursor-pointer transition-colors"
                        >
                          <span>{isExpanded ? 'Ver menos' : 'Ver mais'}</span>
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-zinc-500">
                    <Clock size={12} className="text-zinc-500" />
                    <span>{service.duration} min</span>
                  </div>
                </div>

                {/* Price and Explicit Selection Button */}
                <div className="text-right shrink-0 flex items-center gap-3 sm:gap-4 pt-0.5">
                  <div>
                    <span className="block text-sm sm:text-base font-semibold text-zinc-100 font-mono tracking-tight">
                      R$ {service.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleService(service);
                    }}
                    aria-label={isSelected ? `Remover ${service.name}` : `Selecionar ${service.name}`}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#C5A059] text-black shadow-sm scale-105'
                        : 'border border-zinc-700/80 text-zinc-300 hover:text-white hover:border-[#C5A059] hover:bg-[#C5A059]/10 bg-zinc-900/60'
                    }`}
                  >
                    {isSelected ? (
                      <Check size={16} className="stroke-[3]" />
                    ) : (
                      <Plus size={16} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
