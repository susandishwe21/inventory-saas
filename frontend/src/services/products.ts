// Call the supabase client (database)

import { supabase } from '../lib/supabase';
import type { ImageChange, Product, ProductInput, StockMovement, StockMovementInput } from '../types';
import { friendlyError } from './errors';
import { deleteProductImage, uploadProductImage } from './productImages';

const DUPLICATE_SKU = 'This SKU already exists.';

export type ProductPage = {
  products: Product[];
  total: number; // number of products in the whole table, not just this page
};

// Category filter: null = all products, UNCATEGORIZED = products without a category, otherwise a category id
export const UNCATEGORIZED = 'none';
export type CategoryFilter = string | null;

// select() on products, filtered by category
function productsQuery(columns: string, options: { count: 'exact'; head?: boolean }, category: CategoryFilter) {
  const query = supabase.from('products').select(columns, options);
  if (category === UNCATEGORIZED) return query.is('category_id', null);
  if (category) return query.eq('category_id', category);
  return query;
}

// List one page of products (page starts at 1). The database only sends these rows.
export async function listProducts(page: number, pageSize: number, category: CategoryFilter = null): Promise<ProductPage> {
  const from = (page - 1) * pageSize;
  const { data, error, count } = await productsQuery('*, category:categories(id, name)', { count: 'exact' }, category) // also fetch the category name
    .order('name')
    .order('id') // tie-breaker: products with the same name keep a fixed order between pages
    .range(from, from + pageSize - 1);

  // Page is past the end (e.g. ?page=99): return no rows but the real total
  if (error?.code === 'PGRST103') {
    return { products: [], total: await countProducts(category) };
  }
  if (error) throw friendlyError(error);

  return {
    products: (data as unknown as Product[] ?? []).map((p) => ({ ...p, price: Number(p.price) })),
    total: count ?? 0,
  };
}

// Count products without downloading any rows
export async function countProducts(category: CategoryFilter = null): Promise<number> {
  const { count, error } = await productsQuery('*', { count: 'exact', head: true }, category);
  if (error) throw friendlyError(error);
  return count ?? 0;
}

// Create a new product in the database and return its id (needed to upload its image)
export async function createProduct(input: ProductInput): Promise<string> {
  const { data, error } = await supabase.from('products').insert(input).select('id').single();
  if (error) throw friendlyError(error, DUPLICATE_SKU);
  return data.id as string;
}

// Apply the image change from the product form: upload / remove, then save image_path
export async function setProductImage(productId: string, oldPath: string | null, change: ImageChange): Promise<void> {
  if (change.type === 'keep') return;

  const newPath = change.type === 'set' ? await uploadProductImage(productId, change.image) : null;
  const { error } = await supabase.from('products').update({ image_path: newPath }).eq('id', productId);
  if (error) {
    if (newPath) await deleteProductImage(newPath).catch(() => {}); // undo the upload
    throw friendlyError(error);
  }
  // The product already points to the new image; if deleting the old file fails, it's only a leftover file
  if (oldPath) await deleteProductImage(oldPath).catch(() => {});
}

// Update an existing product in the database
export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  const { error } = await supabase.from('products').update(input).eq('id', id);
  if (error) throw friendlyError(error, DUPLICATE_SKU);
}

// Delete a product from the database, then its image file
export async function deleteProduct(id: string): Promise<void> {
  const { data, error } = await supabase.from('products').delete().eq('id', id).select('image_path');
  if (error) throw friendlyError(error);
  const imagePath = data?.[0]?.image_path as string | null | undefined;
  if (imagePath) await deleteProductImage(imagePath).catch(() => {}); // product is gone either way
}
// Define the types for stock movements
export async function addStockMovement(input: StockMovementInput): Promise<void> {
  const { error } = await supabase.from('stock_movements').insert(input);
  if (error) throw friendlyError(error);
}

// List stock movements for a specific product
export async function listMovements(productId: string): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw friendlyError(error);
  return data ?? [];
}