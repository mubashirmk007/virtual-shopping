'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PRODUCTS } from '@/data/products';
import { Product } from '@/types/product';
import { formatINR } from '@/lib/currency';
import { useSupermarketStore } from '@/stores/supermarketStore';
import { useUIStore } from '@/stores/uiStore';
import { Search, X, MapPin, Star, ArrowRight } from 'lucide-react';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { navigateToProduct } = useSupermarketStore();
  const { setProductDetailOpen } = useUIStore();

  const results = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return PRODUCTS.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.subcategoryId?.toLowerCase().includes(q)
      );
    }).slice(0, 7);
  }, [query]);

  // Keyboard navigation through suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectProduct(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectProduct = (product: Product) => {
    navigateToProduct(product.id);
    setProductDetailOpen(true);
    setIsOpen(false);
    setQuery('');
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          id="header-search-input"
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search 110+ items (e.g. Milk, Apples, Maggi)..."
          className="w-full bg-slate-900/90 border border-slate-700/80 rounded-full pl-10 pr-9 py-2 text-xs md:text-sm text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-lg transition-all"
        />
        {query && (
          <button
            id="search-clear-btn"
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && query.trim() !== '' && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 mt-2 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-50 divide-y divide-slate-800 animate-fade-in"
        >
          {results.length > 0 ? (
            results.map((product, idx) => (
              <div
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                  selectedIndex === idx ? 'bg-emerald-600/20 text-white' : 'hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Visual package badge */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[10px] text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: product.visual.primaryColor }}
                  >
                    {product.brand.substring(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white line-clamp-1">{product.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{product.brand}</span>
                      <span>•</span>
                      <span>{product.netQuantity}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div>
                    <div className="text-xs font-bold text-emerald-400">{formatINR(product.price)}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      {product.rating}
                    </div>
                  </div>
                  <div className="p-1 rounded-full bg-slate-800 text-slate-300">
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              No products found matching &quot;{query}&quot;. Try searching &quot;Produce&quot;, &quot;Dairy&quot;, or &quot;Snacks&quot;.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
