import { useEffect, useState, type SubmitEvent } from 'react';
import { Link } from 'react-router';
import { createCategory, deleteCategory, listCategories, renameCategory } from '../services/categories';
import { countProducts, UNCATEGORIZED } from '../services/products';
import { useRole } from '../shop/ShopContext';
import type { CategoryWithCount } from '../types';

// Categories + how many products have no category, loaded together
async function loadAll() {
  const [categories, uncategorized] = await Promise.all([listCategories(), countProducts(UNCATEGORIZED)]);
  return { categories, uncategorized };
}

function productCount(n: number) {
  return n === 0 ? 'No products' : `${n} ${n === 1 ? 'product' : 'products'}`;
}

export function CategoriesPage() {
  const { isOwner } = useRole(); // only owners add / rename / delete
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [uncategorized, setUncategorized] = useState(0); // products without a category
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // which row is being renamed

  useEffect(() => {
    loadAll()
      .then((result) => {
        setCategories(result.categories);
        setUncategorized(result.uncategorized);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Reload after add / rename / delete
  async function load() {
    try {
      const result = await loadAll();
      setError(null);
      setCategories(result.categories);
      setUncategorized(result.uncategorized);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function openAdd() {
    setEditingId(null);
    setAdding(true);
  }

  async function handleAdd(name: string) {
    await createCategory(name);
    setAdding(false);
    await load();
  }

  async function handleRename(id: string, name: string) {
    await renameCategory(id, name);
    setEditingId(null);
    await load();
  }

  async function handleDelete(c: CategoryWithCount) {
    const message = c.product_count > 0
      ? `Delete "${c.name}"? Its ${c.product_count} ${c.product_count === 1 ? 'product' : 'products'} will become uncategorized (they are not deleted).`
      : `Delete "${c.name}"?`;
    if (!confirm(message)) return;
    try {
      await deleteCategory(c.id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (loading) {
    return <p className="py-24 text-center text-sm text-slate-500">Loading categories…</p>;
  }

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">
            Group your products, e.g. Beverages or Snacks. {categories.length} {categories.length === 1 ? 'category' : 'categories'}.
          </p>
        </div>
        {isOwner && !adding && (
          <button className="btn btn-primary" onClick={openAdd}>
            <span aria-hidden>+</span> Add category
          </button>
        )}
      </header>

      {error && <p className="alert-error mb-6">{error}</p>}

      <div className="card overflow-hidden">
        <div className="flex justify-between bg-slate-50 px-4 py-3 text-xs font-medium tracking-wide text-slate-500 uppercase">
          <span>Name</span>
          <span className="sr-only">Actions</span>
        </div>

        <ul className="divide-y divide-slate-100 border-t border-slate-200">
          {adding && (
            <li className="bg-indigo-50/40 px-4 py-3">
              <CategoryNameForm submitLabel="Add" onSubmit={handleAdd} onCancel={() => setAdding(false)} />
            </li>
          )}

          {categories.length === 0 && !adding && (
            <li className="px-4 py-12 text-center text-sm text-slate-500">
              {isOwner
                ? <>No categories yet. Click <span className="font-medium text-slate-700">Add category</span> to create your first one.</>
                : 'No categories yet. The shop owner adds categories.'}
            </li>
          )}

          {categories.map((c) =>
            editingId === c.id ? (
              <li key={c.id} className="bg-indigo-50/40 px-4 py-3">
                <CategoryNameForm
                  initialName={c.name}
                  submitLabel="Save"
                  onSubmit={(name) => handleRename(c.id, name)}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li key={c.id} className="flex items-center justify-between gap-4 px-4 py-2 hover:bg-slate-50">
                <Link to={`/products?category=${c.id}`} className="group min-w-0 flex-1 py-1">
                  <p className="truncate text-sm font-medium text-slate-900 group-hover:text-indigo-600">{c.name}</p>
                  <p className="text-xs text-slate-500">
                    {productCount(c.product_count)}
                    {c.product_count > 0 && <span className="text-indigo-600 opacity-0 group-hover:opacity-100"> · View products →</span>}
                  </p>
                </Link>
                {isOwner && (
                  <div className="shrink-0 whitespace-nowrap">
                    <button className="btn btn-ghost" onClick={() => { setAdding(false); setEditingId(c.id); }}>Rename</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(c)}>Delete</button>
                  </div>
                )}
              </li>
            ),
          )}

          {/* Products without a category, so the counts add up to the product total */}
          {uncategorized > 0 && (
            <li className="flex items-center px-4 py-2 hover:bg-slate-50">
              <Link to={`/products?category=${UNCATEGORIZED}`} className="group min-w-0 flex-1 py-1">
                <p className="text-sm font-medium text-slate-500 italic group-hover:text-indigo-600">Uncategorized</p>
                <p className="text-xs text-slate-500">
                  {productCount(uncategorized)}
                  <span className="text-indigo-600 opacity-0 group-hover:opacity-100"> · View products →</span>
                </p>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}

type FormProps = {
  initialName?: string;
  submitLabel: string;
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
};

// Inline form used for both "Add" and "Rename"
function CategoryNameForm({ initialName = '', submitLabel, onSubmit, onCancel }: FormProps) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Name is required.');

    setSaving(true);
    try {
      await onSubmit(name.trim());
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs flex-1"
          placeholder="Category name, e.g. Beverages"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onCancel()}
          autoFocus
        />
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : submitLabel}</button>
        <button className="btn btn-secondary" type="button" onClick={onCancel}>Cancel</button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
