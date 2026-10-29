'use client';

import React, { useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { useSupermarketStore } from '@/stores/supermarketStore';
import { formatINR } from '@/lib/currency';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Tag, Truck, Check } from 'lucide-react';

export function CartDrawer() {
  const { isCartOpen, setCartOpen, setCheckoutOpen, showToast } = useUIStore();
  const { navigateToBilling } = useSupermarketStore();
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getDiscount,
    getDeliveryFee,
    getTotal,
    appliedOffer,
    applyOfferCode,
    removeOfferCode,
  } = useCartStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  if (!isCartOpen) return null;

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();

  const freeDeliveryThreshold = 499;
  const freeDeliveryProgress = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    const res = applyOfferCode(promoInput);
    if (res.success) {
      showToast(res.message, 'success');
      setPromoError('');
      setPromoInput('');
    } else {
      setPromoError(res.message);
    }
  };

  const handleCheckout = () => {
    // 1. Close cart drawer immediately so full 3D supermarket and trolley view is visible
    setCartOpen(false);

    // 2. Show brief notification that trolley is heading to billing counter
    showToast('Wheeling your trolley to the Billing Counter... 🛒', 'info');

    // 3. Smooth cinematic movement to the billing section, then open CheckoutModal on arrival
    navigateToBilling(() => {
      setCheckoutOpen(true);
    });
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex justify-end">
      {/* Background Dim */}
      <div
        onClick={() => setCartOpen(false)}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm pointer-events-auto transition-opacity"
      />

      {/* Cart Drawer Container */}
      <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl pointer-events-auto flex flex-col z-10 animate-slide-left overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Your Shopping Cart</h2>
              <p className="text-xs text-slate-400">{items.length} unique items</p>
            </div>
          </div>
          <button
            id="cart-close-btn"
            type="button"
            onClick={() => setCartOpen(false)}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Meter */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              {subtotal >= freeDeliveryThreshold ? (
                <span className="text-emerald-400 font-bold">You unlocked Free Delivery! 🎉</span>
              ) : (
                <span>
                  Add <strong className="text-white">{formatINR(freeDeliveryThreshold - subtotal)}</strong> more for Free Delivery
                </span>
              )}
            </span>
            <span className="text-[11px] text-slate-500">{Math.round(freeDeliveryProgress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${freeDeliveryProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-800 hover:border-slate-700/80 transition-all"
              >
                {/* Visual Thumbnail */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-[10px] font-bold text-white shrink-0 p-1 text-center leading-none"
                  style={{ backgroundColor: item.product.visual.primaryColor }}
                >
                  {item.product.visual.label.substring(0, 10)}
                </div>

                {/* Info */}
                <div className="flex-1 mx-3 min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate">
                    {item.product.name}
                  </h4>
                  <p className="text-[11px] text-slate-400">{item.product.netQuantity}</p>
                  <div className="text-xs font-bold text-emerald-400 mt-1">
                    {formatINR(item.product.price * item.quantity)}
                  </div>
                </div>

                {/* Quantity Controls & Delete */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center border border-slate-700 rounded-lg bg-slate-800 p-0.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.product.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <ShoppingBag className="w-12 h-12 stroke-1 mb-3 text-slate-600" />
              <p className="font-semibold text-sm text-slate-400">Your basket is empty</p>
              <p className="text-xs mt-1 max-w-[200px]">
                Explore the aisles in 3D, hover over products and add your favorites!
              </p>
            </div>
          )}
        </div>

        {/* Footer Billing Breakdown */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 shrink-0 space-y-3">
            {/* Promo Code Form */}
            {!appliedOffer ? (
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="promo-code-input"
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Enter Coupon (e.g. SUPER3D)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  id="promo-code-apply-btn"
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 border border-slate-700"
                >
                  Apply
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                <span className="flex items-center gap-1 font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Coupon &apos;{appliedOffer.code}&apos; Applied
                </span>
                <button
                  type="button"
                  onClick={removeOfferCode}
                  className="text-rose-400 hover:underline text-[11px] font-semibold"
                >
                  Remove
                </button>
              </div>
            )}

            {promoError && <p className="text-[11px] text-rose-400">{promoError}</p>}

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs pt-1 border-t border-slate-800/80">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="text-white font-medium">{formatINR(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount Savings</span>
                  <span>- {formatINR(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400">
                <span>Delivery Fee</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-400 font-bold">FREE</span>
                  ) : (
                    formatINR(deliveryFee)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                <span>Total Amount</span>
                <span className="text-emerald-400">{formatINR(total)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                id="cart-clear-btn"
                type="button"
                onClick={clearCart}
                className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 text-xs font-semibold"
                title="Clear Cart"
              >
                Clear
              </button>
              <button
                id="cart-checkout-btn"
                type="button"
                onClick={handleCheckout}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
