import { Navigate, Outlet } from 'react-router';
import { useShop } from '../shop/ShopContext';

// Wraps the app pages: a signed-in user without a shop must create one first
export function RequireShop() {
  const { shop } = useShop();
  if (!shop) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}
