import { createContext, useContext } from 'react';
import type { MyShop, Role } from '../types';

export type ShopState = {
  shop: MyShop | null; // null until the user creates or joins a shop
  reload: () => Promise<void>; // call after creating a shop
};

export const ShopContext = createContext<ShopState | null>(null);

// The signed-in user's shop and role, from any component inside <ShopProvider>
export function useShop(): ShopState {
  const shop = useContext(ShopContext);
  if (!shop) throw new Error('useShop must be used inside <ShopProvider>');
  return shop;
}

// The signed-in user's role. Hiding buttons is only for a clean UI: the database (RLS) enforces the rules.
export function useRole(): { role: Role | null; isOwner: boolean } {
  const { shop } = useShop();
  const role = shop?.role ?? null;
  return { role, isOwner: role === 'owner' };
}
