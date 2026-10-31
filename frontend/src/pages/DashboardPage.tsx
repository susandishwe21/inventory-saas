import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getDashboardSummary } from '../services/dashboard';
import { useRole } from '../shop/ShopContext';
import type { DashboardSummary, StockStatus } from '../types';

// The three parts of the status bar, in a fixed order. Colors match the status pills on the products page.
const SEGMENTS: { status: StockStatus; label: string; key: 'in_stock' | 'low_stock' | 'out_of_stock'; color: string }[] = [
  { status: 'in', label: 'In stock', key: 'in_stock', color: 'bg-green-600' },
  { status: 'low', label: 'Low stock', key: 'low_stock', color: 'bg-amber-400' },
  { status: 'out', label: 'Out of stock', key: 'out_of_stock', color: 'bg-red-600' },
];

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function percent(count: number, total: number) {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

export function DashboardPage() {
  const { isOwner } = useRole();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return <p className="alert-error">{error}</p>;
  }
  if (!summary) {
    return <p className="py-24 text-center text-sm text-slate-500">Loading dashboard…</p>;
  }

  const total = summary.total_products;

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Your stock at a glance.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Stock value" value={formatMoney(summary.stock_value)} hint="Cost price × stock, all products" />
        <StatCard label="Products" value={total.toLocaleString()} />
        <StatCard label="Low stock" value={summary.low_stock.toLocaleString()} dot="bg-amber-400" to="/products?status=low" />
        <StatCard label="Out of stock" value={summary.out_of_stock.toLocaleString()} dot="bg-red-600" to="/products?status=out" />
      </div>

      <section className="card mt-6 p-5">
        <h2 className="text-base font-semibold">Stock status</h2>
        <p className="text-sm text-slate-500">How many products are in stock, low, or out of stock.</p>

        {total === 0 ? (
          <div className="mt-4">
            <div className="h-3 rounded bg-slate-100" />
            <p className="mt-3 text-sm text-slate-500">
              No products yet.{' '}
              {isOwner && (
                <Link to="/products" className="font-medium text-indigo-600 hover:text-indigo-500">Add your first product</Link>
              )}
            </p>
          </div>
        ) : (
          <>
            {/* One bar split by count; the white gaps (gap-0.5) keep neighbouring parts apart */}
            <div className="mt-4 flex h-3 gap-0.5" role="img" aria-label={SEGMENTS.map((s) => `${s.label}: ${summary[s.key]}`).join(', ')}>
              {SEGMENTS.filter((s) => summary[s.key] > 0).map((s) => (
                <div
                  key={s.status}
                  className={`${s.color} rounded transition-opacity hover:opacity-80`}
                  style={{ width: `${(summary[s.key] / total) * 100}%` }}
                  title={`${s.label}: ${summary[s.key]} (${percent(summary[s.key], total)}%)`}
                />
              ))}
            </div>

            {/* Legend: colored dot + label + count, so the colors are never the only clue */}
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {SEGMENTS.map((s) => (
                <li key={s.status} className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full ${s.color}`} aria-hidden />
                  <span className="text-slate-600">{s.label}</span>
                  <span className="font-medium text-slate-900 tabular-nums">{summary[s.key]}</span>
                  <span className="text-slate-400 tabular-nums">({percent(summary[s.key], total)}%)</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  dot?: string; // color class of a small status dot next to the label
  to?: string; // makes the card a link, e.g. to the filtered products list
};

function StatCard({ label, value, hint, dot, to }: StatCardProps) {
  const content = (
    <>
      <p className="flex items-center gap-2 text-sm text-slate-500">
        {dot && <span className={`size-2.5 rounded-full ${dot}`} aria-hidden />}
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {to && <p className="mt-1 text-xs text-indigo-600 opacity-0 group-hover:opacity-100">View products →</p>}
    </>
  );
  if (!to) return <div className="card p-5">{content}</div>;
  return (
    <Link to={to} className="group card block p-5 transition-colors hover:border-indigo-300">
      {content}
    </Link>
  );
}
