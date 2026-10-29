import { Product } from './product';

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: number;
}

export interface DeliveryAddress {
  id: string;
  label: string;
  name: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault?: boolean;
}

export interface AppliedOffer {
  code: string;
  discountPercentage?: number;
  discountAmount?: number;
  description: string;
}
