'use client';

import React from 'react';
import { SupermarketLighting } from './SupermarketLighting';
import { SupermarketFloor } from './SupermarketFloor';
import { SupermarketCeiling } from './SupermarketCeiling';
import { SupermarketEnvironment } from './SupermarketEnvironment';
import { CameraController } from './CameraController';
import { CheckoutCounter3D } from './CheckoutCounter3D';
import { AisleZone } from './AisleZone';
import { SupermarketTrolleyView } from './SupermarketTrolleyView';
import { AISLES } from '@/data/aisles';
import { PRODUCTS } from '@/data/products';

export function SupermarketScene() {
  const aislesToRender = AISLES.filter((a) => a.number > 0);

  return (
    <>
      {/* Dynamic Camera Controller with Bounds Clamping and GSAP Fly-to Transitions */}
      <CameraController />

      {/* First-Person Supermarket Trolley Basket with Holding Hands */}
      <SupermarketTrolleyView />

      {/* Realistic Overhead & Ambient Supermarket Illumination */}
      <SupermarketLighting />

      {/* Polished Terrazzo Supermarket Floor with Guidance Markings */}
      <SupermarketFloor />

      {/* Suspended Industrial Ceiling with Track Fixtures */}
      <SupermarketCeiling />

      {/* Outer Store Walls, Glass Sliding Entrance & Brand Signage */}
      <SupermarketEnvironment />

      {/* Checkout Counter section at the entrance */}
      <CheckoutCounter3D position={[0, 0, 16.5]} />

      {/* All Supermarket Aisles & Multi-Tier Gondola Shelves */}
      {aislesToRender.map((aisle) => (
        <AisleZone key={aisle.id} aisle={aisle} products={PRODUCTS} />
      ))}
    </>
  );
}
