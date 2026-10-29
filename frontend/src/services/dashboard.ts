// Numbers for the dashboard, calculated in the database

import { supabase } from '../lib/supabase';
import type { DashboardSummary } from '../types';
import { friendlyError } from './errors';

// Stock value and in / low / out counts for the current shop (RLS limits it to the shop)
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data, error } = await supabase.rpc('dashboard_summary').single();
  if (error) throw friendlyError(error);
  const row = data as DashboardSummary;
  return { ...row, stock_value: Number(row.stock_value) }; // numeric may arrive as a string
}
