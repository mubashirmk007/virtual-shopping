'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { AisleConfig } from '@/types/supermarket';
import { useSupermarketStore } from '@/stores/supermarketStore';

interface AisleSign3DProps {
  aisle: AisleConfig;
}

export function AisleSign3D({ aisle }: AisleSign3DProps) {
  const { navigateToAisle, currentAisleId } = useSupermarketStore();
  const isCurrent = currentAisleId === aisle.id;

  // Generate canvas texture for double-sided hanging sign
  const signTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Dark background with brand accent border
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1024, 320);

    // Color banner border
    ctx.fillStyle = aisle.color;
    ctx.fillRect(0, 0, 1024, 20);
    ctx.fillRect(0, 300, 1024, 20);

    // Number circle badge on left
    ctx.fillStyle = aisle.color;
    ctx.beginPath();
    ctx.arc(140, 160, 90, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 88px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${aisle.number}`, 140, 192);

    // Aisle Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(aisle.signText.toUpperCase(), 280, 145);

    // Subtitle
    ctx.fillStyle = '#94a3b8';
    ctx.font = '32px sans-serif';
    ctx.fillText(aisle.subtitle, 280, 205);

    // AISLE Brand watermark
    ctx.fillStyle = aisle.color;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('AISLE 3D STORE', 980, 275);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return tex;
  }, [aisle]);

  const signMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: signTexture || undefined,
      roughness: 0.3,
      metalness: 0.1,
    });
  }, [signTexture]);

  return (
    <group
      position={[aisle.worldPosition.x, 3.8, aisle.worldPosition.z + 5.5]}
      onClick={(e) => {
        e.stopPropagation();
        navigateToAisle(aisle.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      {/* Hanging Suspension Wires */}
      {[-1.2, 1.2].map((wireX, idx) => (
        <mesh key={`wire-${idx}`} position={[wireX, 0.7, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 1.4, 8]} />
          <meshBasicMaterial color="#94a3b8" />
        </mesh>
      ))}

      {/* Main Sign Board (Double-Sided) */}
      <mesh position={[0, 0, 0]} material={signMaterial} castShadow>
        <boxGeometry args={[3.2, 1.0, 0.08]} />
      </mesh>

      {/* Glowing Border when active/selected */}
      {isCurrent && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3.26, 1.06, 0.06]} />
          <meshBasicMaterial color={aisle.color} transparent opacity={0.35} />
        </mesh>
      )}
    </group>
  );
}
