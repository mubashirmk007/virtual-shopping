'use client';

import React from 'react';
import { AisleConfig } from '@/types/supermarket';
import { Product } from '@/types/product';
import { ShelfUnit } from './ShelfUnit';
import { AisleSign3D } from './AisleSign3D';
import { EndCapDisplay } from './EndCapDisplay';

interface AisleZoneProps {
  aisle: AisleConfig;
  products: Product[];
}

export function AisleZone({ aisle, products }: AisleZoneProps) {
  const leftShelfId = `shelf-${aisle.number}-left`;
  const rightShelfId = `shelf-${aisle.number}-right`;

  // Find featured product for this aisle's endcap
  const featuredProduct = products.find(
    (p) => p.aisleId === aisle.id && (p.isFeatured || p.isBestSeller)
  ) || products.find((p) => p.aisleId === aisle.id);

  const halfWidth = aisle.width / 2;

  return (
    <group position={[0, 0, 0]}>
      {/* Overhead Suspended Category Sign */}
      <AisleSign3D aisle={aisle} />

      {/* Left Shelf Unit (faces into aisle center +X) */}
      <ShelfUnit
        shelfId={leftShelfId}
        side="left"
        products={products}
        position={[aisle.worldPosition.x - halfWidth, 0, aisle.worldPosition.z]}
      />

      {/* Right Shelf Unit (faces into aisle center -X) */}
      <ShelfUnit
        shelfId={rightShelfId}
        side="right"
        products={products}
        position={[aisle.worldPosition.x + halfWidth, 0, aisle.worldPosition.z]}
      />

      {/* Front End-Cap Promotional Display Facing the walkway */}
      {aisle.hasEndCap && (
        <EndCapDisplay
          position={[aisle.worldPosition.x, 0, aisle.worldPosition.z + 3.8]}
          featuredProduct={featuredProduct}
          bannerText={aisle.subtitle}
          badgeText="AISLE SPECIAL"
          themeColor={aisle.color}
        />
      )}
    </group>
  );
}
