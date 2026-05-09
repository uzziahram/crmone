import { OrderItem } from "./OrderItem";

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  order_id: number;
  customer_id: number;
  order_date: Date;
  total_amount: number;
  discount_applied: number;
  status: OrderStatus;
  payment_method: string;
  // Relations
  items?: OrderItem[];
}