export interface PromotionalOffer {
  id: string;
  code: string;
  title: string;
  description: string;
  discountPercentage: number;
  discountAmount?: number;
  minOrderValue: number;
  categoryLimit?: string;
  badge: string;
  color: string;
  expiresIn: string;
}
