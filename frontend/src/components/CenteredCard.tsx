import type { ReactNode } from 'react';
import { Icon } from './icons';

// Logo + a card in the middle of the screen (login, register, onboarding)
export function CenteredCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-6 flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-lg bg-indigo-600 text-white">
          <Icon name="products" className="size-5" />
        </span>
        <span className="text-lg font-semibold tracking-tight">Inventory</span>
      </div>
      <div className="card w-full max-w-sm p-6 sm:p-8">{children}</div>
    </div>
  );
}
