'use client';

import React, { useMemo } from 'react';
import { Product } from '@/types/product';
import { ProductItem3D } from './ProductItem3D';

interface ShelfUnitProps {
  shelfId: string;
  side: 'left' | 'right';
  products: Product[];
  position: [number, number, number];
}

const TIER_HEIGHTS = [0.28, 0.88, 1.48, 2.08];
const SHELF_WIDTH = 4.2;
const SHELF_DEPTH = 0.7;
const SHELF_HEIGHT = 2.5;

export function ShelfUnit({ shelfId, side, products, position }: ShelfUnitProps) {
  // Shelf orientation: left shelf faces +X (rotation Y = Math.PI/2), right shelf faces -X (rotation Y = -Math.PI/2)
  const facingRotation = side === 'left' ? Math.PI / 2 : -Math.PI / 2;

  // Filter products belonging to this specific shelf
  const shelfProducts = useMemo(() => {
    return products.filter((p) => p.shelfId === shelfId);
  }, [products, shelfId]);

  return (
    <group position={position} rotation={[0, facingRotation, 0]}>
      {/* Heavy-duty steel back panel */}
      <mesh position={[0, SHELF_HEIGHT / 2, -SHELF_DEPTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[SHELF_WIDTH, SHELF_HEIGHT, 0.04]} />
        <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Vertical upright frame columns (Left and Right) */}
      {[-SHELF_WIDTH / 2, SHELF_WIDTH / 2].map((x, idx) => (
        <mesh key={`post-${idx}`} position={[x, SHELF_HEIGHT / 2, 0]} castShadow>
          <boxGeometry args={[0.08, SHELF_HEIGHT, SHELF_DEPTH]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Base Plinth / Kickplate */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[SHELF_WIDTH, 0.24, SHELF_DEPTH]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* 4 Shelf Horizontal Metal Decks */}
      {TIER_HEIGHTS.map((yTier, tierIdx) => (
        <group key={`deck-${tierIdx}`} position={[0, yTier, 0]}>
          {/* Main horizontal shelf surface */}
          <mesh position={[0, 0, 0]} receiveShadow castShadow>
            <boxGeometry args={[SHELF_WIDTH - 0.08, 0.04, SHELF_DEPTH - 0.04]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.2} />
          </mesh>

          {/* Front Price Strip Channel (Red/Green supermarket edge) */}
          <mesh position={[0, 0, SHELF_DEPTH / 2 - 0.02]}>
            <boxGeometry args={[SHELF_WIDTH - 0.08, 0.035, 0.015]} />
            <meshStandardMaterial color="#16a34a" roughness={0.5} />
          </mesh>

          {/* Simulated small price labels along shelf edge */}
          {[-1.5, -0.75, 0, 0.75, 1.5].map((labelX, lIdx) => (
            <mesh key={`label-${lIdx}`} position={[labelX, 0, SHELF_DEPTH / 2 - 0.01]}>
              <planeGeometry args={[0.22, 0.026]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          ))}
        </group>
      ))}

      {/* Render Products physically positioned on their assigned tier and slot */}
      {shelfProducts.map((prod) => {
        const tierY = TIER_HEIGHTS[prod.shelfTier] || TIER_HEIGHTS[1];
        // Calculate X offset along shelf width from shelfSlot (-1.5 to +1.5)
        const slotCount = 4;
        const slotStep = (SHELF_WIDTH - 1.0) / Math.max(1, slotCount - 1);
        const slotX = - (SHELF_WIDTH - 1.0) / 2 + (prod.shelfSlot % slotCount) * slotStep;
        // Position slightly in front of the back panel
        const slotZ = 0.05;

        return (
          <ProductItem3D
            key={prod.id}
            product={prod}
            position={[slotX, tierY + 0.02, slotZ]}
            rotationY={0}
          />
        );
      })}
    </group>
  );
}
