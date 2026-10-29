'use client';

import React, { useState } from 'react';
import { AISLES } from '@/data/aisles';
import { useSupermarketStore } from '@/stores/supermarketStore';
import { MapPin, ChevronDown, ChevronUp, Compass } from 'lucide-react';

export function SupermarketMinimap() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { currentAisleId, navigateToAisle } = useSupermarketStore();

  // Supermarket 3D bounds: X: -18 to 18 (width 36), Z: -26 to 24 (depth 50)
  // Map to SVG coordinates: 260 width, 320 height
  const toSvgX = (x: number) => ((x + 18) / 36) * 220 + 20;
  const toSvgY = (z: number) => ((-z + 24) / 50) * 270 + 25;

  const currentAisle = AISLES.find((a) => a.id === currentAisleId) || AISLES[0];
  const beaconX = toSvgX(currentAisle.worldPosition.x);
  const beaconY = toSvgY(currentAisle.worldPosition.z);

  return (
    <div className="fixed bottom-5 right-5 z-30 select-none">
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 w-72">
        {/* Minimap Header */}
        <div
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-between px-4 py-3 bg-slate-800/60 cursor-pointer hover:bg-slate-800/90 transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-200">
            <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
            <span className="text-xs font-bold uppercase tracking-wider">Supermarket Map</span>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label={isCollapsed ? 'Expand minimap' : 'Collapse minimap'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Collapsible SVG Content */}
        {!isCollapsed && (
          <div className="p-3">
            <div className="relative bg-slate-950/80 rounded-xl p-2 border border-slate-800 flex items-center justify-center">
              <svg viewBox="0 0 260 320" className="w-full h-auto max-h-56">
                {/* Store Perimeter Walls */}
                <rect
                  x="15"
                  y="20"
                  width="230"
                  height="280"
                  rx="12"
                  fill="#0f172a"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Entrance Indicator at bottom */}
                <rect x="95" y="295" width="70" height="6" rx="3" fill="#15803d" />
                <text
                  x="130"
                  y="288"
                  textAnchor="middle"
                  fill="#86efac"
                  fontSize="8"
                  fontWeight="bold"
                >
                  STORE ENTRANCE
                </text>

                {/* Checkout Counter Section */}
                <rect x="80" y="240" width="100" height="24" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <text x="130" y="255" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="600">
                  CHECKOUT LANES
                </text>

                {/* Cross-Walkways */}
                <line x1="20" y1="160" x2="240" y2="160" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Aisle Blocks */}
                {AISLES.filter((a) => a.number > 0).map((aisle) => {
                  const x = toSvgX(aisle.worldPosition.x) - 22;
                  const y = toSvgY(aisle.worldPosition.z) - 34;
                  const isAisleActive = currentAisleId === aisle.id;

                  return (
                    <g
                      key={aisle.id}
                      onClick={() => navigateToAisle(aisle.id)}
                      className="cursor-pointer group"
                    >
                      {/* Left Shelf Box */}
                      <rect
                        x={x}
                        y={y}
                        width="18"
                        height="68"
                        rx="4"
                        fill={isAisleActive ? aisle.color : '#1e293b'}
                        stroke={isAisleActive ? '#ffffff' : aisle.color}
                        strokeWidth={isAisleActive ? '2' : '1'}
                        className="transition-colors group-hover:fill-slate-700"
                      />

                      {/* Right Shelf Box */}
                      <rect
                        x={x + 26}
                        y={y}
                        width="18"
                        height="68"
                        rx="4"
                        fill={isAisleActive ? aisle.color : '#1e293b'}
                        stroke={isAisleActive ? '#ffffff' : aisle.color}
                        strokeWidth={isAisleActive ? '2' : '1'}
                        className="transition-colors group-hover:fill-slate-700"
                      />

                      {/* Aisle Number Badge */}
                      <circle
                        cx={x + 22}
                        cy={y + 76}
                        r="8"
                        fill={aisle.color}
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                      <text
                        x={x + 22}
                        y={y + 79}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="8"
                        fontWeight="bold"
                      >
                        {aisle.number}
                      </text>
                    </g>
                  );
                })}

                {/* Animated Current Player / Camera Beacon */}
                <g className="transition-all duration-700 ease-out">
                  {/* Radar pulse wave */}
                  <circle cx={beaconX} cy={beaconY} r="14" fill="#22c55e" opacity="0.25">
                    <animate
                      attributeName="r"
                      from="8"
                      to="20"
                      dur="1.8s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.6"
                      to="0"
                      dur="1.8s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* Beacon Center Pin */}
                  <circle cx={beaconX} cy={beaconY} r="6" fill="#22c55e" stroke="#ffffff" strokeWidth="2" />
                </g>
              </svg>
            </div>

            {/* Current Location readout */}
            <div className="mt-2.5 flex items-center justify-between text-xs px-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate max-w-[170px] font-medium text-slate-200">
                  {currentAisle.name}
                </span>
              </span>
              <button
                type="button"
                onClick={() => navigateToAisle('aisle-entrance')}
                className="text-[10px] text-emerald-400 font-bold hover:underline"
              >
                Entrance
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
