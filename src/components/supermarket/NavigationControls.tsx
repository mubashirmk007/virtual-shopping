'use client';

import React, { useState } from 'react';
import { useSupermarketStore } from '@/stores/supermarketStore';
import { soundManager } from '@/lib/sound';
import { Volume2, VolumeX, Home, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react';

export function NavigationControls() {
  const { navigateToEntrance, navigateToAisle, currentAisleId } = useSupermarketStore();
  const [muted, setMuted] = useState(soundManager.isMuted());
  const [showHelp, setShowHelp] = useState(false);

  const toggleSound = () => {
    const isNowMuted = soundManager.toggleMute();
    setMuted(isNowMuted);
  };

  return (
    <div className="fixed bottom-5 left-5 z-30 flex flex-col gap-3 select-none">
      {/* Help tooltip popup */}
      {showHelp && (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3.5 rounded-2xl text-xs text-slate-300 w-64 shadow-2xl animate-fade-in">
          <div className="font-bold text-white mb-1.5 flex items-center justify-between">
            <span>Navigation Guide</span>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <ul className="space-y-1 text-slate-300">
            <li>• <strong className="text-emerald-400">Drag Scene</strong>: Pan camera & look around</li>
            <li>• <strong className="text-emerald-400">WASD / Arrows</strong>: Walk through aisles</li>
            <li>• <strong className="text-emerald-400">Click Product</strong>: Open product details & add to cart</li>
            <li>• <strong className="text-emerald-400">Minimap</strong>: Instant teleport to any aisle</li>
          </ul>
        </div>
      )}

      {/* Floating Control Toolbar */}
      <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 p-2 rounded-2xl shadow-xl">
        {/* Return to Entrance */}
        <button
          type="button"
          onClick={navigateToEntrance}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-emerald-600 text-slate-200 hover:text-white transition-all duration-200 shadow-sm"
          title="Return to Supermarket Entrance"
          aria-label="Return to Entrance"
        >
          <Home className="w-4 h-4" />
        </button>

        {/* Audio Mute / Unmute */}
        <button
          type="button"
          onClick={toggleSound}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-all duration-200 shadow-sm"
          title={muted ? 'Unmute Sound' : 'Mute Sound'}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Help Info Toggle */}
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-all duration-200 shadow-sm"
          title="Help & Controls"
          aria-label="Help"
        >
          <HelpCircle className="w-4 h-4 text-sky-400" />
        </button>
      </div>
    </div>
  );
}
