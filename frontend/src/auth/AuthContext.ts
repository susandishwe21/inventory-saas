import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export type AuthState = {
  session: Session | null;
  loading: boolean; // true until we know whether a saved session exists
};

export const AuthContext = createContext<AuthState | null>(null);

// The current session, from any component inside <AuthProvider>
export function useAuth(): AuthState {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside <AuthProvider>');
  return auth;
}
