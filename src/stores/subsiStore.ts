import { create } from 'zustand';
import { Product } from '@/types/product';
import { voiceManager } from '@/lib/voiceManager';
import { useCartStore } from '@/stores/cartStore';
import { useSupermarketStore } from '@/stores/supermarketStore';
import { soundManager } from '@/lib/sound';

export type SubsiStatus = 'sleeping' | 'listening' | 'thinking' | 'speaking';
export type MicPermissionState = 'prompt' | 'granted' | 'denied';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface SubsiState {
  status: SubsiStatus;
  micPermission: MicPermissionState;
  isMicListening: boolean;
  currentTranscript: string;
  interimTranscript: string;
  audioLevel: number;
  lastResponse: string;
  usedModel: string;
  customApiKey: string;
  isOrbOpen: boolean;
  pendingChoices: Product[];
  conversationHistory: ChatMessage[];
  isAudioWaveActive: boolean;

  // Actions
  initVoiceAssistant: () => Promise<void>;
  requestMicPermission: () => Promise<boolean>;
  wakeSubsi: (initialQuery?: string) => void;
  sleepSubsi: () => void;
  toggleMic: () => Promise<void>;
  toggleOrb: () => void;
  sendQuery: (queryText: string) => Promise<void>;
  selectChoice: (product: Product) => Promise<void>;
  setStatus: (status: SubsiStatus) => void;
  setCurrentTranscript: (text: string) => void;
  setInterimTranscript: (text: string) => void;
  setCustomApiKey: (key: string) => void;
}

