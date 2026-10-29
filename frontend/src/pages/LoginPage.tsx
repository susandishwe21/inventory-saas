import { useState, type SubmitEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { signIn } from '../services/auth';

export function LoginPage() {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      // No navigate here: AuthLayout sees the new session and redirects
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Log in</h1>
      <p className="mt-1 text-sm text-slate-500">Welcome back. Log in to manage your stock.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <p className="alert-error">{error}</p>}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={saving}>
          {saving ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        No account yet?{' '}
        {/* pass state on, so "go back to the page you wanted" still works after registering */}
        <Link to="/register" state={location.state} className="font-medium text-indigo-600 hover:text-indigo-500">
          Create one
        </Link>
      </p>
    </>
  );
}
