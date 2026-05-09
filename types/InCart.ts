import { Product } from "./Product";

export interface InCart {
  cart_item_id: number;
  customer_id: number;
  product_id: number;
  quantity: number;
  added_at: Date;
  // Relations
  product?: Product;
}