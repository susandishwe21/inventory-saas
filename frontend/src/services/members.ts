// Members of the current shop and invite codes (Settings → Members)

import { supabase } from '../lib/supabase';
import type { Member, OrgInvite } from '../types';
import { friendlyError, requireChanged } from './errors';

// Everyone in the shop, oldest first (RLS returns only the current shop's members)
export async function listMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('memberships')
    .select('user_id, role, email, created_at')
    .order('created_at');
  if (error) throw friendlyError(error);
  return data as Member[];
}

// Owners only: the database removes staff, never an owner
export async function removeMember(userId: string): Promise<void> {
  const { data, error } = await supabase.from('memberships').delete().eq('user_id', userId).select('user_id');
  if (error) throw friendlyError(error);
  requireChanged(data, 'Could not remove this member. Only the owner can remove staff.');
}

// Owners only: a new single-use code, valid for 7 days
export async function createInvite(): Promise<string> {
  const { data, error } = await supabase.rpc('create_invite');
  if (error) throw friendlyError(error);
  return data as string;
}

// Codes that can still be used (not used, not expired), newest first
export async function listInvites(): Promise<OrgInvite[]> {
  const { data, error } = await supabase
    .from('org_invites')
    .select('code, org_id, created_by, created_at, expires_at, used_by, used_at')
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (error) throw friendlyError(error);
  return data as OrgInvite[];
}
