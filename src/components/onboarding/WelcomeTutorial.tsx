'use client';

import React, { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { Compass, Eye, ShoppingBag, Sparkles, X, ArrowRight } from 'lucide-react';

export function WelcomeTutorial() {
  const { isTutorialOpen, setTutorialOpen } = useUIStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem('aisle_tutorial_seen');
      if (!seen) {
        setTutorialOpen(true);
      }
    }
  }, [setTutorialOpen]);

  if (!isTutorialOpen) return null;

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aisle_tutorial_seen', 'true');
    }
    setTutorialOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 text-center bg-gradient-to-b from-emerald-600/20 to-transparent border-b border-slate-800 relative">
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white mx-auto flex items-center justify-center mb-3 shadow-xl shadow-emerald-600/30">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Welcome to AISLE 3D Store
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Experience the future of grocery shopping. Walk through real aisles, inspect products on physical shelves, and fill your basket.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="p-6 space-y-3.5">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Explore & Walk in 3D</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Drag on the screen to look around. Use <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400 font-mono text-[10px]">W</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400 font-mono text-[10px]">A</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400 font-mono text-[10px]">S</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400 font-mono text-[10px]">D</kbd> or arrow keys to stroll down any aisle.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Inspect Products on Shelves</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Hover over packages to view details. Click on any item to lift it up, view nutrition facts and choose quantities.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Minimap & Global Search</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Use the minimap or search bar to instantly fly to any shelf in the supermarket. Free delivery unlocked on orders above ₹499!
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-5 border-t border-slate-800 bg-slate-900 shrink-0">
          <button
            id="tutorial-start-btn"
            type="button"
            onClick={handleDismiss}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
          >
            <span>Start Exploring Supermarket</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
