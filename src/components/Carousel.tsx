import React, { useState, useEffect, useRef } from 'react';
import { CAROUSEL_IMAGES } from '../constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Carousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-play every 4.5 seconds
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? CAROUSEL_IMAGES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div
      className="relative w-full max-w-md mx-auto px-3 my-6 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1:1 Aspect Ratio Container with larger presence and dark luxury frame */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-[#D4AF37]/35 shadow-[0_12px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(212,175,55,0.2)] bg-[#0A0A0A] aspect-square w-full">
        {/* Slides Track */}
        <div
          className="flex h-full w-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {CAROUSEL_IMAGES.map((imgSrc, idx) => (
            <div key={idx} className="min-w-full h-full relative overflow-hidden flex items-center justify-center bg-[#070707]">
              {/* Subtle background ambient blur for images */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-lg scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${imgSrc})` }}
              />

              {/* Foreground Image shown whole and complete without clipping key details */}
              <img
                src={imgSrc}
                alt={`Flayder Willis Barbearia trabalho ${idx + 1}`}
                className="relative z-10 w-full h-full object-contain p-1"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />

              {/* Elegant vignette overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25 pointer-events-none z-10" />
              
              <div className="absolute bottom-3.5 left-4 z-20 text-[11px] font-bold tracking-widest text-[#F1D77A] uppercase bg-black/75 px-3 py-1 rounded-full border border-[#D4AF37]/40 backdrop-blur-md shadow-lg">
                Arte & Estilo #{idx + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation buttons */}
        <button
          onClick={handlePrev}
          aria-label="Imagem anterior"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/75 border border-[#D4AF37]/50 text-[#F1D77A] flex items-center justify-center backdrop-blur-md transition-all hover:bg-[#D4AF37] hover:text-black active:scale-95 z-20 shadow-lg cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={handleNext}
          aria-label="Próxima imagem"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/75 border border-[#D4AF37]/50 text-[#F1D77A] flex items-center justify-center backdrop-blur-md transition-all hover:bg-[#D4AF37] hover:text-black active:scale-95 z-20 shadow-lg cursor-pointer"
        >
          <ChevronRight size={20} />
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-4 right-4 flex items-center space-x-1.5 z-20 bg-black/60 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-sm">
          {CAROUSEL_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-5 bg-gradient-to-r from-[#D4AF37] to-[#F1D77A] shadow-[0_0_8px_rgba(212,175,55,0.9)]'
                  : 'w-1.5 bg-white/35 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
