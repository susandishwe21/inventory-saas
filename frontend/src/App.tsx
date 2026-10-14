import { useCallback, useEffect, useState } from 'react';
import { ProductForm } from './components/ProductForm';
import { StockPanel } from './components/StockPanel';
import { createProduct, deleteProduct, listProducts, updateProduct } from './services/products';
import type { Product, ProductInput } from './types';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [stockProductId, setStockProductId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setProducts(await listProducts());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setStockProductId(null);
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setStockProductId(null);
    setEditing(p);
    setShowForm(true);
  }

  function closeForm() {
    setEditing(null);
    setShowForm(false);
  }

  function openStock(p: Product) {
    closeForm();
    setStockProductId(p.id);
  }

  async function handleSave(input: ProductInput) {
    if (editing) await updateProduct(editing.id, input);
    else await createProduct(input);
    closeForm();
    await load();
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Delete "${p.name}"? Its stock history will also be deleted.`)) return;
    try {
      await deleteProduct(p.id);
      if (editing?.id === p.id) closeForm();
      if (stockProductId === p.id) setStockProductId(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  // id နဲ့ list ထဲက နောက်ဆုံး data ကို ရှာတယ်
  const stockProduct = products.find((p) => p.id === stockProductId);

  if (loading) return <p>Loading…</p>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Inventory</h1>

      {!showForm && <button onClick={openAdd}>+ Add product</button>}
      {showForm && (
        <ProductForm
          key={editing?.id ?? 'new'}
          initial={editing ?? undefined}
          onSave={handleSave}
          onCancel={closeForm}
        />
      )}

      {stockProduct && (
        <StockPanel
          key={stockProduct.id}
          product={stockProduct}
          onChanged={load}
          onClose={() => setStockProductId(null)}
        />
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>SKU</th>
            <th>Price</th>
            <th>Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.sku}</td>
              <td>{p.price.toFixed(2)}</td>
              <td>
                {p.stock_quantity === 0
                  ? <span style={{ color: 'red', fontWeight: 600 }}>Sold out</span>
                  : p.stock_quantity}
              </td>
              <td>
                <button onClick={() => openStock(p)}>Stock</button>{' '}
                <button onClick={() => openEdit(p)}>Edit</button>{' '}
                <button onClick={() => handleDelete(p)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}