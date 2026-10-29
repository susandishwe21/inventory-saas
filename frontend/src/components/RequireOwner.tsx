import { Navigate, Outlet } from 'react-router';
import { useRole } from '../shop/ShopContext';

// Wraps owner-only pages (Settings): staff are sent to the dashboard
export function RequireOwner() {
  const { isOwner } = useRole();
  if (!isOwner) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
