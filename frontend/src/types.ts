// Define the Product type
export type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  created_at: string;
};

export type ProductInput = {
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
};

export type MovementType = 'in' | 'out' | 'adjustment';

export type StockMovement = {
  id: string;
  product_id: string;
  type: MovementType;
  quantity: number;
  note: string | null;
  created_at: string;
};

export type StockMovementInput = {
  product_id: string;
  type: MovementType;
  quantity: number;
  note?: string;
};