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
      className="relative w-full max-w-md mx-auto px-4 my-6 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Outer Glow container */}
      <div className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/30 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.15)] bg-[#0A0A0A] aspect-[4/3] sm:aspect-[16/10]">
        {/* Slides Track */}
        <div
          className="flex h-full w-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {CAROUSEL_IMAGES.map((imgSrc, idx) => (
            <div key={idx} className="min-w-full h-full relative overflow-hidden group">
              <img
                src={imgSrc}
                alt={`Flayder Willis Barbearia trabalho ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
              {/* Subtle luxury vignette gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
              <div className="absolute bottom-3 left-4 text-xs font-medium tracking-widest text-[#F1D77A] uppercase bg-black/60 px-2.5 py-1 rounded-full border border-[#D4AF37]/30 backdrop-blur-sm">
                Exclusividade & Arte #{idx + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation arrows (desktop and tablet) */}
        <button
          onClick={handlePrev}
          aria-label="Imagem anterior"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-[#D4AF37]/40 text-[#F1D77A] flex items-center justify-center backdrop-blur-md transition-all hover:bg-[#D4AF37] hover:text-black active:scale-95 z-10"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={handleNext}
          aria-label="Próxima imagem"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 border border-[#D4AF37]/40 text-[#F1D77A] flex items-center justify-center backdrop-blur-md transition-all hover:bg-[#D4AF37] hover:text-black active:scale-95 z-10"
        >
          <ChevronRight size={18} />
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-3 right-4 flex items-center space-x-1.5 z-10">
          {CAROUSEL_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-6 bg-gradient-to-r from-[#D4AF37] to-[#F1D77A] shadow-[0_0_8px_rgba(212,175,55,0.8)]'
                  : 'w-1.5 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
