import { useState, type SubmitEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { signUp } from '../services/auth';

const MIN_PASSWORD = 6; // Supabase's default minimum

export function RegisterPage() {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false); // Supabase wants the email confirmed first

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) {
      setError('The two passwords are not the same.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const signedIn = await signUp(email.trim(), password);
      // Signed in: AuthLayout sees the new session and redirects
      if (!signedIn) {
        setCheckEmail(true);
        setSaving(false);
      }
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  if (checkEmail) {
    return (
      <>
        <h1 className="text-xl font-semibold tracking-tight">Check your email</h1>
        <p className="mt-2 text-sm text-slate-600">
          We sent a confirmation link to <span className="font-medium text-slate-900">{email.trim()}</span>.
          Open it, then come back and log in.
        </p>
        <Link to="/login" state={location.state} className="btn btn-primary mt-6 w-full">Go to log in</Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">Start tracking your shop's stock.</p>

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
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">At least {MIN_PASSWORD} characters.</p>
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            className="input"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={saving}>
          {saving ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="font-medium text-indigo-600 hover:text-indigo-500">
          Log in
        </Link>
      </p>
    </>
  );
}
