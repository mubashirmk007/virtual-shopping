export type PackageType =
  | 'carton'
  | 'bottle'
  | 'box'
  | 'bag'
  | 'can'
  | 'jar'
  | 'packet'
  | 'produce';

export interface NutritionalInfo {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber?: string;
}

export interface ProductVisualConfig {
  packageType: PackageType;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  textColor?: string;
  label: string;
  subLabel?: string;
  badge?: string;
  pattern?: 'stripes' | 'solid' | 'gradient' | 'dots' | 'leaf' | 'grain' | 'splash';
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    radius?: number;
  };
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  categoryId: string;
  subcategoryId?: string;
  price: number; // in INR (₹)
  originalPrice?: number;
  currency: string;
  unit: string;
  netQuantity: string;
  packageType: PackageType;
  visual: ProductVisualConfig;
  rating: number;
  reviewCount: number;
  stockQuantity: number;
  inStock: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isOnOffer?: boolean;
  offerLabel?: string;
  nutritionalInfo?: NutritionalInfo;
  ingredients?: string[];
  allergenInfo?: string;
  shelfLife?: string;
  storageInstructions?: string;
  aisleId: string;
  shelfId: string;
  shelfTier: number; // 0 (bottom) to 3 (top)
  shelfSlot: number; // 0 to N along the tier
  tags: string[];
}
