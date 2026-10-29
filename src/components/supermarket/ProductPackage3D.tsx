'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Product } from '@/types/product';
import { generateProductTexture } from '@/lib/textureGenerator';

interface ProductPackage3DProps {
  product: Product;
}

export function ProductPackage3D({ product }: ProductPackage3DProps) {
  const { visual } = product;
  const packageType = visual.packageType;
  const dim = visual.dimensions || {};
  const width = dim.width || 0.28;
  const height = dim.height || 0.38;
  const depth = dim.depth || 0.22;
  const radius = dim.radius || 0.12;

  const texture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return generateProductTexture(visual);
  }, [visual]);

  // Front material with texture
  const frontMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: texture || undefined,
      color: visual.primaryColor,
      roughness: 0.35,
      metalness: packageType === 'can' ? 0.6 : 0.05,
    });
  }, [texture, visual.primaryColor, packageType]);

  // Side/Back body material
  const bodyMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: visual.secondaryColor || visual.primaryColor,
      roughness: 0.4,
      metalness: packageType === 'can' ? 0.6 : 0.05,
    });
  }, [visual.secondaryColor, visual.primaryColor, packageType]);

  // Cap / Trim accent material
  const accentMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: visual.accentColor || '#ffffff',
      roughness: 0.3,
      metalness: packageType === 'can' ? 0.8 : 0.1,
    });
  }, [visual.accentColor, packageType]);

  // 1. GABLE-TOP CARTON (Milk, Juice)
  if (packageType === 'carton') {
    const bodyHeight = height * 0.82;
    const roofHeight = height * 0.18;
    return (
      <group position={[0, height / 2, 0]}>
        {/* Main rectangular base body */}
        <mesh position={[0, -roofHeight / 2, 0]} material={[bodyMaterial, bodyMaterial, bodyMaterial, bodyMaterial, frontMaterial, bodyMaterial]} castShadow>
          <boxGeometry args={[width, bodyHeight, depth]} />
        </mesh>
        {/* Slanted Gable-top fold roof */}
        <mesh position={[0, bodyHeight / 2, 0]} material={bodyMaterial}>
          <coneGeometry args={[width * 0.55, roofHeight, 4]} />
        </mesh>
        {/* Screw plastic cap */}
        <mesh position={[width * 0.18, bodyHeight / 2 + roofHeight * 0.45, depth * 0.12]} material={accentMaterial}>
          <cylinderGeometry args={[0.035, 0.035, 0.03, 12]} />
        </mesh>
      </group>
    );
  }

  // 2. BOTTLE (Water, Soda, Oil, Shampoo, Cleaner)
  if (packageType === 'bottle') {
    const bodyH = height * 0.72;
    const neckH = height * 0.18;
    const capH = height * 0.1;
    return (
      <group position={[0, height / 2, 0]}>
        {/* Main bottle cylinder with wrap label */}
        <mesh position={[0, -height / 2 + bodyH / 2, 0]} material={frontMaterial} castShadow>
          <cylinderGeometry args={[radius, radius, bodyH, 20]} />
        </mesh>
        {/* Tapered shoulder & neck */}
        <mesh position={[0, -height / 2 + bodyH + neckH / 2, 0]} material={bodyMaterial}>
          <cylinderGeometry args={[radius * 0.45, radius, neckH, 16]} />
        </mesh>
        {/* Screw Cap */}
        <mesh position={[0, -height / 2 + bodyH + neckH + capH / 2, 0]} material={accentMaterial}>
          <cylinderGeometry args={[radius * 0.48, radius * 0.48, capH, 14]} />
        </mesh>
      </group>
    );
  }

  // 3. CAN (Sodas, Energy Drinks, Ghee tins)
  if (packageType === 'can') {
    return (
      <group position={[0, height / 2, 0]}>
        {/* Can cylinder body */}
        <mesh position={[0, 0, 0]} material={frontMaterial} castShadow>
          <cylinderGeometry args={[radius, radius, height * 0.94, 24]} />
        </mesh>
        {/* Top Rim */}
        <mesh position={[0, height * 0.47, 0]} material={accentMaterial}>
          <cylinderGeometry args={[radius * 0.94, radius, height * 0.06, 24]} />
        </mesh>
        {/* Bottom Rim */}
        <mesh position={[0, -height * 0.47, 0]} material={accentMaterial}>
          <cylinderGeometry args={[radius, radius * 0.94, height * 0.06, 24]} />
        </mesh>
      </group>
    );
  }

  // 4. BAG / POUCH (Rice, Atta, Dals, Chips, Namkeen)
  if (packageType === 'bag') {
    return (
      <group position={[0, height / 2, 0]}>
        {/* Center pillow body */}
        <mesh position={[0, 0, 0]} material={[bodyMaterial, bodyMaterial, bodyMaterial, bodyMaterial, frontMaterial, bodyMaterial]} castShadow>
          <boxGeometry args={[width, height * 0.88, depth]} />
        </mesh>
        {/* Top crimped seal ridge */}
        <mesh position={[0, height * 0.46, 0]} material={bodyMaterial}>
          <boxGeometry args={[width * 0.98, height * 0.08, depth * 0.25]} />
        </mesh>
        {/* Bottom folded gusset */}
        <mesh position={[0, -height * 0.46, 0]} material={bodyMaterial}>
          <boxGeometry args={[width * 0.96, height * 0.06, depth * 0.8]} />
        </mesh>
      </group>
    );
  }

  // 5. JAR / TUB (Peanut butter, Jam, Curd, Honey, Spices)
  if (packageType === 'jar') {
    const jarH = height * 0.82;
    const lidH = height * 0.18;
    return (
      <group position={[0, height / 2, 0]}>
        {/* Glass / Plastic Tub Body */}
        <mesh position={[0, -lidH / 2, 0]} material={frontMaterial} castShadow>
          <cylinderGeometry args={[radius, radius * 0.95, jarH, 20]} />
        </mesh>
        {/* Metallic / Plastic Screw Lid */}
        <mesh position={[0, jarH / 2, 0]} material={accentMaterial}>
          <cylinderGeometry args={[radius * 1.04, radius * 1.04, lidH, 20]} />
        </mesh>
      </group>
    );
  }

  // 6. PRODUCE (Apples, Oranges, Tomatoes, Bananas)
  if (packageType === 'produce') {
    return (
      <group position={[0, height / 2, 0]}>
        {/* Organic round produce mesh */}
        <mesh position={[0, 0, 0]} material={frontMaterial} castShadow>
          <sphereGeometry args={[radius || 0.14, 20, 16]} />
        </mesh>
        {/* Small natural stem / leaf badge */}
        <mesh position={[0, (radius || 0.14) * 0.92, 0]}>
          <cylinderGeometry args={[0.015, 0.01, 0.06, 6]} />
          <meshStandardMaterial color="#166534" roughness={0.8} />
        </mesh>
      </group>
    );
  }

  // DEFAULT / BOX (Cereals, Biscuits, Soaps, Toothpaste, Pasta, Biryani Kit)
  return (
    <group position={[0, height / 2, 0]}>
      <mesh
        position={[0, 0, 0]}
        material={[bodyMaterial, bodyMaterial, bodyMaterial, bodyMaterial, frontMaterial, bodyMaterial]}
        castShadow
      >
        <boxGeometry args={[width, height, depth]} />
      </mesh>
    </group>
  );
}
