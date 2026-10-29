import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';

// Wraps every page that needs a signed-in user.
// Signed out: go to /login and remember where the user wanted to go.
export function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="py-24 text-center text-sm text-slate-500">Loading…</p>;
  }
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}