export const useSubsiStore = create<SubsiState>((set, get) => ({
  status: 'sleeping',
  micPermission: 'prompt',
  isMicListening: false,
  currentTranscript: '',
  interimTranscript: '',
  audioLevel: 0,
  lastResponse: '',
  usedModel: 'Subsi Supermarket Reasoner',
  customApiKey: typeof window !== 'undefined' ? localStorage.getItem('subsi_groq_api_key') || '' : '',
  isOrbOpen: true,
  pendingChoices: [],
  conversationHistory: [],
  isAudioWaveActive: false,

  initVoiceAssistant: async () => {
    voiceManager.init({
      onWakeWordDetected: (queryAfterWake) => {
        soundManager.playSelect();
        get().wakeSubsi(queryAfterWake);
      },
      onTranscriptChange: (transcript, isFinal) => {
        // Real-time transcript update (word-by-word streaming)
        set({
          currentTranscript: transcript,
          interimTranscript: isFinal ? '' : transcript,
        });

        if (isFinal && transcript.trim().length > 1) {
          get().sendQuery(transcript);
        }
      },
      onSpeechStart: () => {
        set({ status: 'speaking', isAudioWaveActive: true });
      },
      onSpeechEnd: () => {
        set({
          status: 'listening',
          isAudioWaveActive: false,
        });
        voiceManager.setAwake(true);
      },
      onListeningStateChange: (isListening) => {
        set({ isMicListening: isListening });
      },
      onAudioLevelChange: (level) => {
        set({ audioLevel: level });
      },
      onError: (err) => {
        console.warn('Subsi Voice Error:', err);
      },
    });

    if (typeof window !== 'undefined') {
      (window as unknown as { __subsi?: unknown }).__subsi = {
        sendQuery: (q: string) => get().sendQuery(q),
        wakeSubsi: (q?: string) => get().wakeSubsi(q),
        sleepSubsi: () => get().sleepSubsi(),
        selectChoice: (product: Product) => get().selectChoice(product),
      };
    }
  },

  requestMicPermission: async () => {
    const granted = await voiceManager.requestMicPermission();
    set({ micPermission: granted ? 'granted' : 'denied' });
    if (granted) {
      voiceManager.start();
      soundManager.playSelect();
    }
    return granted;
  },

  wakeSubsi: (initialQuery?: string) => {
    set({
      status: 'listening',
      isOrbOpen: true,
      currentTranscript: initialQuery || '',
      interimTranscript: initialQuery || '',
      lastResponse: get().lastResponse || "Hey partner! What groceries do you need today?",
    });

    // Make sure voice recognition is actively listening
    voiceManager.setAwake(true);
    voiceManager.start();

    if (initialQuery && initialQuery.trim().length > 2) {
      get().sendQuery(initialQuery);
    } else {
      voiceManager.speak("Hey partner! What groceries do you need today?");
    }
  },

  sleepSubsi: () => {
    set({
      status: 'sleeping',
      currentTranscript: '',
      interimTranscript: '',
      isAudioWaveActive: false,
      audioLevel: 0,
    });
    voiceManager.setAwake(false);
  },

  toggleMic: async () => {
    const state = get();
    if (state.isMicListening && state.status === 'listening') {
      voiceManager.stop();
      set({ status: 'sleeping', isMicListening: false });
    } else {
      if (state.micPermission !== 'granted') {
        const ok = await get().requestMicPermission();
        if (!ok) return;
      }
      get().wakeSubsi();
    }
  },

  toggleOrb: () => {
    set((state) => ({ isOrbOpen: !state.isOrbOpen }));
  },

  sendQuery: async (queryText: string) => {
    const query = queryText.trim();
    if (!query) return;

    // Add user message to history
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    set((state) => ({
      status: 'thinking',
      currentTranscript: query,
      interimTranscript: '',
      conversationHistory: [...state.conversationHistory, userMsg],
    }));

    try {
      const cartState = useCartStore.getState();
      const supermarketState = useSupermarketStore.getState();

      const response = await fetch('/api/subsi/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          apiKey: get().customApiKey,
          pendingChoices: get().pendingChoices,
          cartItems: cartState.items.map((i) => ({
            name: i.product.name,
            brand: i.product.brand,
            quantity: i.quantity,
            price: i.product.price,
          })),
          cartTotal: cartState.getTotal(),
          currentAisleId: supermarketState.currentAisleId,
          conversationHistory: get().conversationHistory.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      const reply = data.reply;

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      };

      set((state) => ({
        lastResponse: reply,
        status: 'speaking',
        usedModel: data.usedModel || state.usedModel,
        pendingChoices: data.pendingChoices || [],
        conversationHistory: [...state.conversationHistory, assistantMsg],
      }));

      // Speak response out loud
      voiceManager.speak(reply);

      // Execute 3D Supermarket Actions if Subsi added items
      if (data.action?.type === 'add_to_cart' && data.action.items) {
        const cartStore = useCartStore.getState();
        const supermarketStore = useSupermarketStore.getState();

        for (const item of data.action.items) {
          cartStore.addItem(item.product, item.quantity);
          // Trigger the 3D projectile animation directly into trolley basket!
          supermarketStore.triggerFlyToCart(item.product);
        }
      }

      // Clear cart action
      if (data.action?.type === 'clear_cart') {
        useCartStore.getState().clearCart();
      }

      // Navigate aisle if specified
      if (data.action?.type === 'navigate_aisle' && data.action.aisleId) {
        if (data.action.aisleId === 'aisle-entrance') {
          useSupermarketStore.getState().navigateToBilling();
        } else {
          useSupermarketStore.getState().navigateToAisle(data.action.aisleId);
        }
      }
    } catch (err) {
      console.error('Subsi Query Error:', err);
      const fallbackReply = "I'm here partner! Tell me what groceries you'd like to put in your cart.";
      set({ status: 'speaking', lastResponse: fallbackReply });
      voiceManager.speak(fallbackReply);
    }
  },

  selectChoice: async (product: Product) => {
    // User clicked on one of the suggested option pills
    await get().sendQuery(`Add ${product.name}`);
  },

  setStatus: (status) => set({ status }),
  setCurrentTranscript: (text) => set({ currentTranscript: text }),
  setInterimTranscript: (text) => set({ interimTranscript: text }),
  setCustomApiKey: (key) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('subsi_groq_api_key', key);
    }
    set({ customApiKey: key });
  },
}));
