import { createContext, useContext } from 'react';
import type { MyShop } from '../types';

export type ShopState = {
  shop: MyShop | null; // null until the user creates (or, from Phase 6, joins) a shop
  reload: () => Promise<void>; // call after creating a shop
};

export const ShopContext = createContext<ShopState | null>(null);

// The signed-in user's shop and role, from any component inside <ShopProvider>
export function useShop(): ShopState {
  const shop = useContext(ShopContext);
  if (!shop) throw new Error('useShop must be used inside <ShopProvider>');
  return shop;
}
