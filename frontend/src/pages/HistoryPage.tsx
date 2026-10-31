import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router';
import { Pagination } from '../components/Pagination';
import { listHistory, type MovementRow } from '../services/movements';
import { listAllProducts } from '../services/products';
import type { MovementType, Product } from '../types';

const PAGE_SIZE = 10;

const TYPES: { value: MovementType; label: string; className: string }[] = [
  { value: 'in', label: 'In', className: 'bg-green-50 text-green-700 ring-green-600/20' },
  { value: 'out', label: 'Out', className: 'bg-red-50 text-red-700 ring-red-600/20' },
  { value: 'adjustment', label: 'Adjustment', className: 'bg-slate-50 text-slate-700 ring-slate-500/20' },
];

// "?page=2" → 2. Missing or invalid → 1
function parsePage(raw: string | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

// "?type=out" → 'out'. Missing or unknown → null (all)
function parseType(raw: string | null): MovementType | null {
  return TYPES.some((t) => t.value === raw) ? (raw as MovementType) : null;
}

// "?from=2026-10-01" → '2026-10-01'. Missing or not a real date → null
function parseDate(raw: string | null): string | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return Number.isNaN(new Date(`${raw}T00:00:00`).getTime()) ? null : raw;
}

// What the movement did to the stock: in +5, out −5, adjustment as recorded (+ or −)
function signedQuantity(m: MovementRow): string {
  const n = m.type === 'out' ? -m.quantity : m.quantity;
  return n > 0 ? `+${n}` : `−${Math.abs(n)}`;
}

export function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get('page'));
  const product = searchParams.get('product');
  const type = parseType(searchParams.get('type'));
  const from = parseDate(searchParams.get('from'));
  const to = parseDate(searchParams.get('to'));
  const query = `${page}|${product}|${type}|${from}|${to}`; // what is being shown: page + filters

  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [total, setTotal] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // first load only
  const [error, setError] = useState<string | null>(null);

  // Load whenever the page or a filter changes. State is only set inside .then/.catch.
  useEffect(() => {
    let ignore = false; // ignore an older, slower response
    listHistory(page, PAGE_SIZE, { product, type, from, to })
      .then((result) => {
        if (ignore) return;
        setError(null);
        setMovements(result.movements);
        setTotal(result.total);
        setLoadedQuery(`${page}|${product}|${type}|${from}|${to}`);
      })
      .catch((e: Error) => {
        if (!ignore) setError(e.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [page, product, type, from, to]);

  // Products for the filter dropdown
  useEffect(() => {
    listAllProducts()
      .then(setProducts)
      .catch((e: Error) => setError(e.message));
  }, []);

  // Change one URL param ('' removes it) and go back to page 1
  function changeFilter(name: 'product' | 'type' | 'from' | 'to', value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('page');
      if (value) next.set(name, value);
      else next.delete(name);
      return next;
    });
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams());
  }

  function goToPage(p: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (p === 1) next.delete('page');
      else next.set('page', String(p));
      return next;
    });
  }

  if (loading) {
    return <p className="py-24 text-center text-sm text-slate-500">Loading stock history…</p>;
  }

  // Fix the URL if the page doesn't exist ("?page=99" → last page)
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const validPage = Math.min(page, lastPage);
  const validParam = validPage === 1 ? null : String(validPage);
  if (searchParams.get('page') !== validParam) {
    const fixed = new URLSearchParams(searchParams);
    if (validParam) fixed.set('page', validParam);
    else fixed.delete('page');
    const search = fixed.toString();
    return <Navigate to={{ search: search ? `?${search}` : '' }} replace />;
  }

  const switchingPage = loadedQuery !== query; // old rows stay visible (dimmed) until the new ones arrive
  const filtered = Boolean(product || type || from || to);

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Stock history</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every stock in, stock out and adjustment in your shop, newest first. {total} {total === 1 ? 'movement' : 'movements'}
          {filtered && ' match the filters'}.
        </p>
      </header>

      {error && <p className="alert-error mb-6">{error}</p>}

      <div className="card overflow-hidden">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium text-slate-700">Product</span>
            <select className="input w-auto max-w-56 py-1.5" value={product ?? ''} onChange={(e) => changeFilter('product', e.target.value)}>
              <option value="">All products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium text-slate-700">Type</span>
            <select className="input w-auto py-1.5" value={type ?? ''} onChange={(e) => changeFilter('type', e.target.value)}>
              <option value="">All</option>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium text-slate-700">From</span>
            <input type="date" className="input w-auto py-1.5" value={from ?? ''} max={to ?? undefined} onChange={(e) => changeFilter('from', e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium text-slate-700">To</span>
            <input type="date" className="input w-auto py-1.5" value={to ?? ''} min={from ?? undefined} onChange={(e) => changeFilter('to', e.target.value)} />
          </label>
          {filtered && (
            <button className="btn btn-ghost" onClick={clearFilters}>
              <span aria-hidden>✕</span> Clear filters
            </button>
          )}
        </div>

        <div className={`overflow-x-auto transition-opacity ${switchingPage ? 'opacity-50' : ''}`} aria-busy={switchingPage}>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {total === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    {filtered ? (
                      <>
                        No movements match these filters.{' '}
                        <button className="font-medium text-indigo-600 hover:text-indigo-500" onClick={clearFilters}>
                          Show all movements
                        </button>
                      </>
                    ) : (
                      <>No stock movements yet. Use the <span className="font-medium text-slate-700">Stock</span> button on the Products page.</>
                    )}
                  </td>
                </tr>
              )}
              {movements.map((m) => {
                const typeInfo = TYPES.find((t) => t.value === m.type);
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {new Date(m.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      {m.product ? (
                        <Link to={`/products?q=${encodeURIComponent(m.product.sku)}`} className="group">
                          <span className="font-medium text-slate-900 group-hover:text-indigo-600">{m.product.name}</span>
                          <span className="ml-1.5 font-mono text-xs text-slate-500">{m.product.sku}</span>
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${typeInfo?.className ?? ''}`}>
                        {typeInfo?.label ?? m.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{signedQuantity(m)}</td>
                    <td className="px-4 py-3 text-slate-600">{m.note || <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-3 text-slate-600">{m.created_by_email || <span className="text-slate-400">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={goToPage} itemLabel="movements" />
        )}
      </div>
    </>
  );
}
