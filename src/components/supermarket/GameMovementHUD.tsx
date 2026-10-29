'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSupermarketStore } from '@/stores/supermarketStore';
import { soundManager } from '@/lib/sound';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Zap,
  Home,
  Volume2,
  VolumeX,
  HelpCircle,
  Gamepad2,
  Move,
  Minimize2,
  Maximize2,
} from 'lucide-react';

export function GameMovementHUD() {
  const {
    movementInput,
    setMovementInput,
    navigateToEntrance,
    isCameraTransitioning,
  } = useSupermarketStore();

  const [isMinimized, setIsMinimized] = useState(false);
  const [controlMode, setControlMode] = useState<'dpad' | 'joystick'>('dpad');
  const [muted, setMuted] = useState(soundManager.isMuted());
  const [showHelp, setShowHelp] = useState(false);
  const [activeKeys, setActiveKeys] = useState<{ [key: string]: boolean }>({});

  // Virtual Joystick drag ref
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);
  const isDraggingJoystickRef = useRef(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

  // Listen to physical keyboard to light up HUD buttons in real time
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      const k = e.key.toLowerCase();
      setActiveKeys((prev) => ({ ...prev, [k]: true }));

      // Also sync sprint key (Shift)
      if (e.shiftKey) {
        setMovementInput({ sprint: true });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      setActiveKeys((prev) => ({ ...prev, [k]: false }));

      if (!e.shiftKey) {
        setMovementInput({ sprint: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setMovementInput]);

  // Joystick pointer events
  const handleJoystickPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingJoystickRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    soundManager.playHover();
  };

  const handleJoystickPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingJoystickRef.current || !joystickBaseRef.current) return;

      const rect = joystickBaseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const maxRadius = rect.width / 2 - 16;
      let dx = e.clientX - centerX;
      let dy = e.clientY - centerY;

      const distance = Math.hypot(dx, dy);
      if (distance > maxRadius) {
        dx = (dx / distance) * maxRadius;
        dy = (dy / distance) * maxRadius;
      }

      setKnobPos({ x: dx, y: dy });

      // Normalized coordinates (-1 to 1)
      const normalizedX = dx / maxRadius;
      const normalizedY = -dy / maxRadius; // Up is positive

      setMovementInput({
        joystick: { x: normalizedX, y: normalizedY },
        forward: normalizedY > 0.25,
        backward: normalizedY < -0.25,
        strafeLeft: normalizedX < -0.25,
        strafeRight: normalizedX > 0.25,
      });
    },
    [setMovementInput]
  );

  const handleJoystickPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingJoystickRef.current) return;
      isDraggingJoystickRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture already lost
      }
      setKnobPos({ x: 0, y: 0 });
      setMovementInput({
        joystick: { x: 0, y: 0 },
        forward: false,
        backward: false,
        strafeLeft: false,
        strafeRight: false,
      });
    },
    [setMovementInput]
  );

  const toggleSound = () => {
    const isNowMuted = soundManager.toggleMute();
    setMuted(isNowMuted);
  };

  const toggleSprint = () => {
    const nextSprint = !movementInput.sprint;
    setMovementInput({ sprint: nextSprint });
    soundManager.playSelect();
  };

  // Helper for button press state
  const handleButtonPress = (key: keyof typeof movementInput, value: boolean) => {
    setMovementInput({ [key]: value });
    if (value) soundManager.playHover();
  };

  const isForwardActive =
    movementInput.forward || activeKeys['w'] || activeKeys['arrowup'];
  const isBackwardActive =
    movementInput.backward || activeKeys['s'] || activeKeys['arrowdown'];
  const isTurnLeftActive = movementInput.left || activeKeys['a'] || activeKeys['arrowleft'];
  const isTurnRightActive = movementInput.right || activeKeys['d'] || activeKeys['arrowright'];
  const isStrafeLeftActive = movementInput.strafeLeft || activeKeys['q'];
  const isStrafeRightActive = movementInput.strafeRight || activeKeys['e'];
  const isSprintActive = movementInput.sprint || activeKeys['shift'];

  return (
    <aside
      aria-label="Supermarket Trolley Game Controls HUD"
      className="fixed bottom-5 left-5 z-40 select-none flex flex-col gap-2 font-sans"
    >
      {/* Help Modal Popup */}
      {showHelp && (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 p-4 rounded-2xl text-xs text-slate-300 w-72 shadow-2xl animate-fade-in mb-1">
          <div className="font-bold text-white mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Gamepad2 className="w-4 h-4" />
              Trolley Navigation Controls
            </span>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
              <span>Push Trolley Forward</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-emerald-400 font-mono text-[11px]">W / ↑</kbd>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
              <span>Pull Trolley Back</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-emerald-400 font-mono text-[11px]">S / ↓</kbd>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
              <span>Push / Pull (Scroll)</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-emerald-400 font-mono text-[11px]">Mouse Wheel</kbd>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
              <span>Steer Left / Right</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-emerald-400 font-mono text-[11px]">A / D</kbd>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
              <span>Slide / Strafe</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-emerald-400 font-mono text-[11px]">Q / E</kbd>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
              <span>Turbo Sprint</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-400 font-mono text-[11px]">Shift</kbd>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span>Look & Pan</span>
              <span className="text-slate-400 text-[11px]">Drag Anywhere</span>
            </div>
          </div>
        </div>
      )}

      {/* Main HUD Panel */}
      <div className="relative bg-slate-950/85 backdrop-blur-2xl border border-slate-800/80 hover:border-emerald-500/40 transition-colors p-3 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.65)] flex flex-col gap-3">
        {/* Top Header of HUD: Title, Mode toggle, Minimize */}
        <div className="flex items-center justify-between gap-3 px-1 border-b border-slate-800/60 pb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-200">
              Trolley HUD
            </span>
            {isSprintActive && (
              <span className="text-[9px] font-black bg-amber-500/20 border border-amber-500/40 text-amber-300 px-1.5 py-0.2 rounded-full uppercase tracking-tighter animate-pulse">
                TURBO
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Mode Toggle: D-Pad vs Analog Stick */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-0.5 flex items-center">
              <button
                type="button"
                onClick={() => setControlMode('dpad')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  controlMode === 'dpad'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tactical D-Pad Controls"
              >
                DPAD
              </button>
              <button
                type="button"
                onClick={() => setControlMode('joystick')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  controlMode === 'joystick'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Virtual Analog Joystick"
              >
                STICK
              </button>
            </div>

            {/* Minimize / Maximize */}
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isMinimized ? 'Expand HUD' : 'Collapse HUD'}
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Controller Body (Only shown when not minimized) */}
        {!isMinimized && (
          <div className="flex flex-col items-center gap-3">
            {/* DPAD MODE */}
            {controlMode === 'dpad' ? (
              <div className="relative flex flex-col items-center">
                {/* Strafe Buttons (Left & Right Flanks) */}
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10">
                  <button
                    id="hud-strafe-left"
                    type="button"
                    onPointerDown={() => handleButtonPress('strafeLeft', true)}
                    onPointerUp={() => handleButtonPress('strafeLeft', false)}
                    onPointerLeave={() => handleButtonPress('strafeLeft', false)}
                    className={`w-9 h-9 rounded-xl border flex flex-col items-center justify-center transition-all active:scale-95 shadow-md ${
                      isStrafeLeftActive
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/40 ring-2 ring-emerald-400/50 scale-105'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-500'
                    }`}
                    title="Slide Left (Q)"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                    <span className="text-[8px] font-mono leading-none text-slate-400">Q</span>
                  </button>
                </div>

                <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10">
                  <button
                    id="hud-strafe-right"
                    type="button"
                    onPointerDown={() => handleButtonPress('strafeRight', true)}
                    onPointerUp={() => handleButtonPress('strafeRight', false)}
                    onPointerLeave={() => handleButtonPress('strafeRight', false)}
                    className={`w-9 h-9 rounded-xl border flex flex-col items-center justify-center transition-all active:scale-95 shadow-md ${
                      isStrafeRightActive
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/40 ring-2 ring-emerald-400/50 scale-105'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-500'
                    }`}
                    title="Slide Right (E)"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    <span className="text-[8px] font-mono leading-none text-slate-400">E</span>
                  </button>
                </div>

                {/* Central Tactical Cross Pad (Forward, Backward, Steer Left, Steer Right) */}
                <div className="grid grid-cols-3 gap-1.5 w-40 h-40 p-1.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl items-center justify-items-center">
                  {/* Top-Left Corner: Empty */}
                  <div />

                  {/* FORWARD (W / ↑) */}
                  <button
                    id="hud-move-forward"
                    type="button"
                    onPointerDown={() => handleButtonPress('forward', true)}
                    onPointerUp={() => handleButtonPress('forward', false)}
                    onPointerLeave={() => handleButtonPress('forward', false)}
                    className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center transition-all active:scale-95 shadow-md ${
                      isForwardActive
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/40 ring-2 ring-emerald-400/50 scale-105'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-emerald-500/40'
                    }`}
                    title="Push Forward (W / ↑)"
                  >
                    <ChevronUp className="w-5 h-5 stroke-[2.5]" />
                    <span className="text-[8px] font-mono leading-none text-slate-400">W</span>
                  </button>

                  {/* Top-Right Corner: Empty */}
                  <div />

                  {/* STEER LEFT (A / ◄) */}
                  <button
                    id="hud-steer-left"
                    type="button"
                    onPointerDown={() => handleButtonPress('left', true)}
                    onPointerUp={() => handleButtonPress('left', false)}
                    onPointerLeave={() => handleButtonPress('left', false)}
                    className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center transition-all active:scale-95 shadow-md ${
                      isTurnLeftActive
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/40 ring-2 ring-emerald-400/50 scale-105'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-emerald-500/40'
                    }`}
                    title="Steer Left (A / ◄)"
                  >
                    <RotateCcw className="w-4 h-4 stroke-[2.2]" />
                    <span className="text-[8px] font-mono leading-none text-slate-400 mt-0.5">A</span>
                  </button>

                  {/* Center Hub Indicator */}
                  <div className="w-9 h-9 rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
                    <Move className="w-4 h-4" />
                  </div>

                  {/* STEER RIGHT (D / ►) */}
                  <button
                    id="hud-steer-right"
                    type="button"
                    onPointerDown={() => handleButtonPress('right', true)}
                    onPointerUp={() => handleButtonPress('right', false)}
                    onPointerLeave={() => handleButtonPress('right', false)}
                    className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center transition-all active:scale-95 shadow-md ${
                      isTurnRightActive
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/40 ring-2 ring-emerald-400/50 scale-105'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-emerald-500/40'
                    }`}
                    title="Steer Right (D / ►)"
                  >
                    <RotateCw className="w-4 h-4 stroke-[2.2]" />
                    <span className="text-[8px] font-mono leading-none text-slate-400 mt-0.5">D</span>
                  </button>

                  {/* Bottom-Left Corner: Empty */}
                  <div />

                  {/* BACKWARD (S / ↓) */}
                  <button
                    id="hud-move-backward"
                    type="button"
                    onPointerDown={() => handleButtonPress('backward', true)}
                    onPointerUp={() => handleButtonPress('backward', false)}
                    onPointerLeave={() => handleButtonPress('backward', false)}
                    className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center transition-all active:scale-95 shadow-md ${
                      isBackwardActive
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/40 ring-2 ring-emerald-400/50 scale-105'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-emerald-500/40'
                    }`}
                    title="Pull Back (S / ↓)"
                  >
                    <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                    <span className="text-[8px] font-mono leading-none text-slate-400">S</span>
                  </button>

                  {/* Bottom-Right Corner: Empty */}
                  <div />
                </div>
              </div>
            ) : (
              /* VIRTUAL JOYSTICK MODE */
              <div
                ref={joystickBaseRef}
                onPointerDown={handleJoystickPointerDown}
                onPointerMove={handleJoystickPointerMove}
                onPointerUp={handleJoystickPointerUp}
                onPointerCancel={handleJoystickPointerUp}
                className="relative w-40 h-40 rounded-full bg-slate-950/70 border-2 border-dashed border-emerald-500/30 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-inner touch-none"
              >
                {/* Directional Guides */}
                <div className="absolute top-2 text-[9px] font-bold text-slate-500 uppercase">Push</div>
                <div className="absolute bottom-2 text-[9px] font-bold text-slate-500 uppercase">Pull</div>
                <div className="absolute left-2 text-[9px] font-bold text-slate-500 uppercase">◄</div>
                <div className="absolute right-2 text-[9px] font-bold text-slate-500 uppercase">►</div>

                {/* Inner Target Concentric Circles */}
                <div className="w-24 h-24 rounded-full border border-slate-800/80 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-full border border-emerald-500/20" />
                </div>

                {/* Movable Joystick Puck */}
                <div
                  ref={joystickKnobRef}
                  style={{
                    transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
                    transition: isDraggingJoystickRef.current ? 'none' : 'transform 0.15s ease-out',
                  }}
                  className="absolute w-14 h-14 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-700 border-2 border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center text-white pointer-events-none"
                >
                  <Move className="w-5 h-5 text-white/90 drop-shadow" />
                </div>
              </div>
            )}

            {/* Quick Actions Row: Turbo Push, Return to Entrance */}
            <div className="w-full flex items-center gap-2 pt-1 border-t border-slate-800/60">
              {/* Turbo Push Button */}
              <button
                id="hud-turbo-btn"
                type="button"
                onClick={toggleSprint}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                  isSprintActive
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black shadow-amber-500/40 ring-1 ring-amber-400'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-amber-500/30'
                }`}
                title="Toggle Turbo Push Speed (Shift)"
              >
                <Zap className={`w-3.5 h-3.5 ${isSprintActive ? 'fill-slate-950' : 'fill-amber-400'}`} />
                <span>{isSprintActive ? 'TURBO ON' : 'TURBO BOOST'}</span>
              </button>

              {/* Reset to Entrance */}
              <button
                id="hud-home-btn"
                type="button"
                onClick={navigateToEntrance}
                disabled={isCameraTransitioning}
                className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                title="Return to Entrance"
              >
                <Home className="w-4 h-4" />
              </button>

              {/* Mute Toggle */}
              <button
                id="hud-mute-btn"
                type="button"
                onClick={toggleSound}
                className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                title={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>

              {/* Help & Controls */}
              <button
                id="hud-help-btn"
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                title="Controls Guide"
              >
                <HelpCircle className="w-4 h-4 text-sky-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
