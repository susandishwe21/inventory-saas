import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { CenteredCard } from '../components/CenteredCard';
import { getMyShop } from '../services/organizations';
import type { MyShop } from '../types';
import { ShopContext } from './ShopContext';

// Route element (inside RequireAuth): loads the signed-in user's shop for all pages below it
export function ShopProvider() {
  const { session } = useAuth();
  if (!session) return null; // RequireAuth already redirected
  // key: a different user logging in starts again with a fresh, empty state
  return <ShopLoader key={session.user.id} userId={session.user.id} />;
}

function ShopLoader({ userId }: { userId: string }) {
  const [shop, setShop] = useState<MyShop | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getMyShop(userId)
      .then((s) => {
        if (ignore) return;
        setShop(s);
        setStatus('ready');
      })
      .catch((e: Error) => {
        if (ignore) return;
        setError(e.message);
        setStatus('error');
      });
    return () => {
      ignore = true;
    };
  }, [userId]);

  // Fetch again without unmounting the page (used after creating a shop)
  async function reload() {
    try {
      setShop(await getMyShop(userId));
      setStatus('ready');
    } catch (e) {
      setError((e as Error).message);
      setStatus('error');
    }
  }

  function retry() {
    setStatus('loading');
    reload();
  }

  if (status === 'loading') {
    return <p className="py-24 text-center text-sm text-slate-500">Loading your shop…</p>;
  }
  if (status === 'error') {
    return (
      <CenteredCard>
        <p className="alert-error">Could not load your shop: {error}</p>
        <button className="btn btn-primary mt-4 w-full" onClick={retry}>Try again</button>
      </CenteredCard>
    );
  }

  return (
    <ShopContext.Provider value={{ shop, reload }}>
      <Outlet />
    </ShopContext.Provider>
  );
}
