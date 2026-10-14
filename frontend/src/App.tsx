import { useCallback, useEffect, useState } from 'react';
import { ProductForm } from './components/ProductForm';
import { createProduct, deleteProduct, listProducts, updateProduct } from './services/products';
import type { Product, ProductInput } from './types';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  // Load products from the database
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

  function openAdd(){
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setShowForm(true);
  }

  function closeForm() {
    setEditing(null);
    setShowForm(false);
  }

  // Handle saving a new product
  async function handleSave(input: ProductInput) {
    await createProduct(input);
    setShowForm(false);
    await load();
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await deleteProduct(p.id);
      if (editing?.id === p.id) closeForm();
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }


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
              <td>{p.stock_quantity}</td>
              <td>
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