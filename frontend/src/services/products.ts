// Call the supabase client (database)

import { supabase } from '../lib/supabase';
import type { Product } from '../types';

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);

  return (data ?? []).map((p) => ({ ...p, price: Number(p.price) }));
}