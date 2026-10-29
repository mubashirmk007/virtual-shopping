'use client';

import React from 'react';

export function SupermarketLighting() {
  return (
    <>
      {/* Ambient Base Light: Warm, bright supermarket ambiance */}
      <ambientLight intensity={0.9} color="#ffffff" />

      {/* Main Overhead Directional Flood Light */}
      <directionalLight
        position={[8, 12, 10]}
        intensity={1.2}
        color="#fffbeb"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0005}
      />

      {/* Secondary Soft Fill Light to avoid harsh dark crevices */}
      <directionalLight position={[-8, 10, -10]} intensity={0.65} color="#f0f9ff" />

      {/* Warm Hemisphere Light: Bounce light from the floor */}
      <hemisphereLight args={['#ffffff', '#e2e8f0', 0.6]} />

      {/* Soft Point Lights along Main Walkway & Aisles */}
      <pointLight position={[0, 4.2, 8]} intensity={0.8} distance={18} decay={2} color="#fef9c3" />
      <pointLight position={[0, 4.2, -8]} intensity={0.8} distance={18} decay={2} color="#fef9c3" />
      <pointLight position={[-8, 4.0, 4]} intensity={0.6} distance={14} decay={2} color="#ffffff" />
      <pointLight position={[8, 4.0, 4]} intensity={0.6} distance={14} decay={2} color="#ffffff" />
    </>
  );
}
