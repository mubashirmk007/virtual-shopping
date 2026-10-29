'use client';

import React, { useState } from 'react';
import { PRODUCTS } from '@/data/products';
import { CATEGORIES } from '@/data/categories';
import { formatINR } from '@/lib/currency';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { Product } from '@/types/product';
import { ShoppingBag, Star, Plus, AlertCircle, Search } from 'lucide-react';

export function WebGlFallback() {
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const { addItem } = useCartStore();
  const { setCartOpen, setProductDetailOpen } = useUIStore();

  const filtered = PRODUCTS.filter((p) => {
    const matchesCat = selectedCat === 'all' || p.categoryId === selectedCat;
    const matchesSearch =
      search.trim() === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Notice Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-center gap-2 text-xs text-amber-300">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          3D Hardware Acceleration is currently unavailable in this browser. Showing Standard 2D Catalog mode.
        </span>
      </div>

      {/* Catalog Search & Category Filter Header */}
      <div className="p-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">AISLE CATALOG</h1>
              <p className="text-xs text-slate-400">Over 110 grocery products available for instant order</p>
            </div>
          </div>

          {/* Search Field */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search apples, milk, snacks..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
          <button
            type="button"
            onClick={() => setSelectedCat('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCat === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Products
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCat === cat.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat.shortName}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3 flex flex-col justify-between hover:border-emerald-500/50 transition-all duration-200"
            >
              <div>
                {/* Visual Package Tile */}
                <div
                  className="w-full h-32 rounded-xl mb-3 flex flex-col items-center justify-center p-2 relative overflow-hidden"
                  style={{ backgroundColor: product.visual.primaryColor }}
                >
                  <div
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white mb-1 shadow-sm"
                    style={{ backgroundColor: product.visual.secondaryColor }}
                  >
                    {product.brand}
                  </div>
                  <span className="text-xs font-black text-white text-center leading-tight">
                    {product.visual.label}
                  </span>
                  <span className="text-[10px] text-white/80 mt-1">
                    {product.netQuantity}
                  </span>
                  {product.isOnOffer && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded">
                      {product.offerLabel}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-amber-400 mb-1">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{product.rating}</span>
                  <span className="text-slate-400">({product.reviewCount})</span>
                </div>

                <h3 className="font-semibold text-xs text-white line-clamp-2 mb-1">
                  {product.name}
                </h3>
                <p className="text-[11px] text-slate-400 mb-2">{product.netQuantity}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                <div>
                  <span className="text-sm font-bold text-white">
                    {formatINR(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-[11px] text-slate-500 line-through ml-1.5">
                      {formatINR(product.originalPrice)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => addItem(product, 1)}
                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  title="Add to cart"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
