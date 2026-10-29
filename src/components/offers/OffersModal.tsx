'use client';

import React from 'react';
import { OFFERS } from '@/data/offers';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { X, Tag, Copy, Check } from 'lucide-react';

export function OffersModal() {
  const { isOffersOpen, setOffersOpen, showToast } = useUIStore();
  const { applyOfferCode, appliedOffer } = useCartStore();

  if (!isOffersOpen) return null;

  const handleApply = (code: string) => {
    const res = applyOfferCode(code);
    if (res.success) {
      showToast(res.message, 'success');
      setOffersOpen(false);
    } else {
      showToast(res.message, 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Supermarket Deals & Coupons</h2>
              <p className="text-xs text-slate-400">Save extra on your 3D grocery order</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOffersOpen(false)}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Coupons List */}
        <div className="p-5 space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
          {OFFERS.map((offer) => {
            const isApplied = appliedOffer?.code === offer.code;

            return (
              <div
                key={offer.id}
                className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-md font-black text-xs uppercase tracking-wider text-slate-950"
                      style={{ backgroundColor: offer.color }}
                    >
                      {offer.badge}
                    </span>
                    <span className="font-bold text-xs text-white truncate">{offer.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">{offer.description}</p>
                  <p className="text-[10px] text-slate-500">
                    Min order ₹{offer.minOrderValue} • {offer.expiresIn}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleApply(offer.code)}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 transition-all ${
                    isApplied
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                  }`}
                >
                  {isApplied ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Applied
                    </span>
                  ) : (
                    <span>Apply Code</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
