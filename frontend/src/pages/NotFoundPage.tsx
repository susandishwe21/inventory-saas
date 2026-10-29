import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="py-24 text-center">
      <p className="text-sm font-semibold text-indigo-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="btn btn-primary mt-6">Go to dashboard</Link>
    </div>
  );
}
