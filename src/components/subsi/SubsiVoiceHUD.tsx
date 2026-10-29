'use client';

import React, { useEffect, useState } from 'react';
import { useSubsiStore } from '@/stores/subsiStore';
import { formatINR } from '@/lib/currency';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Send,
  Cpu,
  Check,
} from 'lucide-react';

export function SubsiVoiceHUD() {
  const {
    status,
    micPermission,
    isMicListening,
    currentTranscript,
    interimTranscript,
    audioLevel,
    lastResponse,
    usedModel,
    customApiKey,
    setCustomApiKey,
    pendingChoices,
    isAudioWaveActive,
    initVoiceAssistant,
    requestMicPermission,
    wakeSubsi,
    sleepSubsi,
    selectChoice,
    sendQuery,
  } = useSubsiStore();

  const [dismissedPrompt, setDismissedPrompt] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [inputText, setInputText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  // Sync keyInput when customApiKey changes
  useEffect(() => {
    setKeyInput(customApiKey || '');
  }, [customApiKey]);

  // Initialize Subsi on client mount
  useEffect(() => {
    initVoiceAssistant();
  }, [initVoiceAssistant]);

  // AUTO-WRITE: When the user speaks, automatically write into the chat input in real time
  useEffect(() => {
    if (interimTranscript) {
      setInputText(interimTranscript);
    } else if (currentTranscript && status === 'listening') {
      setInputText(currentTranscript);
    }
  }, [interimTranscript, currentTranscript, status]);

  // Request mic permission on landing if needed
  const handleEnableMic = async () => {
    const granted = await requestMicPermission();
    if (granted) {
      setDismissedPrompt(true);
      wakeSubsi();
    }
  };

  // Toggle microphone listening
  const handleMicToggle = async () => {
    if (micPermission !== 'granted') {
      const granted = await requestMicPermission();
      if (granted) {
        wakeSubsi();
      }
    } else {
      if (status === 'listening') {
        sleepSubsi();
      } else {
        wakeSubsi();
      }
    }
  };

  const isSpeaking = status === 'speaking';
  const isListening = status === 'listening';
  const isThinking = status === 'thinking';

  return (
    <>
      {/* 1. MIC PERMISSION ONBOARDING PROMPT ON LANDING */}
      {micPermission === 'prompt' && !dismissedPrompt && (
        <aside
          aria-label="Subsi Voice Assistant Permission Dialog"
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] bg-slate-900/95 backdrop-blur-2xl border-2 border-emerald-500/50 p-5 rounded-3xl shadow-[0_12px_50px_rgba(16,185,129,0.3)] animate-bounce-in"
        >
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/40 animate-pulse">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
              </span>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  Meet Subsi <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">AI ASSISTANT</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setDismissedPrompt(true)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Shop hands-free! Just say <strong className="text-emerald-400">&quot;Hey Subsi&quot;</strong> and tell her what you need (e.g. <em>&quot;Hey Subsi, I need some milk and bread&quot;</em>).
              </p>

              <div className="mt-3.5 flex items-center gap-2">
                <button
                  id="subsi-enable-mic-btn"
                  type="button"
                  onClick={handleEnableMic}
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                >
                  <Mic className="w-4 h-4" />
                  <span>Enable Voice &quot;Hey Subsi&quot;</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDismissedPrompt(true)}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* 2. FLOATING SUBSI HOLOGRAPHIC VOICE AVATAR & DIALOGUE HUD */}
      <aside
        aria-label="Subsi Voice Assistant Interactive HUD"
        className="fixed top-20 right-5 z-40 flex flex-col items-end gap-2.5 max-w-sm pointer-events-none select-none font-sans"
      >
        {/* Top Trigger Pill: Avatar Orb & Status */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Quick Wake / Status Button */}
          <button
            id="subsi-avatar-btn"
            type="button"
            onClick={async () => {
              if (micPermission !== 'granted') {
                await requestMicPermission();
              }
              if (status === 'sleeping') {
                wakeSubsi();
              } else {
                sleepSubsi();
              }
            }}
            className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-2xl backdrop-blur-2xl border transition-all duration-300 shadow-2xl active:scale-95 ${
              isListening
                ? 'bg-emerald-950/90 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/50'
                : isSpeaking
                ? 'bg-teal-950/90 border-teal-400 shadow-[0_0_30px_rgba(20,184,166,0.5)] ring-2 ring-teal-400/50'
                : isThinking
                ? 'bg-sky-950/90 border-sky-400 shadow-[0_0_30px_rgba(14,165,233,0.5)]'
                : 'bg-slate-950/85 hover:bg-slate-900 border-slate-800 hover:border-emerald-500/50'
            }`}
            title="Click to talk with Subsi"
          >
            {/* Holographic Glowing AI Orb */}
            <div className="relative flex items-center justify-center">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all duration-300 ${
                  isListening
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 scale-110 shadow-lg shadow-emerald-500/50 animate-pulse'
                    : isSpeaking
                    ? 'bg-gradient-to-tr from-teal-500 to-cyan-400 scale-110 shadow-lg shadow-teal-500/50'
                    : isThinking
                    ? 'bg-gradient-to-tr from-sky-500 to-indigo-500 animate-spin'
                    : 'bg-gradient-to-tr from-emerald-600 to-slate-800'
                }`}
              >
                {isSpeaking ? (
                  <Volume2 className="w-4 h-4 animate-bounce" />
                ) : isListening ? (
                  <Mic className="w-4 h-4 animate-pulse text-white" />
                ) : (
                  <Sparkles className="w-4 h-4 text-emerald-300 group-hover:rotate-12 transition-transform" />
                )}
              </div>

              {/* Pulsing Neural Rings when Active */}
              {(isListening || isSpeaking) && (
                <span className="absolute -inset-1 rounded-xl bg-emerald-400/30 blur-sm animate-ping -z-10" />
              )}
            </div>

            {/* Label & Status */}
            <div className="text-left pr-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-tight text-white">SUBSI</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                  {status === 'sleeping' ? 'STANDBY' : status.toUpperCase()}
                </span>
                {isMicListening && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                {status === 'sleeping'
                  ? isMicListening
                    ? 'Say "Hey Subsi" or Tap'
                    : 'Tap to Wake Subsi'
                  : status === 'listening'
                  ? 'Listening to you...'
                  : status === 'thinking'
                  ? 'Finding groceries...'
                  : 'Speaking to you...'}
              </p>
            </div>

            {/* Minimize / Expand Toggle */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 text-slate-500 hover:text-white"
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>
        </div>

        {/* 3. DIALOGUE BUBBLE & INTERACTIVE OPTIONS (When Awake or Responding) */}
        {isExpanded && (status !== 'sleeping' || lastResponse) && (
          <div className="w-80 bg-slate-950/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-4 shadow-[0_16px_50px_rgba(0,0,0,0.8)] pointer-events-auto flex flex-col gap-3 animate-slide-down">
            {/* Header: Status, Live Decibel Meter & Controls */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                {/* Audio Waveform Animation Bars (Dynamic with real audioLevel) */}
                <div className="flex items-center gap-0.5 h-4">
                  {[0.6, 1.0, 0.8, 1.2, 0.7].map((factor, i) => {
                    const waveHeight = isListening
                      ? Math.max(20, Math.min(100, Math.round(audioLevel * factor)))
                      : isSpeaking
                      ? 60
                      : 20;

                    return (
                      <span
                        key={`wave-${i}`}
                        style={{ height: `${waveHeight}%` }}
                        className={`w-0.5 rounded-full transition-all duration-75 ${
                          isListening
                            ? audioLevel > 15
                              ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                              : 'bg-emerald-500/60'
                            : isSpeaking
                            ? 'bg-teal-400'
                            : 'bg-slate-700'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="text-[11px] font-bold text-slate-300">
                  {isListening ? (
                    audioLevel > 15 ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Hearing your voice...
                      </span>
                    ) : (
                      'Listening for speech...'
                    )
                  ) : isSpeaking ? (
                    'Subsi speaking...'
                  ) : (
                    'Subsi Assistant'
                  )}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* AI Model Settings Toggle */}
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
                    showSettings || customApiKey
                      ? 'bg-purple-900/40 border-purple-500/50 text-purple-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Configure Open-Source AI Model (Meta Llama 3.3 / Groq / Local)"
                >
                  <Cpu className="w-3.5 h-3.5" />
                </button>

                {/* Mic Listen Toggle */}
                <button
                  type="button"
                  onClick={handleMicToggle}
                  className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
                    isListening
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title={isListening ? 'Pause listening' : 'Start listening'}
                >
                  {isListening ? <Mic className="w-3.5 h-3.5 animate-pulse" /> : <MicOff className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                <button
                  type="button"
                  onClick={sleepSubsi}
                  className="text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* AI Model Settings Panel (Optional Groq Llama 3.3 / Ollama Key) */}
            {showSettings && (
              <div className="bg-slate-900/95 border border-purple-500/40 p-3 rounded-2xl space-y-2 text-xs animate-slide-down">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" /> Open-Source AI Model
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                    {customApiKey ? 'Meta Llama 3.3 70B' : 'Built-in Reasoner'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-tight">
                  Subsi supports <strong>Meta Llama 3.3 70B & Llama 3.1</strong>. Paste an optional free Groq API key for cloud Llama 3.3 (300 t/s), or leave blank for high-speed local engine.
                </p>
                <div className="flex gap-1.5 pt-0.5">
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="gsk_... (optional Groq API key)"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCustomApiKey(keyInput.trim());
                      setShowSettings(false);
                    }}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center gap-1 shadow-md transition-all active:scale-95"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                </div>
              </div>
            )}

            {/* Scrollable Conversation Content Body */}
            <div className="max-h-[48vh] overflow-y-auto scrollbar-thin space-y-2.5 pr-1">
              {/* Live Streaming Speech Preview: What you are saying right now */}
              {(interimTranscript || (isListening && inputText)) && (
                <div className="bg-emerald-950/40 border border-emerald-500/40 p-2.5 rounded-2xl text-xs text-emerald-300 font-medium animate-pulse">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5 flex items-center gap-1">
                    <Mic className="w-2.5 h-2.5" /> Speaking right now...
                  </span>
                  &quot;{interimTranscript || inputText}&quot;
                </div>
              )}

              {/* Confirmed Spoken Query (if not currently speaking interim) */}
              {!interimTranscript && currentTranscript && (
                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl text-xs text-emerald-300 font-medium">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">You said:</span>
                  &quot;{currentTranscript}&quot;
                </div>
              )}

              {/* Subsi Voice Response Text */}
              {lastResponse && (
                <div className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-900/40 p-2.5 rounded-2xl border border-slate-800/60">
                  <span className="text-[10px] uppercase font-bold text-teal-400 block mb-0.5 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Subsi:
                  </span>
                  {lastResponse}
                </div>
              )}

              {/* Interactive Clarifying Product Option Chips */}
              {pendingChoices && pendingChoices.length > 0 && (
                <div className="pt-1 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Available in Supermarket:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                    {pendingChoices.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => selectChoice(product)}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/60 transition-all text-left group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-6 h-6 rounded-lg text-[8px] font-bold text-white flex items-center justify-center shrink-0"
                            style={{ backgroundColor: product.visual.primaryColor }}
                          >
                            {product.visual.label.substring(0, 2)}
                          </div>
                          <div className="truncate">
                            <h5 className="text-[11px] font-bold text-white group-hover:text-emerald-300 truncate">
                              {product.name}
                            </h5>
                            <span className="text-[9px] text-slate-400">{product.netQuantity}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="text-xs font-bold text-emerald-400">{formatINR(product.price)}</span>
                          <div className="p-1 rounded-md bg-emerald-600/30 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <Plus className="w-3 h-3" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Sample Prompts */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {[
                'milk and bread',
                'Kashmir apples',
                'Maggi noodles',
                'checkout',
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setInputText(`I need ${sample}`);
                    sendQuery(`I need ${sample}`);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  +{sample}
                </button>
              ))}
            </div>

            {/* Quick Text / Speech Fallback Input - Automatically types as you speak! */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputText.trim()) {
                  sendQuery(inputText.trim());
                  setInputText('');
                }
              }}
              className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80"
            >
              <div className="relative flex-1 flex items-center">
                <input
                  id="subsi-text-input"
                  name="subsiInput"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isListening
                      ? 'Listening... Speak or type here'
                      : 'Ask Subsi: e.g. milk & bread'
                  }
                  className={`w-full bg-slate-900 border rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all ${
                    isListening
                      ? 'border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                      : 'border-slate-700 focus:border-emerald-500'
                  }`}
                />
                {isListening && (
                  <span className="absolute right-2.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
              </div>

              {/* Direct Mic Push-to-Talk / Toggle inside the chat bar */}
              <button
                type="button"
                onClick={handleMicToggle}
                className={`p-2 rounded-xl border transition-all ${
                  isListening
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-600/40'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title={isListening ? 'Mute microphone' : 'Tap to speak'}
              >
                {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5 text-amber-400" />}
              </button>

              <button
                id="subsi-send-btn"
                type="submit"
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
                disabled={!inputText.trim()}
                title="Send query to Subsi"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Mic Status & Quick Prompt Footnote */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
              <span className="flex items-center gap-1.5">
                {isListening ? (
                  <button
                    type="button"
                    onClick={sleepSubsi}
                    className="flex items-center gap-1.5 text-emerald-400 hover:underline cursor-pointer"
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold">Mic listening • Speak now</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleMicToggle}
                    className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    <Mic className="w-3 h-3 text-amber-400" />
                    <span>Tap mic to speak</span>
                  </button>
                )}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 text-[9px] text-purple-300 font-medium">
                  <Cpu className="w-2.5 h-2.5 text-purple-400" />
                  {customApiKey ? 'Llama 3.3 70B' : 'Subsi Engine'}
                </span>
                <span className="text-slate-600">&bull;</span>
                <span>Voice &bull; Type</span>
              </span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

