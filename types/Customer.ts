import Order from "./Order"

export interface Customer {
  customer_id: number;
  full_name: string;
  email: string;
  password: string;
  contact_number?: string;
  address?: string;
  created_at: Date | string; 
  orders: Order[]
}