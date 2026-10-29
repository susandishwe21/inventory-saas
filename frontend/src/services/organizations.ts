// Organizations (shops) and memberships

import { supabase } from '../lib/supabase';
import type { MyShop } from '../types';
import { friendlyError } from './errors';

// The user's shop and role, or null when they haven't created or joined one yet
export async function getMyShop(userId: string): Promise<MyShop | null> {
  const { data, error } = await supabase
    .from('memberships')
    .select('role, organization:organizations(id, name)')
    .eq('user_id', userId) // RLS also returns the other members of the shop; we only want ours
    .maybeSingle();
  if (error) throw friendlyError(error);
  return data as unknown as MyShop | null;
}

// Creates the shop and makes the current user its owner (one transaction, in the database)
export async function createOrganization(name: string): Promise<void> {
  const { error } = await supabase.rpc('create_organization', { org_name: name });
  if (error) throw friendlyError(error, 'You already belong to a shop.');
}

// Joins a shop as staff with an invite code from its owner (checked in the database)
export async function joinOrganization(code: string): Promise<void> {
  const { error } = await supabase.rpc('join_organization', { invite_code: code });
  if (error) throw friendlyError(error, 'You already belong to a shop.');
}
