import type { AuthError, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Turn Supabase Auth errors into messages a user can understand
function authError(error: AuthError): Error {
  switch (error.code) {
    case 'invalid_credentials':
      return new Error('Wrong email or password.');
    case 'email_not_confirmed':
      return new Error('Please confirm your email first. Check your inbox for the link.');
    case 'user_already_exists':
    case 'email_exists':
      return new Error('An account with this email already exists. Try logging in.');
    case 'weak_password':
      return new Error('Password is too weak. Use at least 6 characters.');
    case 'over_email_send_rate_limit':
      return new Error('Too many emails sent. Wait a while, or turn off "Confirm email" in Supabase for development.');
    default:
      return new Error(error.message);
  }
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw authError(error);
  return data.session;
}

// Calls `callback` on every login, logout and token refresh. Returns a function that stops listening.
export function onAuthChange(callback: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw authError(error);
}

// Returns true when the user is signed in right away,
// false when Supabase first wants them to confirm their email
export async function signUp(email: string, password: string): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw authError(error);
  return data.session !== null;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw authError(error);
}
