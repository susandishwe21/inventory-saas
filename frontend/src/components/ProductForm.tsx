import { useState, type SubmitEvent } from 'react';
import type { ProductInput } from '../types';

// Define the props for the ProductForm component
type Props = {
  onSave: (input: ProductInput) => Promise<void>;
  onCancel: () => void;
};

export function ProductForm({ onSave, onCancel }: Props) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault(); // Prevent the default form submission behavior
    setError(null);

    const priceNum = Number(price);
    if (!name.trim() || !sku.trim()) return setError('Name and SKU are required.');
    if (Number.isNaN(priceNum) || priceNum < 0) return setError('Price must be 0 or more.');

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        price: priceNum,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  //value ={name} onChange  for controll input fields
  return (
    <form onSubmit={handleSubmit} style={{ margin: '16px 0', display: 'grid', gap: 8, maxWidth: 320 }}>
      <h2>New product</h2>
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="SKU (e.g. BEV-002)" value={sku} onChange={(e) => setSku(e.target.value)} />
      <input placeholder="Price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
      <input placeholder="Stock Quantity" type="number" step="0.01" min="0" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} />
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}