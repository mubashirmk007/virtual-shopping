'use client';

import React, { useState } from 'react';
import { PRODUCTS } from '@/data/products';
import { useSupermarketStore } from '@/stores/supermarketStore';
import { useUIStore } from '@/stores/uiStore';
import { formatINR } from '@/lib/currency';
import { Sparkles, ChevronDown, ChevronUp, Star, ArrowRight, Eye } from 'lucide-react';

export function ShoppingDiscoveryPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'featured' | 'bestsellers' | 'offers' | 'recent'>('featured');

  const { navigateToProduct } = useSupermarketStore();
  const { setProductDetailOpen, recentlyViewed } = useUIStore();

  const featured = PRODUCTS.filter((p) => p.isFeatured).slice(0, 6);
  const bestsellers = PRODUCTS.filter((p) => p.isBestSeller).slice(0, 6);
  const offers = PRODUCTS.filter((p) => p.isOnOffer).slice(0, 6);

  const currentList =
    activeTab === 'featured'
      ? featured
      : activeTab === 'bestsellers'
      ? bestsellers
      : activeTab === 'offers'
      ? offers
      : recentlyViewed.length > 0
      ? recentlyViewed
      : featured;

  const handleInspect = (productId: string) => {
    navigateToProduct(productId);
    setProductDetailOpen(true);
  };

  return (
    <div className="fixed top-24 left-5 z-30 select-none">
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 w-72">
        {/* Header Toggle */}
        <div
          id="discovery-panel-toggle"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/60 cursor-pointer hover:bg-slate-800/90 transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-200">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold tracking-wide">Discovery & Bestsellers</span>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-white p-0.5 rounded"
            aria-label={isOpen ? 'Collapse panel' : 'Expand panel'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded Panel */}
        {isOpen && (
          <div className="p-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl mb-3 border border-slate-800 text-[10px]">
              {(['featured', 'bestsellers', 'offers', 'recent'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1 rounded-lg font-bold capitalize transition-all ${
                    activeTab === tab
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'recent' ? 'Recent' : tab === 'bestsellers' ? 'Top' : tab}
                </button>
              ))}
            </div>

            {/* Products List */}
            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin pr-1">
              {currentList.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleInspect(product.id)}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/80 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[9px] text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: product.visual.primaryColor }}
                    >
                      {product.brand.substring(0, 3).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-semibold text-white truncate leading-tight group-hover:text-emerald-400 transition-colors">
                        {product.name}
                      </h5>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {product.netQuantity} • {formatINR(product.price)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="p-1 rounded-lg bg-slate-800 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/20 shrink-0 ml-1.5 transition-colors"
                    title="Fly to product in 3D"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
