import { useCallback, useEffect, useState } from 'react';
import { ProductForm } from './components/ProductForm';           
import { createProduct, listProducts } from './services/products'; 
import type { Product, ProductInput } from './types';           

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);              

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

  // Handle saving a new product
  async function handleSave(input: ProductInput) {
    await createProduct(input);
    setShowForm(false);
    await load();
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Inventory</h1>

      {/* Add a new product */}
      {!showForm && <button onClick={() => setShowForm(true)}>+ Add product</button>}
      {showForm && <ProductForm onSave={handleSave} onCancel={() => setShowForm(false)} />}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table>
        {/* ... thead, tbody — အရင်အတိုင်း မပြောင်း ... */}
      </table>
    </div>
  );
}