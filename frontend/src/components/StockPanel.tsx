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
    <div style={{ margin: '16px 0', padding: 16, border: '1px solid #ccc', maxWidth: 400 }}>
      <h2>{product.name}</h2>
      <p>In stock: <strong>{product.stock_quantity}</strong></p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
        <select value={type} onChange={(e) => setType(e.target.value as MovementType)}>
          <option value="in">Stock in</option>
          <option value="out">Stock out</option>
          <option value="adjustment">Adjustment (+ or −)</option>
        </select>
        <input placeholder="Quantity" type="number" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onClose}>Close</button>
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Record'}</button>
        </div>
      </form>

      <h3>Recent movements</h3>
      {history.length === 0 && <p>No movements yet.</p>}
      <ul>
        {history.map((m) => {
          const delta = m.type === 'out' ? -m.quantity : m.quantity;
          return (
            <li key={m.id}>
              <strong>{delta > 0 ? `+${delta}` : delta}</strong> {LABELS[m.type]}
              {m.note && ` — ${m.note}`}
              <br />
              <small>{new Date(m.created_at).toLocaleString()}</small>
            </li>
          );
        })}
      </ul>
    </div>
  );
}