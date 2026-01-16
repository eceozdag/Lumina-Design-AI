
import React, { useState, useRef, useEffect } from 'react';

interface CompareSliderProps {
  original: string;
  transformed: string;
}

const CompareSlider: React.FC<CompareSliderProps> = ({ original, transformed }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const relativeX = x - rect.left;
    const percentage = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
    setSliderPos(percentage);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-square md:aspect-video overflow-hidden rounded-2xl border-4 border-white shadow-2xl select-none"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      {/* Transformed Image (Background) */}
      <img 
        src={transformed} 
        alt="Reimagined" 
        className="absolute top-0 left-0 w-full h-full object-cover"
      />
      
      {/* Original Image (Clip) */}
      <div 
        className="absolute top-0 left-0 w-full h-full overflow-hidden"
        style={{ width: `${sliderPos}%` }}
      >
        <img 
          src={original} 
          alt="Original" 
          className="absolute top-0 left-0 w-full h-full object-cover"
          style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none' }}
        />
      </div>

      {/* Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 slider-handle"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-zinc-200">
          <i className="fa-solid fa-arrows-left-right text-zinc-600 text-sm"></i>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 z-20 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-widest">
        Before
      </div>
      <div className="absolute bottom-4 right-4 z-20 px-3 py-1 bg-indigo-600/80 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-widest">
        After
      </div>
    </div>
  );
};

export default CompareSlider;
