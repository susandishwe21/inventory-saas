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