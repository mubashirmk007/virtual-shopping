'use client';

import React from 'react';
import { SearchBar } from './SearchBar';
import { CategoryBar } from './CategoryBar';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { useSupermarketStore } from '@/stores/supermarketStore';
import { formatINR } from '@/lib/currency';
import { ShoppingBag, MapPin, Tag, ChevronDown, Sparkles } from 'lucide-react';

export function AppHeader() {
  const [mounted, setMounted] = React.useState(false);
  const { getTotalItemsCount, getTotal, deliveryAddress } = useCartStore();
  const { setCartOpen, setOffersOpen, setDeliveryAddressOpen, setTutorialOpen } = useUIStore();
  const { navigateToEntrance } = useSupermarketStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = mounted ? getTotalItemsCount() : 0;
  const cartTotal = mounted ? getTotal() : 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex flex-col backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80 shadow-2xl transition-all">
      {/* Top Banner / Controls Bar */}
      <div className="flex items-center justify-between px-4 lg:px-8 py-2.5 gap-3 max-w-7xl mx-auto w-full">
        {/* Brand Logo & Tagline */}
        <div
          onClick={navigateToEntrance}
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0 group"
        >
          {/* Original Minimalist AISLE Logo */}
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-105 transition-transform">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-white"
            >
              {/* Isometric 3D Aisle / Cart Motif */}
              <path d="M4 4h2l2 11h11l2-8H7" />
              <circle cx="9" cy="19" r="1.5" fill="currentColor" />
              <circle cx="17" cy="19" r="1.5" fill="currentColor" />
              <path d="M12 7l3 3m0-3l-3 3" stroke="#86efac" strokeWidth="2" />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-wider text-white">AISLE</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                3D
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Step Inside • Shop in 3D
            </span>
          </div>
        </div>

        {/* Delivery Location Selector */}
        <button
          id="header-delivery-btn"
          type="button"
          onClick={() => setDeliveryAddressOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-left hover:border-slate-700 transition-colors"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div className="flex flex-col text-[11px]">
            <span className="text-slate-400 text-[10px] leading-tight">Deliver in 30 mins</span>
            <span className="font-semibold text-white truncate max-w-[120px] leading-tight">
              {deliveryAddress.label} • {deliveryAddress.city}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
        </button>

        {/* Global Instant Search Bar */}
        <div className="flex-1 max-w-md mx-2">
          <SearchBar />
        </div>

        {/* Right Action Icons: Offers & Shopping Cart */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Offers Button */}
          <button
            id="header-offers-btn"
            type="button"
            onClick={() => setOffersOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-colors"
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Offers</span>
          </button>

          {/* Tutorial / Help Guide button */}
          <button
            id="header-tour-btn"
            type="button"
            onClick={() => setTutorialOpen(true)}
            className="hidden lg:flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium"
            title="Interactive Tutorial"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tour</span>
          </button>

          {/* Cart Trigger with live count & subtotal */}
          <button
            id="header-cart-btn"
            type="button"
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all duration-200"
            aria-label="View Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-white" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center animate-bounce">
                  {totalItems}
                </span>
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-emerald-100 font-medium leading-tight">My Cart</span>
              <span className="text-xs font-bold leading-tight">
                {cartTotal > 0 ? formatINR(cartTotal) : '₹0'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Category Shortcuts Navigation Bar */}
      <CategoryBar />
    </header>
  );
}
