import { Product } from "./Product";

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  rating?: number; // TINYINT
  comments?: string; // TEXT
  // Relations
  product?: Product;
}