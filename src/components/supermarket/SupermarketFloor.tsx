'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { generateFloorTexture } from '@/lib/textureGenerator';

export function SupermarketFloor() {
  const floorTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return generateFloorTexture();
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* Main Supermarket Tile Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[44, 60]} />
        <meshStandardMaterial
          map={floorTexture || undefined}
          color="#f8fafc"
          roughness={0.28}
          metalness={0.08}
        />
      </mesh>

      {/* Entrance Welcome Floor Mat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 19.5]} receiveShadow>
        <planeGeometry args={[7, 3.5]} />
        <meshStandardMaterial color="#15803d" roughness={0.9} />
      </mesh>

      {/* Welcome Mat Inner Border & Text */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 19.5]}>
        <planeGeometry args={[6.6, 3.1]} />
        <meshStandardMaterial color="#14532d" roughness={0.8} />
      </mesh>

      {/* Yellow Walkway Guidance Lines */}
      {[-1.8, 1.8].map((xOffset, i) => (
        <mesh
          key={`line-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[xOffset, 0.002, 6]}
        >
          <planeGeometry args={[0.08, 26]} />
          <meshBasicMaterial color="#facc15" opacity={0.65} transparent />
        </mesh>
      ))}

      {/* Cross-Aisle Guidance Stripes at Z = 0 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[32, 0.08]} />
        <meshBasicMaterial color="#facc15" opacity={0.65} transparent />
      </mesh>
    </group>
  );
}
