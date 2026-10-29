import { useEffect, useState, type FormEvent } from 'react';
import { addStockMovement, listMovements } from '../services/products';
import type { MovementType, Product, StockMovement } from '../types';

type Props = {
  product: Product;
  onChanged: () => Promise<void>; // movement ထည့်ပြီးရင် product list ပြန် load
  onClose: () => void;
};

const LABELS: Record<MovementType, string> = {
  in: 'Stock in',
  out: 'Stock out',
  adjustment: 'Adjustment',
};

export function StockPanel({ product, onChanged, onClose }: Props) {
  const [type, setType] = useState<MovementType>('in');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listMovements(product.id)
      .then(setHistory)
      .catch((e: Error) => setError(e.message));
  }, [product.id, product.stock_quantity]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty === 0) return setError('Enter a whole number (not 0).');
    if (type !== 'adjustment' && qty < 0) return setError('Use a positive number.');

    setSaving(true);
    try {
      await addStockMovement({
        product_id: product.id,
        type,
        quantity: qty,
        note: note.trim() || undefined,
      });
      setQuantity('');
      setNote('');
      await onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card grid md:grid-cols-2 md:divide-x md:divide-slate-100">
      <section className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">{product.name}</h2>
            <p className="mt-1 font-mono text-xs text-slate-500">{product.sku}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">In stock</p>
            <p className="text-2xl font-semibold tabular-nums">{product.stock_quantity}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="label">Type</span>
              <select className="input" value={type} onChange={(e) => setType(e.target.value as MovementType)}>
                <option value="in">Stock in</option>
                <option value="out">Stock out</option>
                <option value="adjustment">Adjustment (+ or −)</option>
              </select>
            </label>
            <label>
              <span className="label">Quantity</span>
              <input className="input" placeholder="0" type="number" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </label>
          </div>
          <label className="block">
            <span className="label">Note <span className="font-normal text-slate-400">(optional)</span></span>
            <input className="input" placeholder="e.g. Delivery from supplier" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>

          {error && <p className="alert-error">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button className="btn btn-secondary" type="button" onClick={onClose}>Close</button>
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Record movement'}</button>
          </div>
        </form>
      </section>

      <section className="border-t border-slate-100 p-6 md:border-t-0">
        <h3 className="text-sm font-semibold">Recent movements</h3>
        {history.length === 0 && <p className="mt-4 text-sm text-slate-500">No movements yet.</p>}
        <ul className="mt-3 max-h-80 divide-y divide-slate-100 overflow-y-auto">
          {history.map((m) => {
            const delta = m.type === 'out' ? -m.quantity : m.quantity;
            return (
              <li key={m.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{LABELS[m.type]}</p>
                  {m.note && <p className="truncate text-slate-500">{m.note}</p>}
                  <p className="mt-0.5 text-xs text-slate-400">{new Date(m.created_at).toLocaleString()}</p>
                </div>
                <span className={`shrink-0 font-semibold tabular-nums ${delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}