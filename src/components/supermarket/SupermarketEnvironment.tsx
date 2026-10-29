'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';

export function SupermarketEnvironment() {
  const wallHeight = 5.2;

  // Back Wall Billboard Banner Texture
  const backBannerTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, 1024, 256);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AISLE 3D SUPERMARKET', 512, 100);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('EXPLORE IN 3D • STEP INSIDE • SHOP FRESH TODAY', 512, 170);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* Back North Wall */}
      <mesh position={[0, wallHeight / 2, -28]} receiveShadow>
        <planeGeometry args={[44, wallHeight]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </mesh>

      {/* Back Wall Large Brand Billboard */}
      <mesh position={[0, 3.4, -27.9]}>
        <planeGeometry args={[16, 2.8]} />
        <meshStandardMaterial map={backBannerTexture || undefined} roughness={0.4} />
      </mesh>

      {/* West Left Wall */}
      <mesh position={[-20, wallHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[60, wallHeight]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
      </mesh>

      {/* East Right Wall */}
      <mesh position={[20, wallHeight / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[60, wallHeight]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
      </mesh>

      {/* Front Entrance South Wall with Glass Portal Frame */}
      <mesh position={[-12, wallHeight / 2, 26]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[16, wallHeight]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>

      <mesh position={[12, wallHeight / 2, 26]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[16, wallHeight]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>

      {/* Entrance Glass Sliding Doors */}
      <mesh position={[0, 2.2, 26]}>
        <planeGeometry args={[8, 4.4]} />
        <meshPhysicalMaterial
          color="#e0f2fe"
          transparent
          opacity={0.35}
          roughness={0.1}
          transmission={0.8}
        />
      </mesh>

      {/* Concrete Structural Pillars */}
      {[-16, 0, 16].map((colX, cIdx) => (
        <mesh key={`pillar-${cIdx}`} position={[colX, wallHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, wallHeight, 0.9]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}
