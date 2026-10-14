// Call the supabase client (database)

import { supabase } from '../lib/supabase';
import type { Product, ProductInput } from '../types';

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