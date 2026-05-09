import { Order } from "./Order";
import { InCart } from "./InCart";

export interface Customer {
  customer_id: number;
  full_name: string;
  email: string;
  password: string;
  contact_number?: string;
  address?: string;
  created_at: Date;
  // Relations
  orders?: Order[];
  cart_items?: InCart[];
}