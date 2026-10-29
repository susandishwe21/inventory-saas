import { useState } from 'react';
import { NavLink } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { signOut } from '../services/auth';
import { useShop } from '../shop/ShopContext';
import { Icon, type IconName } from './icons';

type NavItem = { to: string; label: string; icon: IconName };

// Sidebar menu grouped by inventory workflow
const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: 'dashboard' }],
  },
  {
    title: 'Inventory',
    items: [
      { to: '/products', label: 'Products', icon: 'products' },
      { to: '/categories', label: 'Categories', icon: 'categories' },
      { to: '/suppliers', label: 'Suppliers', icon: 'suppliers' },
    ],
  },
  {
    title: 'Stock',
    items: [{ to: '/history', label: 'Stock history', icon: 'history' }],
  },
];

type Props = {
  onNavigate?: () => void; // mobile: close the menu after a link is clicked
};

export function Sidebar({ onNavigate }: Props) {
  const { shop } = useShop();

  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto border-r border-slate-200 bg-white px-4 py-5">
      <div className="flex items-center gap-2.5 px-2">
        <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white">
          <Icon name="products" className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-tight" title={shop?.organization.name}>
            {shop?.organization.name}
          </p>
          <p className="text-xs text-slate-500">Inventory</p>
        </div>
      </div>

      {GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-1.5 px-2 text-xs font-medium tracking-wide text-slate-400 uppercase">{group.title}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <SidebarLink item={item} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="mt-auto space-y-0.5 border-t border-slate-100 pt-4">
        <SidebarLink item={{ to: '/settings', label: 'Settings', icon: 'settings' }} onNavigate={onNavigate} />
        <UserMenu />
      </div>
    </nav>
  );
}

// Who is signed in, plus the logout button
function UserMenu() {
  const { session } = useAuth();
  const { shop } = useShop();
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setError(null);
    try {
      await signOut(); // RequireAuth sees the session is gone and sends us to /login
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="pt-2">
      <p className="truncate px-2 text-xs text-slate-500" title={session?.user.email}>
        {session?.user.email}
      </p>
      <p className="px-2 text-xs font-medium text-slate-400 capitalize">{shop?.role}</p>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-1 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
      >
        <Icon name="logout" />
        Log out
      </button>
      {error && <p className="px-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`
      }
    >
      <Icon name={item.icon} />
      {item.label}
    </NavLink>
  );
}
