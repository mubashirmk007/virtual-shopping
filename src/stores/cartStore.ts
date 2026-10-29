import { create } from 'zustand';
import { Product } from '@/types/product';
import { CartItem, DeliveryAddress, AppliedOffer } from '@/types/cart';
import { OFFERS } from '@/data/offers';
import { soundManager } from '@/lib/sound';

interface CartState {
  items: CartItem[];
  appliedOffer: AppliedOffer | null;
  deliveryAddress: DeliveryAddress;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyOfferCode: (code: string) => { success: boolean; message: string };
  removeOfferCode: () => void;
  setDeliveryAddress: (address: Partial<DeliveryAddress>) => void;
  getSubtotal: () => number;
  getDiscount: () => number;
  getDeliveryFee: () => number;
  getTotal: () => number;
  getTotalItemsCount: () => number;
}

const DEFAULT_ADDRESS: DeliveryAddress = {
  id: 'addr-default',
  label: 'Home',
  name: 'Ananya Sharma',
  street: 'Flat 402, Green Glen Layout, Bellandur',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560103',
  phone: '+91 98765 43210',
  isDefault: true,
};

function loadStoredItems(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('aisle_cart_items');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('aisle_cart_items', JSON.stringify(items));
  } catch {}
}

export const useCartStore = create<CartState>((set, get) => ({
  items: loadStoredItems(),
  appliedOffer: null,
  deliveryAddress: DEFAULT_ADDRESS,

  addItem: (product: Product, quantity: number = 1) => {
    soundManager.playAddToCart();
    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.product.id === product.id);
      let newItems: CartItem[];

      if (existingIndex >= 0) {
        newItems = [...state.items];
        const updatedQty = Math.min(
          product.stockQuantity,
          newItems[existingIndex].quantity + quantity
        );
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: updatedQty,
        };
      } else {
        newItems = [
          ...state.items,
          {
            product,
            quantity: Math.min(product.stockQuantity, Math.max(1, quantity)),
            addedAt: Date.now(),
          },
        ];
      }

      saveItems(newItems);
      return { items: newItems };
    });
  },

  removeItem: (productId: string) => {
    set((state) => {
      const newItems = state.items.filter((item) => item.product.id !== productId);
      saveItems(newItems);
      return { items: newItems };
    });
  },

  updateQuantity: (productId: string, quantity: number) => {
    set((state) => {
      if (quantity <= 0) {
        const filtered = state.items.filter((item) => item.product.id !== productId);
        saveItems(filtered);
        return { items: filtered };
      }

      const newItems = state.items.map((item) => {
        if (item.product.id === productId) {
          const validQty = Math.min(item.product.stockQuantity, quantity);
          return { ...item, quantity: validQty };
        }
        return item;
      });

      saveItems(newItems);
      return { items: newItems };
    });
  },

  clearCart: () => {
    saveItems([]);
    set({ items: [], appliedOffer: null });
  },

  applyOfferCode: (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const offer = OFFERS.find((o) => o.code === cleanCode);
    const subtotal = get().getSubtotal();

    if (!offer) {
      return { success: false, message: 'Invalid promo code' };
    }

    if (subtotal < offer.minOrderValue) {
      return {
        success: false,
        message: `Min order value of ₹${offer.minOrderValue} required for ${offer.code}`,
      };
    }

    const applied: AppliedOffer = {
      code: offer.code,
      discountPercentage: offer.discountPercentage,
      discountAmount: offer.discountAmount,
      description: offer.title,
    };

    set({ appliedOffer: applied });
    return { success: true, message: `Promo code ${offer.code} applied successfully!` };
  },

  removeOfferCode: () => {
    set({ appliedOffer: null });
  },

  setDeliveryAddress: (partial) => {
    set((state) => ({
      deliveryAddress: { ...state.deliveryAddress, ...partial },
    }));
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  },

  getDiscount: () => {
    const { appliedOffer } = get();
    const subtotal = get().getSubtotal();
    if (!appliedOffer || subtotal === 0) return 0;

    if (appliedOffer.discountAmount) {
      return Math.min(subtotal, appliedOffer.discountAmount);
    }
    if (appliedOffer.discountPercentage) {
      return Math.round((subtotal * appliedOffer.discountPercentage) / 100);
    }
    return 0;
  },

  getDeliveryFee: () => {
    const subtotal = get().getSubtotal();
    if (subtotal === 0) return 0;
    if (subtotal >= 499) return 0;
    if (get().appliedOffer?.code === 'FREEDEL') return 0;
    return 40; // ₹40 standard delivery fee below ₹499
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    if (subtotal === 0) return 0;
    const discount = get().getDiscount();
    const delivery = get().getDeliveryFee();
    return Math.max(0, subtotal - discount + delivery);
  },

  getTotalItemsCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));
