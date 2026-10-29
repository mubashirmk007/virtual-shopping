import { create } from 'zustand';
import { Product } from '@/types/product';
import { CartItem, DeliveryAddress } from '@/types/cart';

export interface OrderRecord {
  orderId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  address: DeliveryAddress;
  date: string;
  estimatedDelivery: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface UIState {
  isCartOpen: boolean;
  isProductDetailOpen: boolean;
  isOffersOpen: boolean;
  isCheckoutOpen: boolean;
  isOrderConfirmedOpen: boolean;
  isDeliveryAddressOpen: boolean;
  isMinimapExpanded: boolean;
  isTutorialOpen: boolean;
  recentlyViewed: Product[];
  lastOrder: OrderRecord | null;
  toasts: Toast[];

  setCartOpen: (open: boolean) => void;
  setProductDetailOpen: (open: boolean) => void;
  setOffersOpen: (open: boolean) => void;
  setCheckoutOpen: (open: boolean) => void;
  setOrderConfirmedOpen: (open: boolean) => void;
  setDeliveryAddressOpen: (open: boolean) => void;
  setMinimapExpanded: (expanded: boolean) => void;
  setTutorialOpen: (open: boolean) => void;
  addRecentlyViewed: (product: Product) => void;
  setLastOrder: (order: OrderRecord | null) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  isCartOpen: false,
  isProductDetailOpen: false,
  isOffersOpen: false,
  isCheckoutOpen: false,
  isOrderConfirmedOpen: false,
  isDeliveryAddressOpen: false,
  isMinimapExpanded: true,
  isTutorialOpen: false,
  recentlyViewed: [],
  lastOrder: null,
  toasts: [],

  setCartOpen: (open) => set({ isCartOpen: open }),
  setProductDetailOpen: (open) => set({ isProductDetailOpen: open }),
  setOffersOpen: (open) => set({ isOffersOpen: open }),
  setCheckoutOpen: (open) => set({ isCheckoutOpen: open }),
  setOrderConfirmedOpen: (open) => set({ isOrderConfirmedOpen: open }),
  setDeliveryAddressOpen: (open) => set({ isDeliveryAddressOpen: open }),
  setMinimapExpanded: (expanded) => set({ isMinimapExpanded: expanded }),
  setTutorialOpen: (open) => set({ isTutorialOpen: open }),

  addRecentlyViewed: (product) => {
    set((state) => {
      const filtered = state.recentlyViewed.filter((p) => p.id !== product.id);
      return { recentlyViewed: [product, ...filtered].slice(0, 8) };
    });
  },

  setLastOrder: (order) => set({ lastOrder: order }),

  showToast: (message, type = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 3500);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
