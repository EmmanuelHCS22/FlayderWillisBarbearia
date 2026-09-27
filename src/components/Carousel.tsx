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

  // Auto-play every 4 seconds
  useEffect(() => {
    if (isPaused || activeImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeImages.length);
    }, 4000);

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

  return (
    <div
      className="relative w-full max-w-md mx-auto px-3 my-5 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1:1 Aspect Ratio Container - clean, pure photo view without badge overlays */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-[#D4AF37]/35 shadow-[0_12px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(212,175,55,0.2)] bg-[#0A0A0A] aspect-square w-full">
        {/* Slides Track */}
        <div
          className="flex h-full w-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {activeImages.map((imgItem, idx) => (
            <div key={imgItem.id || idx} className="min-w-full h-full relative overflow-hidden flex items-center justify-center bg-[#070707]">
              {/* Subtle background ambient blur for images */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-lg scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${imgItem.url})` }}
              />

              {/* Foreground Image shown whole and complete without clipping key details */}
              <img
                src={imgItem.url}
                alt={imgItem.title || `Foto ${idx + 1}`}
                className="relative z-10 w-full h-full object-contain p-1"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

        {/* Navigation buttons to skip manually */}
        {activeImages.length > 1 && (
          <>
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
          </>
        )}

        {/* Dot Indicators */}
        {activeImages.length > 1 && (
          <div className="absolute bottom-3.5 right-4 flex items-center space-x-1.5 z-20 bg-black/60 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-sm">
            {activeImages.map((_, idx) => (
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
        )}
      </div>
    </div>
  );
};
