// High-Accuracy Voice Manager for Subsi: Persistent Mic Stream, Real-Time Audio Meter, Resilient Speech Recognition, and TTS

export interface VoiceManagerCallbacks {
  onWakeWordDetected: (queryAfterWake?: string) => void;
  onTranscriptChange: (transcript: string, isFinal: boolean) => void;
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
  onListeningStateChange: (isListening: boolean) => void;
  onAudioLevelChange?: (level: number) => void;
  onError: (error: string) => void;
}

// Browser SpeechRecognition interface declaration
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onaudiostart: (() => void) | null;
  onaudioend: (() => void) | null;
  onsoundstart: (() => void) | null;
  onsoundend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

/**
 * High-accuracy phonetic matcher for "Subsi"
 * Speech engines frequently hear "Subsi" as:
 * "subzi", "sabzi", "sub see", "sub sea", "sub c", "subcy", "soobsi", "subzy", "sub city", "subsidy", "subsi"
 */
export function matchWakeWord(text: string): { matched: boolean; postWakeText: string } {
  if (!text) return { matched: false, postWakeText: '' };
  const clean = text.toLowerCase().trim();

  // 1. Comprehensive phonetic regex matching
  const wakePattern =
    /\b(?:hey|hi|hello|ok|okay)?\s*(?:subsi|subzi|sabzi|sub\s*si|sub\s*see|sub\s*c|subsea|subcy|soobsi|subzy|subsidy|sufsi|supsi|sup\s*si|sub\s*sir)\b/i;

  const match = clean.match(wakePattern);
  if (match && match.index !== undefined) {
    const postWakeText = clean.substring(match.index + match[0].length).trim();
    return { matched: true, postWakeText };
  }

  // 2. Direct name mention anywhere in the phrase
  if (clean.includes('subsi') || clean.includes('subzi') || clean.includes('sabzi') || clean.includes('sub see')) {
    const parts = clean.split(/(?:subsi|subzi|sabzi|sub\s*see)/i);
    const postWakeText = (parts[1] || '').trim();
    return { matched: true, postWakeText };
  }

  return { matched: false, postWakeText: '' };
}

export class VoiceManager {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening: boolean = false;
  private shouldListen: boolean = false;
  private callbacks: VoiceManagerCallbacks | null = null;
  private isAwake: boolean = false;
  private silenceTimer: NodeJS.Timeout | null = null;
  private restartTimeout: NodeJS.Timeout | null = null;
  private activeStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private consecutiveErrors: number = 0;
  private isSynthesizing: boolean = false;

  constructor() {
    // Lazily initialized in browser environment
  }

