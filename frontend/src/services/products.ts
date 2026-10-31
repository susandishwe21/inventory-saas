// Call the supabase client (database)

import { supabase } from '../lib/supabase';
import type { ImageChange, Product, ProductInput, StockMovement, StockMovementInput, StockStatus } from '../types';
import { friendlyError, requireChanged } from './errors';
import { deleteProductImage, uploadProductImage } from './productImages';

const DUPLICATE_SKU = 'This SKU already exists.';

export type ProductPage = {
  products: Product[];
  total: number; // number of products in the whole table, not just this page
};

// Filter values in the URL: missing = all products, 'none' = products without one, otherwise an id
export const UNCATEGORIZED = 'none';
export const NO_SUPPLIER = 'none';

export type ProductFilters = {
  category?: string | null; // a category id, UNCATEGORIZED, or null for all
  supplier?: string | null; // a supplier id, NO_SUPPLIER, or null for all
  search?: string | null; // part of the name or SKU, any case
  status?: StockStatus | null; // 'in' / 'low' / 'out', or null for all
};

// Turn what the user typed into a safe PostgREST value for "name or SKU contains this text".
// 1. LIKE wildcards: % and _ in the text should match themselves, so escape them with \.
// 2. Double quotes let the value contain , ( ) which otherwise split the .or() filter;
//    inside the quotes, \ and " must be escaped with \ too.
function containsPattern(text: string): string {
  const like = `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  return `"${like.replace(/[\\"]/g, (c) => `\\${c}`)}"`;
}

// select() on products with the filters applied (they combine with AND)
function productsQuery(columns: string, options: { count?: 'exact'; head?: boolean }, filters: ProductFilters) {
  let query = supabase.from('products').select(columns, options);
  if (filters.category === UNCATEGORIZED) query = query.is('category_id', null);
  else if (filters.category) query = query.eq('category_id', filters.category);
  if (filters.supplier === NO_SUPPLIER) query = query.is('supplier_id', null);
  else if (filters.supplier) query = query.eq('supplier_id', filters.supplier);
  if (filters.status) query = query.eq('status', filters.status); // generated column from Phase 8
  const search = filters.search?.trim();
  if (search) {
    const pattern = containsPattern(search);
    query = query.or(`name.ilike.${pattern},sku.ilike.${pattern}`);
  }
  return query;
}

// Every product column, plus the category and supplier names
const PRODUCT_COLUMNS = '*, category:categories(id, name), supplier:suppliers(id, name)';

// numeric columns arrive as strings, so turn them into numbers
function toProducts(data: unknown): Product[] {
  return ((data ?? []) as Product[]).map((p) => ({ ...p, price: Number(p.price), cost_price: Number(p.cost_price) }));
}

// List one page of products (page starts at 1). The database only sends these rows.
export async function listProducts(page: number, pageSize: number, filters: ProductFilters = {}): Promise<ProductPage> {
  const from = (page - 1) * pageSize;
  const { data, error, count } = await productsQuery(PRODUCT_COLUMNS, { count: 'exact' }, filters)
    .order('name')
    .order('id') // tie-breaker: products with the same name keep a fixed order between pages
    .range(from, from + pageSize - 1);

  // Page is past the end (e.g. ?page=99): return no rows but the real total
  if (error?.code === 'PGRST103') {
    return { products: [], total: await countProducts(filters) };
  }
  if (error) throw friendlyError(error);

  return { products: toProducts(data), total: count ?? 0 };
}

const EXPORT_CHUNK = 1000; // Supabase sends at most 1000 rows per request

// Every product matching the filters (for CSV export), fetched 1000 at a time
export async function listAllProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const all: Product[] = [];
  for (let from = 0; ; from += EXPORT_CHUNK) {
    const { data, error } = await productsQuery(PRODUCT_COLUMNS, {}, filters)
      .order('name')
      .order('id') // same fixed order as the table, so chunks don't overlap or skip rows
      .range(from, from + EXPORT_CHUNK - 1);
    if (error) throw friendlyError(error);
    all.push(...toProducts(data));
    if (data.length < EXPORT_CHUNK) return all; // last chunk
  }
}

// Count products without downloading any rows
export async function countProducts(filters: ProductFilters = {}): Promise<number> {
  const { count, error } = await productsQuery('*', { count: 'exact', head: true }, filters);
  if (error) throw friendlyError(error);
  return count ?? 0;
}

// What setProductImage needs to know about a product
export type ProductImageTarget = Pick<Product, 'id' | 'org_id' | 'image_path'>;

// Create a new product (the database fills in org_id) and return what's needed to upload its image.
// Stock starts at 0; opening stock is recorded afterwards as an "in" movement.
export async function createProduct(input: ProductInput): Promise<ProductImageTarget> {
  const { data, error } = await supabase.from('products').insert(input).select('id, org_id, image_path').single();
  if (error) throw friendlyError(error, DUPLICATE_SKU);
  return data as ProductImageTarget;
}

// Apply the image change from the product form: upload / remove, then save image_path
export async function setProductImage(product: ProductImageTarget, change: ImageChange): Promise<void> {
  if (change.type === 'keep') return;

  const oldPath = product.image_path;
  const newPath = change.type === 'set' ? await uploadProductImage(product.org_id, product.id, change.image) : null;
  const { data, error } = await supabase.from('products').update({ image_path: newPath }).eq('id', product.id).select('id');
  try {
    if (error) throw friendlyError(error);
    requireChanged(data);
  } catch (e) {
    if (newPath) await deleteProductImage(newPath).catch(() => {}); // undo the upload
    throw e;
  }
  // The product already points to the new image; if deleting the old file fails, it's only a leftover file
  if (oldPath) await deleteProductImage(oldPath).catch(() => {});
}

// Update an existing product in the database
export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  const { data, error } = await supabase.from('products').update(input).eq('id', id).select('id');
  if (error) throw friendlyError(error, DUPLICATE_SKU);
  requireChanged(data);
}

// Delete a product from the database, then its image file
export async function deleteProduct(id: string): Promise<void> {
  const { data, error } = await supabase.from('products').delete().eq('id', id).select('image_path');
  if (error) throw friendlyError(error);
  requireChanged(data);
  const imagePath = data[0].image_path as string | null;
  if (imagePath) await deleteProductImage(imagePath).catch(() => {}); // product is gone either way
}
// Record a stock movement. The database trigger applies it to products.stock_quantity.
export async function addStockMovement(input: StockMovementInput): Promise<void> {
  const { error } = await supabase.from('stock_movements').insert(input);
  // 23514 = check constraint: stock_quantity would go below 0
  if (error?.code === '23514' && error.message.includes('stock_quantity')) {
    throw new Error('Not enough stock: this would make the stock less than 0.');
  }
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