'use client';

import React, { useState, useEffect } from 'react';
import { useSupermarketStore } from '@/stores/supermarketStore';
import { useUIStore } from '@/stores/uiStore';
import { useCartStore } from '@/stores/cartStore';
import { formatINR } from '@/lib/currency';
import { X, Star, ShoppingBag, Plus, Minus, Check, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

export function ProductDetailDrawer() {
  const { selectedProduct, setSelectedProduct, triggerFlyToCart } = useSupermarketStore();
  const { isProductDetailOpen, setProductDetailOpen, showToast } = useUIStore();
  const { addItem } = useCartStore();

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setAdded(false);
  }, [selectedProduct]);

  if (!isProductDetailOpen || !selectedProduct) return null;

  const discountPercent = selectedProduct.originalPrice
    ? Math.round(
        ((selectedProduct.originalPrice - selectedProduct.price) /
          selectedProduct.originalPrice) *
          100
      )
    : 0;

  const handleAddToCart = () => {
    addItem(selectedProduct, quantity);
    triggerFlyToCart(selectedProduct);
    setAdded(true);
    showToast(`Added ${quantity}x ${selectedProduct.name} to cart!`, 'success');
    setTimeout(() => setAdded(false), 2000);
  };

  const handleClose = () => {
    setProductDetailOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex justify-end">
      {/* Semi-transparent background overlay */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm pointer-events-auto transition-opacity"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl pointer-events-auto flex flex-col z-10 animate-slide-left overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              {selectedProduct.brand}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">{selectedProduct.subcategoryId}</span>
          </div>
          <button
            id="drawer-close-btn"
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {/* Packaging Illustration Display Card */}
          <div
            className="w-full h-52 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-inner"
            style={{ backgroundColor: selectedProduct.visual.primaryColor }}
          >
            {/* Packaging Badge */}
            {selectedProduct.visual.badge && (
              <div
                className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-slate-900 shadow-sm"
                style={{ backgroundColor: selectedProduct.visual.accentColor || '#facc15' }}
              >
                {selectedProduct.visual.badge}
              </div>
            )}

            {/* Discount Ribbon */}
            {discountPercent > 0 && (
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-rose-600 text-white font-black text-xs shadow-md">
                {discountPercent}% OFF
              </div>
            )}

            <div
              className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg text-white mb-2 shadow"
              style={{ backgroundColor: selectedProduct.visual.secondaryColor }}
            >
              {selectedProduct.brand}
            </div>

            <h3 className="text-xl font-black text-white text-center leading-tight max-w-[280px]">
              {selectedProduct.visual.label}
            </h3>

            {selectedProduct.visual.subLabel && (
              <p className="text-xs text-white/90 font-medium mt-1">
                {selectedProduct.visual.subLabel}
              </p>
            )}

            <div className="mt-3 px-3 py-1 rounded-full bg-black/20 text-white/90 text-xs font-semibold">
              Net Qty: {selectedProduct.netQuantity}
            </div>
          </div>

          {/* Title & Ratings */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md text-xs font-bold border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{selectedProduct.rating}</span>
              </div>
              <span className="text-xs text-slate-400">
                ({selectedProduct.reviewCount} customer reviews)
              </span>
            </div>

            <h1 className="text-lg font-bold text-white leading-snug">{selectedProduct.name}</h1>
            <p className="text-xs text-slate-400 mt-1">{selectedProduct.netQuantity}</p>
          </div>

          {/* Pricing & Stock Status */}
          <div className="flex items-baseline justify-between p-3.5 bg-slate-800/40 border border-slate-800 rounded-2xl">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">
                  {formatINR(selectedProduct.price)}
                </span>
                {selectedProduct.originalPrice && (
                  <span className="text-sm text-slate-500 line-through">
                    {formatINR(selectedProduct.originalPrice)}
                  </span>
                )}
              </div>
              {discountPercent > 0 && (
                <span className="text-xs font-bold text-emerald-400">
                  You save {formatINR(selectedProduct.originalPrice! - selectedProduct.price)} ({discountPercent}% off)
                </span>
              )}
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" /> In Stock
              </span>
              <span className="block text-[10px] text-slate-400">
                {selectedProduct.stockQuantity} units left
              </span>
            </div>
          </div>

          {/* Product Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Product Overview
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {selectedProduct.description}
            </p>
          </div>

          {/* Nutritional Information (if available) */}
          {selectedProduct.nutritionalInfo && (
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Nutritional Value (Per 100g)
              </h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Energy</span>
                  <span className="text-xs font-bold text-white">{selectedProduct.nutritionalInfo.calories}</span>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Protein</span>
                  <span className="text-xs font-bold text-white">{selectedProduct.nutritionalInfo.protein}</span>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Carbs</span>
                  <span className="text-xs font-bold text-white">{selectedProduct.nutritionalInfo.carbs}</span>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Fats</span>
                  <span className="text-xs font-bold text-white">{selectedProduct.nutritionalInfo.fat}</span>
                </div>
              </div>
            </div>
          )}

          {/* Storage & Shelf Life */}
          <div className="flex items-center gap-4 text-xs text-slate-400 p-3 bg-slate-800/30 rounded-xl">
            {selectedProduct.storageInstructions && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{selectedProduct.storageInstructions}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions: Quantity selector & Add To Cart Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 shrink-0 flex items-center gap-3">
          {/* Quantity Controls */}
          <div className="flex items-center border border-slate-700 rounded-xl bg-slate-800/80 p-1">
            <button
              id="drawer-qty-minus"
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-bold text-white">{quantity}</span>
            <button
              id="drawer-qty-plus"
              type="button"
              onClick={() => setQuantity(Math.min(selectedProduct.stockQuantity, quantity + 1))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            id="drawer-add-to-cart-btn"
            type="button"
            onClick={handleAddToCart}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${
              added
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added to Cart!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart • {formatINR(selectedProduct.price * quantity)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
