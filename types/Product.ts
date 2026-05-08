export interface Product {
  product_id: number;
  product_name: string;
  sku: string;
  category: string;
  size?: string;
  price: number;
  stock_quantity: number;
  low_stock_alert: number;
  created_at: Date;
}