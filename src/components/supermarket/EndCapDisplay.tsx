'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Product } from '@/types/product';
import { ProductItem3D } from './ProductItem3D';

interface EndCapDisplayProps {
  position: [number, number, number];
  featuredProduct?: Product;
  bannerText?: string;
  badgeText?: string;
  themeColor?: string;
}

export function EndCapDisplay({
  position,
  featuredProduct,
  bannerText = 'PROMOTIONAL SPECIAL',
  badgeText = 'SPECIAL DEAL',
  themeColor = '#ea580c',
}: EndCapDisplayProps) {
  // Banner Texture
  const bannerTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = themeColor;
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AISLE FLASH PROMO', 256, 60);

    ctx.fillStyle = '#fef08a';
    ctx.font = '900 44px sans-serif';
    ctx.fillText(badgeText.toUpperCase(), 256, 130);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 28px sans-serif';
    ctx.fillText(bannerText, 256, 195);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [bannerText, badgeText, themeColor]);

  return (
    <group position={position}>
      {/* End-Cap Base Stand */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 0.95, 0.9, 24]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Mid Accent Ring */}
      <mesh position={[0, 0.88, 0]}>
        <cylinderGeometry args={[0.92, 0.92, 0.04, 24]} />
        <meshStandardMaterial color={themeColor} roughness={0.3} />
      </mesh>

      {/* Top Display Table Top Deck */}
      <mesh position={[0, 0.92, 0]} receiveShadow>
        <cylinderGeometry args={[0.88, 0.88, 0.05, 24]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} />
      </mesh>

      {/* Promotional Curved Header Arch & Board */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.5, 24, 1, true, 0, Math.PI]} />
        <meshStandardMaterial
          map={bannerTexture || undefined}
          side={THREE.DoubleSide}
          color="#ffffff"
          roughness={0.4}
        />
      </mesh>

      {/* Support Poles for Header */}
      {[-0.8, 0.8].map((poleX, idx) => (
        <mesh key={`pole-${idx}`} position={[poleX, 1.4, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.0, 8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} />
        </mesh>
      ))}

      {/* Featured 3D Product displayed right in the center! */}
      {featuredProduct && (
        <ProductItem3D
          product={featuredProduct}
          position={[0, 0.95, 0.15]}
          rotationY={0}
        />
      )}
    </group>
  );
}
