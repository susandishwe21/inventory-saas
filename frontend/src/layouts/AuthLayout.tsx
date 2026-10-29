import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { CenteredCard } from '../components/CenteredCard';

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
    <CenteredCard>
      <Outlet />
    </CenteredCard>
  );
}
