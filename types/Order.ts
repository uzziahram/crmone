import { OrderItem } from "./Order_item";
// Interface for the 'orders' table
export default interface Order {
  order_id: number;
  customer_id: number;
  order_date: Date;
  total_amount: number;
  discount_applied: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled'; // Based on ENUM(...)
  items: OrderItem[];
}