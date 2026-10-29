'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { AppHeader } from '@/components/layout/AppHeader';
import { ProductTooltip } from '@/components/products/ProductTooltip';
import { ProductDetailDrawer } from '@/components/products/ProductDetailDrawer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { SupermarketMinimap } from '@/components/supermarket/SupermarketMinimap';
import { GameMovementHUD } from '@/components/supermarket/GameMovementHUD';
import { SubsiVoiceHUD } from '@/components/subsi/SubsiVoiceHUD';
import { DeliveryModal } from '@/components/layout/DeliveryModal';
import { CheckoutModal } from '@/components/checkout/CheckoutModal';
import { OrderConfirmationModal } from '@/components/checkout/OrderConfirmationModal';
import { OffersModal } from '@/components/offers/OffersModal';
import { WelcomeTutorial } from '@/components/onboarding/WelcomeTutorial';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { ShoppingDiscoveryPanel } from '@/components/products/ShoppingDiscoveryPanel';

// Client-only dynamic import of the 3D Canvas
const SupermarketCanvas = dynamic(
  () =>
    import('@/components/supermarket/SupermarketCanvas').then(
      (mod) => mod.SupermarketCanvas
    ),
  { ssr: false }
);

export default function SupermarketPage() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Layer B: Top Global Header & Category Shortcuts */}
      <AppHeader />

      {/* Layer A: Real 3D Supermarket Canvas */}
      <SupermarketCanvas />

      {/* 3D Product Interactive Overlays */}
      <ProductTooltip />
      <ProductDetailDrawer />

      {/* Shopping Cart Drawer */}
      <CartDrawer />

      {/* Interactive Supermarket Minimap */}
      <SupermarketMinimap />

      {/* Shopping Discovery & Bestsellers Panel */}
      <ShoppingDiscoveryPanel />

      {/* Game-like Movement Controls HUD (Tactile D-Pad, Virtual Joystick, Turbo Sprint) */}
      <GameMovementHUD />

      {/* Subsi Voice Shopping Assistant HUD (Wake-word, Voice STT/TTS, Holographic Avatar) */}
      <SubsiVoiceHUD />

      {/* Modals & Dialogs */}
      <DeliveryModal />
      <CheckoutModal />
      <OrderConfirmationModal />
      <OffersModal />
      <WelcomeTutorial />
      <ToastContainer />
    </main>
  );
}
