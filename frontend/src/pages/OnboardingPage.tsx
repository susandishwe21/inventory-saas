import { useState, type SubmitEvent } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { CenteredCard } from '../components/CenteredCard';
import { signOut } from '../services/auth';
import { createOrganization, joinOrganization } from '../services/organizations';
import { useShop } from '../shop/ShopContext';

type Mode = 'create' | 'join';

const TEXT: Record<Mode, { title: string; intro: string; saving: string; submit: string }> = {
  create: {
    title: 'Create your shop',
    intro: "Give your shop a name. You'll be its owner, and later you can invite your staff.",
    saving: 'Creating shop…',
    submit: 'Create shop',
  },
  join: {
    title: 'Join a shop',
    intro: 'Enter the invite code you got from the shop owner. You will join as staff.',
    saving: 'Joining…',
    submit: 'Join shop',
  },
};

// First step after registering: create your own shop, or join one with an invite code
export function OnboardingPage() {
  const { session } = useAuth();
  const { shop, reload } = useShop();
  const [mode, setMode] = useState<Mode>('create');
  const [value, setValue] = useState(''); // shop name or invite code, depending on mode
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already in a shop: onboarding happens only once
  if (shop) return <Navigate to="/dashboard" replace />;

  function switchMode(next: Mode) {
    setMode(next);
    setValue('');
    setError(null);
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (mode === 'create') await createOrganization(value.trim());
      else await joinOrganization(value.trim());
      await reload(); // shop is set now, so the check above sends us to the dashboard
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await signOut();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const text = TEXT[mode];

  return (
    <CenteredCard>
      {/* Two options side by side, like tabs */}
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
        {(['create', 'join'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {m === 'create' ? 'Create a shop' : 'Join with invite code'}
          </button>
        ))}
      </div>

      <h1 className="text-xl font-semibold tracking-tight">{text.title}</h1>
      <p className="mt-1 text-sm text-slate-500">{text.intro}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <p className="alert-error">{error}</p>}
        {mode === 'create' ? (
          <div>
            <label className="label" htmlFor="shop-name">Shop name</label>
            <input
              id="shop-name"
              className="input"
              required
              autoFocus
              maxLength={100}
              placeholder="e.g. Golden Mart"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        ) : (
          <div>
            <label className="label" htmlFor="invite-code">Invite code</label>
            <input
              id="invite-code"
              className="input font-mono tracking-widest uppercase"
              required
              autoFocus
              autoComplete="off"
              maxLength={9}
              placeholder="XXXX-XXXX"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        )}
        <button type="submit" className="btn btn-primary w-full" disabled={saving || !value.trim()}>
          {saving ? text.saving : text.submit}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Signed in as <span className="font-medium text-slate-700">{session?.user.email}</span>.{' '}
        <button type="button" onClick={handleLogout} className="font-medium text-indigo-600 hover:text-indigo-500">
          Log out
        </button>
      </p>
    </CenteredCard>
  );
}
