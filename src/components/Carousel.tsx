import React, { useState, useEffect, useRef } from 'react';
import { CarouselImageItem } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
  images: CarouselImageItem[];
}

export const Carousel: React.FC<CarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Filter only active images for the public carousel
  const activeImages = images.filter((img) => img.active !== false);

  // Auto-play every 5 seconds
  useEffect(() => {
    if (isPaused || activeImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, activeImages.length]);

  // Reset index if out of bounds
  useEffect(() => {
    if (currentIndex >= activeImages.length && activeImages.length > 0) {
      setCurrentIndex(0);
    }
  }, [activeImages.length, currentIndex]);

  const handlePrev = () => {
    if (activeImages.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? activeImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (activeImages.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % activeImages.length);
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

  if (activeImages.length === 0) {
    return null;
  }

  const currentImage = activeImages[currentIndex];

  return (
    <div
      className="relative w-full max-w-xl mx-auto px-4 my-6 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Editorial Framed Container */}
      <div className="relative overflow-hidden rounded-xl border border-zinc-800/90 bg-[#0C0C0E] shadow-[0_8px_30px_rgba(0,0,0,0.6)] aspect-square sm:aspect-[4/3] w-full group">
        {/* Slides Track */}
        <div
          className="flex h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {activeImages.map((imgItem, idx) => (
            <div
              key={imgItem.id || idx}
              className="min-w-full h-full relative overflow-hidden flex items-center justify-center bg-[#09090B]"
            >
              {/* Subtle diffused background tone */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-20 filter blur-xl scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${imgItem.url})` }}
              />

              {/* Main Image */}
              <img
                src={imgItem.url}
                alt={imgItem.title || `Trabalho ${idx + 1} - Flayder Willis Barbearia`}
                className="relative z-10 w-full h-full object-contain p-2 sm:p-3 transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

        {/* Minimalist Editorial Counter (top right) */}
        <div className="absolute top-3.5 right-3.5 z-20 px-2.5 py-1 rounded bg-black/75 border border-white/10 backdrop-blur-sm text-[11px] font-mono tracking-widest text-zinc-300">
          <span>{String(currentIndex + 1).padStart(2, '0')}</span>
          <span className="text-zinc-600 mx-1">/</span>
          <span className="text-zinc-500">{String(activeImages.length).padStart(2, '0')}</span>
        </div>

        {/* Navigation Buttons: Discreet, refined editorial chevrons */}
        {activeImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Imagem anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-[#1A1A1E] border border-zinc-700/80 text-zinc-300 hover:text-white flex items-center justify-center backdrop-blur-sm transition-all hover:-translate-x-0.5 active:scale-95 z-20 shadow-md cursor-pointer opacity-90 hover:opacity-100"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              aria-label="Próxima imagem"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-[#1A1A1E] border border-zinc-700/80 text-zinc-300 hover:text-white flex items-center justify-center backdrop-blur-sm transition-all hover:translate-x-0.5 active:scale-95 z-20 shadow-md cursor-pointer opacity-90 hover:opacity-100"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Linear minimal progress indicators at the bottom */}
        {activeImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/5">
            {activeImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Ver imagem ${idx + 1}`}
                className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 bg-[#C5A059]'
                    : 'w-1.5 bg-zinc-600 hover:bg-zinc-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
