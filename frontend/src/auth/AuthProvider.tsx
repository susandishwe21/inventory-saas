import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSession, onAuthChange } from '../services/auth';
import { AuthContext } from './AuthContext';

// Loads the saved session once, then follows every login / logout / token refresh
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    getSession()
      .then((s) => {
        if (!ignore) setSession(s);
      })
      .catch(() => {
        if (!ignore) setSession(null); // unreadable saved session: treat as signed out
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    const stop = onAuthChange((s) => setSession(s));
    return () => {
      ignore = true;
      stop();
    };
  }, []);

  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>;
}
