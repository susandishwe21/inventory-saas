import { useState } from 'react';
import { Outlet } from 'react-router';
import { Icon } from '../components/icons';
import { Sidebar } from '../components/Sidebar';
import { useShop } from '../shop/ShopContext';

// Page shell: sidebar on the left, the current page (<Outlet />) on the right
export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false); // mobile only
  const { shop } = useShop();

  return (
    <div className="min-h-screen">
      {/* Desktop: sidebar is always visible */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile: sidebar slides over the page when the menu is open */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-xl">
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </aside>
          <button
            className="absolute top-4 left-66 rounded-lg bg-white p-1.5 text-slate-600 shadow"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <Icon name="close" />
          </button>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button className="btn btn-ghost -ml-2" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <span className="truncate font-semibold tracking-tight">{shop?.organization.name}</span>
        </div>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
