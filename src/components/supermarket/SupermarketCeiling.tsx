'use client';

import React from 'react';

export function SupermarketCeiling() {
  const ceilingY = 5.2;

  return (
    <group position={[0, ceilingY, 0]}>
      {/* Main Ceiling Plane */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[44, 60]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
      </mesh>

      {/* Industrial HVAC Air Ducts */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-8, -0.4, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 48, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
      </mesh>

      <mesh rotation={[0, 0, Math.PI / 2]} position={[8, -0.4, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 48, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Overhead Fluorescent Fixtures above Main Aisles */}
      {[-10, -4.5, 0, 4.5, 10].map((xPos) =>
        [-12, -4, 4, 12].map((zPos) => (
          <group key={`light-${xPos}-${zPos}`} position={[xPos, -0.15, zPos]}>
            {/* Fixture casing */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.3, 0.1, 3.2]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.4} roughness={0.4} />
            </mesh>
            {/* Emissive light tube */}
            <mesh position={[0, -0.06, 0]}>
              <boxGeometry args={[0.22, 0.04, 3.0]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))
      )}
    </group>
  );
}
