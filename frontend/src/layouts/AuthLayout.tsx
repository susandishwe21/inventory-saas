import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { Icon } from '../components/icons';

// Centered card for /login and /register. Signed-in users are sent on to the app.
export function AuthLayout() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="py-24 text-center text-sm text-slate-500">Loading…</p>;
  }
  if (session) {
    // Back to the page RequireAuth sent us away from, or the dashboard
    const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';
    return <Navigate to={from} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-6 flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-lg bg-indigo-600 text-white">
          <Icon name="products" className="size-5" />
        </span>
        <span className="text-lg font-semibold tracking-tight">Inventory</span>
      </div>
      <div className="card w-full max-w-sm p-6 sm:p-8">
        <Outlet />
      </div>
    </div>
  );
}
