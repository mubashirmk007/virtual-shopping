'use client';

import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Product } from '@/types/product';
import { ProductPackage3D } from './ProductPackage3D';
import { useSupermarketStore } from '@/stores/supermarketStore';
import { useUIStore } from '@/stores/uiStore';

interface ProductItem3DProps {
  product: Product;
  position: [number, number, number];
  rotationY?: number;
}

export function ProductItem3D({ product, position, rotationY = 0 }: ProductItem3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const {
    setHoveredProduct,
    setSelectedProduct,
    focusedProductId,
    selectedProduct,
  } = useSupermarketStore();

  const { setProductDetailOpen, addRecentlyViewed } = useUIStore();

  const isFocused = focusedProductId === product.id;
  const isSelected = selectedProduct?.id === product.id;

  // Smooth hover and selection animation loop
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Target scale: scale up slightly on hover or focus
    const targetScale = hovered ? 1.08 : isFocused ? 1.05 : 1.0;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 12);

    // Target Y elevation: slightly lift off shelf on hover
    const targetY = position[1] + (hovered ? 0.05 : 0) + (isFocused ? Math.sin(Date.now() * 0.005) * 0.03 : 0);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, delta * 12);
  });

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    setHovered(true);
    setHoveredProduct(product);
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'default';
    setHovered(false);
    setHoveredProduct(null);
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setSelectedProduct(product);
    addRecentlyViewed(product);
    setProductDetailOpen(true);
  };

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1], position[2]]}
      rotation={[0, rotationY, 0]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* 3D Package Geometry */}
      <ProductPackage3D product={product} />

      {/* Pulsing Selection Spotlight Ring when focused from Search */}
      {(isFocused || isSelected) && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.26, 32]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Offer badge tag hovering above product if on offer */}
      {product.isOnOffer && (
        <group position={[0, (product.visual.dimensions?.height || 0.38) + 0.08, 0]}>
          <mesh rotation={[0, 0, 0]}>
            <planeGeometry args={[0.28, 0.08]} />
            <meshBasicMaterial color="#ea580c" />
          </mesh>
        </group>
      )}
    </group>
  );
}
