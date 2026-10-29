'use client';

import React from 'react';
import { CATEGORIES } from '@/data/categories';
import { useSupermarketStore } from '@/stores/supermarketStore';

export function CategoryBar() {
  const { navigateToAisle, activeCategory, setActiveCategory } = useSupermarketStore();

  const handleSelectCategory = (categoryId: string, aisleId: string) => {
    setActiveCategory(categoryId);
    navigateToAisle(aisleId);
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-none py-1.5 px-4 flex items-center gap-2 border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
      <button
        id="category-pill-all"
        type="button"
        onClick={() => {
          setActiveCategory(null);
          navigateToAisle('aisle-entrance');
        }}
        className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 ${
          activeCategory === null
            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
            : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        All Departments
      </button>

      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            id={`category-pill-${cat.id}`}
            key={cat.id}
            type="button"
            onClick={() => handleSelectCategory(cat.id, cat.aisleId)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-200 ${
              isActive
                ? 'text-white shadow-md'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            style={{
              backgroundColor: isActive ? cat.color : undefined,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: isActive ? '#ffffff' : cat.color }}
            />
            {cat.shortName}
          </button>
        );
      })}
    </div>
  );
}
