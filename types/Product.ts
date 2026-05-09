export interface Product {
  product_id: number;
  product_name: string;
  sku: string;
  category: string;
  size?: string; // Optional as per ERD symbol
  price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_alert: number;
  image_url?: string;
  created_at: Date;
}
