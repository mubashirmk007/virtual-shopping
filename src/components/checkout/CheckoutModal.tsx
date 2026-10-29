'use client';

import React, { useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { formatINR } from '@/lib/currency';
import { soundManager } from '@/lib/sound';
import confetti from 'canvas-confetti';
import { X, ShieldCheck, MapPin, Clock, CreditCard, Banknote, QrCode } from 'lucide-react';

export function CheckoutModal() {
  const { isCheckoutOpen, setCheckoutOpen, setOrderConfirmedOpen, setLastOrder } = useUIStore();
  const { items, deliveryAddress, getSubtotal, getDiscount, getDeliveryFee, getTotal, clearCart } =
    useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod' | 'card'>('upi');
  const [deliverySlot, setDeliverySlot] = useState('Instant 30 Mins (Express)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCheckoutOpen) return null;

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();

  const handlePlaceOrder = () => {
    if (items.length === 0) return;
    setIsSubmitting(true);

    setTimeout(() => {
      // 1. Generate unique order ID
      const orderId = `AISLE-${Math.floor(100000 + Math.random() * 900000)}`;

      // 2. Play celebratory fanfare
      soundManager.playOrderCelebration();

      // 3. Fire confetti blast
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#15803d', '#22c55e', '#84cc16', '#facc15', '#f97316'],
        });
      } catch {}

      // 4. Save order record
      setLastOrder({
        orderId,
        items: [...items],
        subtotal,
        discount,
        deliveryFee,
        total,
        address: deliveryAddress,
        date: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        estimatedDelivery: '30 minutes (Express Delivery)',
      });

      // 5. Clear cart and switch to confirmation screen
      clearCart();
      setIsSubmitting(false);
      setCheckoutOpen(false);
      setOrderConfirmedOpen(true);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Review & Checkout</h2>
              <p className="text-xs text-slate-400">Demo Order • Instant 30-Min Delivery</p>
            </div>
          </div>
          <button
            id="checkout-close-btn"
            type="button"
            onClick={() => setCheckoutOpen(false)}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 scrollbar-thin">
          {/* Delivery Address Review */}
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <MapPin className="w-4 h-4" /> Deliver to {deliveryAddress.label}
              </span>
              <span className="text-[10px] text-slate-400">⚡ 30 Mins</span>
            </div>
            <p className="text-xs text-white font-medium">{deliveryAddress.name}</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              {deliveryAddress.street}, {deliveryAddress.city} - {deliveryAddress.pincode}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Phone: {deliveryAddress.phone}</p>
          </div>

          {/* Delivery Slot Option */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">Select Delivery Slot</label>
            <div className="grid grid-cols-2 gap-2">
              {['Instant 30 Mins (Express)', 'Evening Slot (6 PM - 8 PM)'].map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setDeliverySlot(slot)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                    deliverySlot === slot
                      ? 'border-emerald-500 bg-emerald-500/10 text-white'
                      : 'border-slate-800 bg-slate-800/30 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-400 mb-1" />
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Demo Payment Method Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">Select Payment Method (Demo)</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-slate-800 bg-slate-800/30 text-slate-400 hover:border-slate-700'
                }`}
              >
                <QrCode className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                <span className="text-xs font-bold block">UPI / QR</span>
                <span className="text-[10px] text-slate-500">GooglePay/PhonePe</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-slate-800 bg-slate-800/30 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Banknote className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                <span className="text-xs font-bold block">Pay on Delivery</span>
                <span className="text-[10px] text-slate-500">Cash / UPI at Door</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  paymentMethod === 'card'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-slate-800 bg-slate-800/30 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4 mx-auto mb-1 text-sky-400" />
                <span className="text-xs font-bold block">Card</span>
                <span className="text-[10px] text-slate-500">Credit / Debit</span>
              </button>
            </div>
          </div>

          {/* Cart Item Snapshot */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">Order Items ({items.length})</label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
              {items.map((it) => (
                <div key={it.product.id} className="flex justify-between text-xs py-1 border-b border-slate-800/50">
                  <span className="text-slate-300 truncate max-w-[280px]">
                    {it.quantity}x {it.product.name}
                  </span>
                  <span className="font-semibold text-white">
                    {formatINR(it.product.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Item Total</span>
              <span className="text-white">{formatINR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Promo Discount</span>
                <span>- {formatINR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Delivery Charges</span>
              <span>{deliveryFee === 0 ? <strong className="text-emerald-400">FREE</strong> : formatINR(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-white pt-1.5 border-t border-slate-800">
              <span>Grand Total</span>
              <span className="text-emerald-400">{formatINR(total)}</span>
            </div>
          </div>
        </div>

        {/* Place Order CTA */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
          <button
            id="place-order-btn"
            type="button"
            disabled={isSubmitting || items.length === 0}
            onClick={handlePlaceOrder}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <span>Confirming Demo Order...</span>
            ) : (
              <span>Place Demo Order • {formatINR(total)}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
