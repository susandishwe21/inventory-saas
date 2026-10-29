export type Category = {
  id: string;
  name: string;
  created_at: string;
};

export type CategoryWithCount = Category & {
  product_count: number;
};

// Define the Product type
export type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  category_id: string | null;
  category: Pick<Category, 'id' | 'name'> | null; // joined from categories when listing
  image_path: string | null; // file path in the "product-images" storage bucket
  created_at: string;
};

// What the product form wants to do with the image when saving
export type ImageChange =
  | { type: 'keep' }
  | { type: 'set'; image: Blob } // already resized
  | { type: 'remove' };

export type ProductInput = {
  name: string;
  sku: string;
  price: number;
  category_id: string | null;
  stock_quantity?: number; // only when creating; editing never changes stock (use stock movements)
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