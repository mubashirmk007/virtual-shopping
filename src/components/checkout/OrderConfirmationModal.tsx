'use client';

import React from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSupermarketStore } from '@/stores/supermarketStore';
import { formatINR } from '@/lib/currency';
import { CheckCircle2, ShoppingBag, MapPin, Calendar, Clock, ArrowRight } from 'lucide-react';

export function OrderConfirmationModal() {
  const { isOrderConfirmedOpen, setOrderConfirmedOpen, lastOrder } = useUIStore();
  const { navigateToEntrance } = useSupermarketStore();

  if (!isOrderConfirmedOpen || !lastOrder) return null;

  const handleReturnToShopping = () => {
    setOrderConfirmedOpen(false);
    navigateToEntrance();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Success Header */}
        <div className="p-6 text-center bg-emerald-600/10 border-b border-emerald-500/20">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3 shadow-lg">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Demo Order Placed!</h2>
          <p className="text-xs text-emerald-300 font-medium mt-1">
            Order Reference: <strong className="text-white">{lastOrder.orderId}</strong>
          </p>
          <div className="mt-2 text-[11px] text-slate-400 bg-slate-950/50 py-1 px-3 rounded-full inline-block">
            Demonstration Order • No real payment charged
          </div>
        </div>

        {/* Order Details Body */}
        <div className="p-5 space-y-4 max-h-80 overflow-y-auto scrollbar-thin text-xs">
          {/* Estimated Delivery Banner */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-800">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">Estimated Delivery in 30 Mins</span>
              <span className="text-[11px] text-slate-400">{lastOrder.estimatedDelivery}</span>
            </div>
          </div>

          {/* Delivery Location */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-800">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Delivering to {lastOrder.address.label}</span>
              <p className="text-slate-400 text-[11px] leading-relaxed mt-0.5">
                {lastOrder.address.street}, {lastOrder.address.city} - {lastOrder.address.pincode}
              </p>
            </div>
          </div>

          {/* Purchased Items List */}
          <div>
            <div className="flex items-center justify-between font-bold text-slate-300 mb-2">
              <span>Items Purchased ({lastOrder.items.length})</span>
              <span className="text-emerald-400 font-black">{formatINR(lastOrder.total)}</span>
            </div>
            <div className="space-y-1.5 divide-y divide-slate-800/60">
              {lastOrder.items.map((it) => (
                <div key={it.product.id} className="pt-1.5 flex justify-between text-slate-300">
                  <span className="truncate max-w-[240px]">
                    {it.quantity}x {it.product.name}
                  </span>
                  <span className="font-semibold text-white">
                    {formatINR(it.product.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
          <button
            id="order-continue-shopping-btn"
            type="button"
            onClick={handleReturnToShopping}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue 3D Supermarket Exploration</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
