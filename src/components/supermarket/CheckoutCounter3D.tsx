'use client';

import React from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSupermarketStore } from '@/stores/supermarketStore';

interface CheckoutCounter3DProps {
  position: [number, number, number];
}

export function CheckoutCounter3D({ position }: CheckoutCounter3DProps) {
  const { setCheckoutOpen } = useUIStore();
  const { navigateToBilling } = useSupermarketStore();

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        navigateToBilling(() => {
          setCheckoutOpen(true);
        });
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {/* Checkout Counter Base Unit */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.9, 1.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>

      {/* Stainless Steel Conveyor Belt Bed */}
      <mesh position={[-0.8, 0.92, 0]} receiveShadow>
        <boxGeometry args={[2.4, 0.04, 0.9]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>

      {/* Cashier Payment Register & Touchscreen Terminal */}
      <group position={[1.2, 1.15, 0]}>
        {/* Terminal Stand */}
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.04, 0.06, 0.3, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.7} />
        </mesh>
        {/* POS Screen */}
        <mesh position={[0, 0, 0]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.38, 0.28, 0.04]} />
          <meshStandardMaterial color="#0284c7" roughness={0.2} />
        </mesh>
        {/* Barcode Handheld Scanner */}
        <mesh position={[0.26, -0.05, 0.1]}>
          <boxGeometry args={[0.08, 0.18, 0.08]} />
          <meshStandardMaterial color="#ea580c" roughness={0.4} />
        </mesh>
      </group>

      {/* Overhead Checkout Lane Light Indicator Pole */}
      <mesh position={[1.9, 1.8, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.8, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
      </mesh>

      {/* Green Glowing Lane Open Sign */}
      <mesh position={[1.9, 2.7, 0]}>
        <boxGeometry args={[0.6, 0.3, 0.1]} />
        <meshBasicMaterial color="#16a34a" />
      </mesh>

      {/* Stack of Green Supermarket Shopping Baskets */}
      {[0, 0.08, 0.16, 0.24].map((yOffset, bIdx) => (
        <mesh key={`basket-${bIdx}`} position={[-2.4, 0.2 + yOffset, 0]} castShadow>
          <boxGeometry args={[0.55, 0.25, 0.4]} />
          <meshStandardMaterial color="#15803d" roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}