  /**
   * Request browser microphone permission cleanly and keep the hardware stream alive
   */
  async requestMicPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }

    try {
      if (!this.activeStream) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        this.activeStream = stream;
        this.initAudioAnalyser(stream);
      }

      this.shouldListen = true;
      this.start();
      return true;
    } catch (err) {
      console.warn('Microphone permission not granted:', err);
      return false;
    }
  }

  /**
   * Real-time audio analyzer for visual feedback & mic live-metering
   */
  private initAudioAnalyser(stream: MediaStream) {
    if (typeof window === 'undefined') return;

    try {
      if (!this.audioCtx) {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
        }
      }

      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      if (this.audioCtx && !this.analyser) {
        const source = this.audioCtx.createMediaStreamSource(stream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.5;
        source.connect(this.analyser);

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkLevel = () => {
          if (!this.analyser || !this.isListening) {
            this.callbacks?.onAudioLevelChange?.(0);
          } else {
            this.analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            // Normalize to 0-100 range
            const normalized = Math.min(100, Math.round((average / 128) * 100));
            this.callbacks?.onAudioLevelChange?.(normalized);
          }
          this.animFrameId = requestAnimationFrame(checkLevel);
        };

        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        this.animFrameId = requestAnimationFrame(checkLevel);
      }
    } catch (e) {
      console.warn('Audio analyzer init error:', e);
    }
  }

  /**
   * Instantiate or recreate a clean SpeechRecognition instance
   */
  private createRecognitionInstance(): SpeechRecognitionInstance | null {
    if (typeof window === 'undefined') return null;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return null;
    }

    // Safely discard previous instance
    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onend = null;
        this.recognition.onerror = null;
        this.recognition.onresult = null;
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      // Select dialect with fallback
      rec.lang = navigator.language || 'en-US';

      rec.onstart = () => {
        this.isListening = true;
        this.consecutiveErrors = 0;
        this.callbacks?.onListeningStateChange(true);
      };

      rec.onresult = (event: SpeechRecognitionEvent) => {
        // Ignore speech recognized while Subsi is talking out loud
        if (this.isSynthesizing) return;

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcript = item[0].transcript;
          if (item.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const rawText = (finalTranscript || interimTranscript).trim();
        if (!rawText) return;

        // If not awake yet, check for wake-word
        if (!this.isAwake) {
          const wakeCheck = matchWakeWord(rawText);
          if (wakeCheck.matched) {
            this.isAwake = true;
            this.callbacks?.onWakeWordDetected(wakeCheck.postWakeText);
            if (wakeCheck.postWakeText) {
              this.callbacks?.onTranscriptChange(wakeCheck.postWakeText, false);
            }
            return;
          }
        } else {
          // Subsi is awake: Clean any leading wake-word if user repeated it
          const wakeCheck = matchWakeWord(rawText);
          const activeText = wakeCheck.matched ? wakeCheck.postWakeText || rawText : rawText;

          // Stream real-time spoken text to write in chat
          this.callbacks?.onTranscriptChange(activeText, Boolean(finalTranscript));

          // Auto-submit after natural speech pause
          if (this.silenceTimer) clearTimeout(this.silenceTimer);
          this.silenceTimer = setTimeout(() => {
            if (activeText.length > 1 && this.isAwake && !this.isSynthesizing) {
              this.callbacks?.onTranscriptChange(activeText, true);
            }
          }, 1200);
        }
      };

      rec.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (e.error === 'no-speech') {
          // Normal silence timeout in Chrome, continue listening
          return;
        }

        if (e.error === 'aborted') {
          return;
        }

        if (e.error === 'network') {
          // Chrome speech cloud disconnect; schedule fresh reconnect
          console.warn('SpeechRecognition network disconnect; auto-reconnecting...');
          this.scheduleRestart(800, true);
          return;
        }

        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          console.warn('Speech recognition not allowed:', e.error);
          this.shouldListen = false;
          this.isListening = false;
          this.callbacks?.onListeningStateChange(false);
          this.callbacks?.onError('Microphone permission required');
          return;
        }

        this.consecutiveErrors++;
        const backoff = Math.min(3000, 500 * Math.pow(1.5, this.consecutiveErrors));
        this.scheduleRestart(backoff, true);
      };

      rec.onend = () => {
        this.isListening = false;
        this.callbacks?.onListeningStateChange(false);

        // Auto-restart loop if user wants to keep listening
        if (this.shouldListen && !this.isSynthesizing) {
          this.scheduleRestart(250, false);
        }
      };

      return rec;
    } catch (e) {
      console.warn('Failed to construct SpeechRecognition:', e);
      return null;
    }
  }

  /**
   * Resilient restart handler
   */
  private scheduleRestart(delayMs: number, recreate: boolean) {
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    if (!this.shouldListen) return;

    this.restartTimeout = setTimeout(() => {
      if (!this.shouldListen || this.isListening) return;

      if (recreate || !this.recognition) {
        this.recognition = this.createRecognitionInstance();
      }

      try {
        this.recognition?.start();
      } catch (err) {
        // In case start is invoked while transitioning state
        this.restartTimeout = setTimeout(() => {
          if (this.shouldListen && !this.isListening) {
            try {
              this.recognition = this.createRecognitionInstance();
              this.recognition?.start();
            } catch {}
          }
        }, 500);
      }
    }, delayMs);
  }

  /**
   * Initialize continuous listener
   */
  init(callbacks: VoiceManagerCallbacks) {
    this.callbacks = callbacks;
    this.recognition = this.createRecognitionInstance();

    if (!this.recognition && typeof window !== 'undefined') {
      callbacks.onError('Web Speech API not supported in this browser.');
    }
  }

  /**
   * Start listening for wake-word or speech
   */
  async start() {
    this.shouldListen = true;

    // Ensure audio stream is active
    if (!this.activeStream && typeof window !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.activeStream = stream;
        this.initAudioAnalyser(stream);
      } catch {}
    }

    if (!this.recognition) {
      this.recognition = this.createRecognitionInstance();
    }

    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch {
        // If already started or transitioning, recreate
        this.scheduleRestart(200, true);
      }
    }
  }

  /**
   * Stop listening
   */
  stop() {
    this.shouldListen = false;
    this.isAwake = false;
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    if (this.silenceTimer) clearTimeout(this.silenceTimer);

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }

    this.isListening = false;
    this.callbacks?.onListeningStateChange(false);
  }

  /**
   * Set Subsi awake state
   */
  setAwake(awake: boolean) {
    this.isAwake = awake;
  }

  getIsAwake(): boolean {
    return this.isAwake;
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Speak back to the user out loud using SpeechSynthesis
   */
  speak(text: string, onEnd?: () => void) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }

    try {
      // Pause recognition while Subsi speaks to avoid echo self-listening
      this.isSynthesizing = true;

      // Chrome audio unlock resume
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.02;

      // Select natural voice
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice =
        voices.find((v) => v.name.includes('Natural') || v.name.includes('Google UK English Female') || v.name.includes('Google US English')) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];

      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      utterance.onstart = () => {
        this.isSynthesizing = true;
        this.callbacks?.onSpeechStart();
      };

      const finishSpeech = () => {
        this.isSynthesizing = false;
        this.callbacks?.onSpeechEnd();
        if (onEnd) onEnd();

        // Resume listening immediately after Subsi finishes talking
        if (this.shouldListen) {
          this.start();
        }
      };

      utterance.onend = finishSpeech;
      utterance.onerror = finishSpeech;

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis error:', err);
      this.isSynthesizing = false;
      if (onEnd) onEnd();
    }
  }
}

export const voiceManager = new VoiceManager();

