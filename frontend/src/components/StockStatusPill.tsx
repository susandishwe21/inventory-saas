import type { StockStatus } from '../types';

const STYLES: Record<StockStatus, { label: string; className: string }> = {
  in: { label: 'In stock', className: 'bg-green-50 text-green-700 ring-green-600/20' },
  low: { label: 'Low stock', className: 'bg-amber-50 text-amber-800 ring-amber-600/20' },
  out: { label: 'Out of stock', className: 'bg-red-50 text-red-700 ring-red-600/20' },
};

// Colored pill for a product's stock status (the status itself is calculated by the database)
export function StockStatusPill({ status }: { status: StockStatus }) {
  const { label, className } = STYLES[status];
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${className}`}>
      {label}
    </span>
  );
}
