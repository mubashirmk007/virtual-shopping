'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { SupermarketScene } from './SupermarketScene';
import { WebGlFallback } from '../fallback/WebGlFallback';
import { ShoppingBag, Loader2 } from 'lucide-react';

function CanvasLoader() {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white select-none">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/20 animate-pulse">
          <ShoppingBag className="w-8 h-8 text-white" />
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-emerald-500/30 blur-md -z-10" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-white mb-2">AISLE 3D SUPERMARKET</h2>
      <p className="text-sm text-slate-400 mb-6 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
        Stocking shelves & preparing aisles...
      </p>
      <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full animate-pulse w-3/4" />
      </div>
    </div>
  );
}

export function SupermarketCanvas() {
  const [webGlSupported, setWebGlSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebGlSupported(Boolean(gl));
    } catch {
      setWebGlSupported(false);
    }
  }, []);

  if (webGlSupported === false) {
    return <WebGlFallback />;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950">
      <Suspense fallback={<CanvasLoader />}>
        <Canvas
          shadows
          dpr={[1, 1.8]}
          camera={{
            fov: 55,
            near: 0.1,
            far: 80,
            position: [0, 2.1, 22],
          }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
          }}
        >
          <SupermarketScene />
        </Canvas>
      </Suspense>
    </div>
  );
}
