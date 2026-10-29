// Categories: list, create, rename, delete

import { supabase } from '../lib/supabase';
import type { Category, CategoryWithCount } from '../types';
import { friendlyError } from './errors';

const DUPLICATE = 'A category with this name already exists.';

// All categories A–Z, each with how many products it has
export async function listCategories(): Promise<CategoryWithCount[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, created_at, products(count)') // products(count) = count products by category_id
    .order('name');
  if (error) throw friendlyError(error);

  return (data ?? []).map(({ products, ...category }) => ({
    ...(category as Category),
    product_count: (products as { count: number }[])[0]?.count ?? 0,
  }));
}

export async function createCategory(name: string): Promise<void> {
  const { error } = await supabase.from('categories').insert({ name });
  if (error) throw friendlyError(error, DUPLICATE);
}

export async function renameCategory(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('categories').update({ name }).eq('id', id);
  if (error) throw friendlyError(error, DUPLICATE);
}

// Products in this category are kept; the database sets their category_id to null
export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw friendlyError(error);
}
