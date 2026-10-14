// Call the supabase client (database)

import { supabase } from '../lib/supabase';
import type { Product, ProductInput } from '../types';

// Handle database errors and return user-friendly messages
function friendlyError(error: { code?: string; message: string }): Error {
  if (error.code === '23505') return new Error('This SKU already exists.');
  return new Error(error.message);
}

// List all products from the database
export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);

  return (data ?? []).map((p) => ({ ...p, price: Number(p.price) }));
}

// Create a new product in the database
export async function createProduct(input: ProductInput): Promise<void> {
  const { error } = await supabase.from('products').insert(input);

  if (error) {
    if (error.code === '23505') throw new Error('This SKU already exists.');
    throw new Error(error.message);
  }
}

// Update an existing product in the database
export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  const { error } = await supabase.from('products').update(input).eq('id', id);
  if (error) throw friendlyError(error);
}

// Delete a product from the database
export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw friendlyError(error);
}