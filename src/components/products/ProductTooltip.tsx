'use client';

import React, { useEffect, useState } from 'react';
import { useSupermarketStore } from '@/stores/supermarketStore';
import { formatINR } from '@/lib/currency';
import { Star, Eye } from 'lucide-react';

export function ProductTooltip() {
  const { hoveredProduct } = useSupermarketStore();
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!hoveredProduct) return null;

  return (
    <div
      className="fixed z-40 pointer-events-none transition-transform duration-75 ease-out select-none"
      style={{
        left: `${pos.x + 16}px`,
        top: `${pos.y - 20}px`,
      }}
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-2xl w-60 animate-fade-in">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            {hoveredProduct.brand}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>{hoveredProduct.rating}</span>
          </div>
        </div>

        <h4 className="font-bold text-xs text-white leading-tight mb-1 line-clamp-1">
          {hoveredProduct.name}
        </h4>
        <p className="text-[11px] text-slate-400 mb-2">{hoveredProduct.netQuantity}</p>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
          <div>
            <span className="text-sm font-black text-white">
              {formatINR(hoveredProduct.price)}
            </span>
            {hoveredProduct.originalPrice && (
              <span className="text-[10px] text-slate-500 line-through ml-1.5">
                {formatINR(hoveredProduct.originalPrice)}
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <Eye className="w-3 h-3" /> Click to Inspect
          </span>
        </div>
      </div>
    </div>
  );
}
