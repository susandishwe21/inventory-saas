// Stock history: every stock movement in the shop (read only; movements are never edited)

import { supabase } from '../lib/supabase';
import type { MovementType, Product, StockMovement } from '../types';
import { friendlyError } from './errors';

export type MovementFilters = {
  product?: string | null; // a product id, or null for all
  type?: MovementType | null;
  from?: string | null; // "2026-10-01" (local date), inclusive
  to?: string | null; // "2026-10-31" (local date), inclusive
};

// A movement with the product it belongs to
export type MovementRow = StockMovement & {
  product: Pick<Product, 'id' | 'name' | 'sku'> | null;
};

export type MovementPage = {
  movements: MovementRow[];
  total: number; // all matching movements, not just this page
};

// "2026-10-30" → midnight at the start of that day in the user's time zone, as an ISO timestamp
function startOfDay(date: string): string {
  return new Date(`${date}T00:00:00`).toISOString();
}

function startOfNextDay(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString();
}

// select() on stock_movements with the filters applied (RLS limits it to the current shop)
function movementsQuery(columns: string, options: { count: 'exact'; head?: boolean }, filters: MovementFilters) {
  let query = supabase.from('stock_movements').select(columns, options);
  if (filters.product) query = query.eq('product_id', filters.product);
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.from) query = query.gte('created_at', startOfDay(filters.from));
  if (filters.to) query = query.lt('created_at', startOfNextDay(filters.to)); // before the next day = the whole "to" day
  return query;
}

// One page of movements, newest first (page starts at 1)
export async function listHistory(page: number, pageSize: number, filters: MovementFilters = {}): Promise<MovementPage> {
  const from = (page - 1) * pageSize;
  const { data, error, count } = await movementsQuery('*, product:products(id, name, sku)', { count: 'exact' }, filters)
    .order('created_at', { ascending: false })
    .order('id') // tie-breaker for movements with the same time
    .range(from, from + pageSize - 1);

  // Page is past the end (e.g. ?page=99): return no rows but the real total
  if (error?.code === 'PGRST103') {
    const { count: total, error: countError } = await movementsQuery('*', { count: 'exact', head: true }, filters);
    if (countError) throw friendlyError(countError);
    return { movements: [], total: total ?? 0 };
  }
  if (error) throw friendlyError(error);
  return { movements: (data ?? []) as unknown as MovementRow[], total: count ?? 0 };
}
