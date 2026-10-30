// Suppliers: list, create, update, delete (owners only, enforced by RLS)

import { supabase } from '../lib/supabase';
import type { Supplier, SupplierInput, SupplierWithCount } from '../types';
import { friendlyError, requireChanged } from './errors';

const DUPLICATE = 'A supplier with this name already exists.';

// All suppliers A–Z, each with how many products it supplies
export async function listSuppliers(): Promise<SupplierWithCount[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, org_id, name, contact_name, email, phone, created_at, products(count)')
    .order('name');
  if (error) throw friendlyError(error);

  return (data ?? []).map(({ products, ...supplier }) => ({
    ...(supplier as Supplier),
    product_count: (products as { count: number }[])[0]?.count ?? 0,
  }));
}

export async function createSupplier(input: SupplierInput): Promise<void> {
  const { error } = await supabase.from('suppliers').insert(input);
  if (error) throw friendlyError(error, DUPLICATE);
}

export async function updateSupplier(id: string, input: SupplierInput): Promise<void> {
  const { data, error } = await supabase.from('suppliers').update(input).eq('id', id).select('id');
  if (error) throw friendlyError(error, DUPLICATE);
  requireChanged(data);
}

// Products from this supplier are kept; the database sets their supplier_id to null
export async function deleteSupplier(id: string): Promise<void> {
  const { data, error } = await supabase.from('suppliers').delete().eq('id', id).select('id');
  if (error) throw friendlyError(error);
  requireChanged(data);
}
