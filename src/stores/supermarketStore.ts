import { create } from 'zustand';
import { Vector3D } from '@/types/supermarket';
import { Product } from '@/types/product';
import { AISLES } from '@/data/aisles';
import { PRODUCTS } from '@/data/products';
import { soundManager } from '@/lib/sound';

export interface MovementInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  strafeLeft: boolean;
  strafeRight: boolean;
  sprint: boolean;
  joystick: { x: number; y: number };
}

interface SupermarketState {
  currentAisleId: string;
  targetCameraPos: Vector3D;
  targetCameraLookAt: Vector3D;
  isCameraTransitioning: boolean;
  transitionId: number;
  hoveredProduct: Product | null;
  selectedProduct: Product | null;
  focusedProductId: string | null;
  activeCategory: string | null;

  // Game-like movement controls
  movementInput: MovementInput;
  setMovementInput: (input: Partial<MovementInput>) => void;

  // Trolley Flying Item Animation
  flyingProduct: Product | null;
  flyingTimestamp: number;
  triggerFlyToCart: (product: Product) => void;
  clearFlyingProduct: () => void;

  navigateToAisle: (aisleId: string) => void;
  navigateToProduct: (productId: string) => void;
  navigateToEntrance: () => void;
  navigateToBilling: (onComplete?: () => void) => void;
  onTransitionComplete: (() => void) | null;
  setOnTransitionComplete: (cb: (() => void) | null) => void;
  setHoveredProduct: (product: Product | null) => void;
  setSelectedProduct: (product: Product | null) => void;
  setFocusedProductId: (id: string | null) => void;
  setActiveCategory: (catId: string | null) => void;
  setIsCameraTransitioning: (val: boolean) => void;
}

const ENTRANCE_AISLE = AISLES.find((a) => a.id === 'aisle-entrance') || AISLES[0];

const INITIAL_MOVEMENT: MovementInput = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  strafeLeft: false,
  strafeRight: false,
  sprint: false,
  joystick: { x: 0, y: 0 },
};

export const useSupermarketStore = create<SupermarketState>((set, get) => ({
  currentAisleId: 'aisle-entrance',
  targetCameraPos: ENTRANCE_AISLE.cameraPosition,
  targetCameraLookAt: ENTRANCE_AISLE.cameraTarget,
  isCameraTransitioning: false,
  transitionId: 0,
  hoveredProduct: null,
  selectedProduct: null,
  focusedProductId: null,
  activeCategory: null,

  movementInput: INITIAL_MOVEMENT,
  flyingProduct: null,
  flyingTimestamp: 0,

  setMovementInput: (input) =>
    set((state) => ({
      movementInput: { ...state.movementInput, ...input },
    })),

  triggerFlyToCart: (product) => {
    set({
      flyingProduct: product,
      flyingTimestamp: Date.now(),
    });
  },

  clearFlyingProduct: () => {
    set({ flyingProduct: null });
  },

  navigateToAisle: (aisleId: string) => {
    const aisle = AISLES.find((a) => a.id === aisleId);
    if (!aisle) return;

    soundManager.playAisleTransition();

    set({
      currentAisleId: aisleId,
      targetCameraPos: aisle.cameraPosition,
      targetCameraLookAt: aisle.cameraTarget,
      isCameraTransitioning: true,
      transitionId: Date.now(),
      activeCategory: aisle.categoryIds[0] || null,
      focusedProductId: null,
    });
  },

  navigateToProduct: (productId: string) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;

    const aisle = AISLES.find((a) => a.id === product.aisleId);
    if (!aisle) return;

    soundManager.playSelect();

    // Determine shelf world position
    const isLeft = product.shelfId.includes('left');
    const xOffset = isLeft ? -1.2 : 1.2;
    const shelfX = aisle.worldPosition.x + xOffset;
    const shelfZ = aisle.worldPosition.z + (product.shelfTier * 0.2 - 0.5);

    // Place camera right in front of the shelf facing the product
    const camX = aisle.worldPosition.x + (isLeft ? 0.8 : -0.8);
    const camY = 1.6;
    const camZ = shelfZ + 1.2;

    set({
      currentAisleId: aisle.id,
      targetCameraPos: { x: camX, y: camY, z: camZ },
      targetCameraLookAt: { x: shelfX, y: 1.4, z: shelfZ },
      isCameraTransitioning: true,
      transitionId: Date.now(),
      selectedProduct: product,
      focusedProductId: product.id,
      activeCategory: product.categoryId,
    });
  },

  navigateToEntrance: () => {
    get().navigateToAisle('aisle-entrance');
  },

  navigateToBilling: (onComplete) => {
    soundManager.playAisleTransition();

    set({
      currentAisleId: 'aisle-entrance',
      // Place camera right in front of checkout counter (z: 16.5) facing conveyor belt & cash register
      targetCameraPos: { x: -0.6, y: 1.65, z: 19.2 },
      targetCameraLookAt: { x: -0.4, y: 1.25, z: 15.0 },
      isCameraTransitioning: true,
      transitionId: Date.now(),
      activeCategory: null,
      focusedProductId: null,
      onTransitionComplete: onComplete || null,
    });
  },

  onTransitionComplete: null,
  setOnTransitionComplete: (cb) => set({ onTransitionComplete: cb }),

  setHoveredProduct: (product) => {
    if (product && get().hoveredProduct?.id !== product.id) {
      soundManager.playHover();
    }
    set({ hoveredProduct: product });
  },

  setSelectedProduct: (product) => {
    if (product) {
      soundManager.playSelect();
    }
    set({ selectedProduct: product });
  },

  setFocusedProductId: (id) => set({ focusedProductId: id }),
  setActiveCategory: (catId) => set({ activeCategory: catId }),
  setIsCameraTransitioning: (val) => set({ isCameraTransitioning: val }),
}));
