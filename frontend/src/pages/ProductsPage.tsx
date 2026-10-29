import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { Pagination } from '../components/Pagination';
import { ProductForm } from '../components/ProductForm';
import { StockPanel } from '../components/StockPanel';
import { listCategories } from '../services/categories';
import { ProductImage } from '../components/ProductImage';
import { productImageUrl } from '../services/productImages';
import { createProduct, deleteProduct, listProducts, setProductImage, UNCATEGORIZED, updateProduct } from '../services/products';
import type { Category, ImageChange, Product, ProductInput } from '../types';

const PAGE_SIZE = 10;

// "?page=2" → 2. Missing or invalid ("abc", "0", "-1") → 1
function parsePage(raw: string | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get('page'));
  const category = searchParams.get('category'); // null = all, 'none' = uncategorized, otherwise a category id
  const query = `${page}|${category}`; // what is being shown: page + filter

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null); // which page + filter `products` belongs to
  const [loading, setLoading] = useState(true); // first load only
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [stockProductId, setStockProductId] = useState<string | null>(null);

  // Load the page whenever ?page= or ?category= changes. State is only set inside .then/.catch.
  useEffect(() => {
    let ignore = false; // if the user clicks Next quickly, ignore the older, slower response
    listProducts(page, PAGE_SIZE, category)
      .then((result) => {
        if (ignore) return;
        setError(null);
        setProducts(result.products);
        setTotal(result.total);
        setLoadedQuery(`${page}|${category}`);
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
  }, [page, category]);

  // Categories for the filter dropdown
  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch((e: Error) => setError(e.message));
  }, []);

  // Reload the current page after add / edit / delete / stock movement
  async function load() {
    try {
      const result = await listProducts(page, PAGE_SIZE, category);
      setError(null);
      setProducts(result.products);
      setTotal(result.total);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  // Change one URL param and keep the others (e.g. keep ?category= when changing page)
  function updateParams(change: (params: URLSearchParams) => void) {
    closeForm();
    setStockProductId(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      change(next);
      return next;
    });
  }

  function goToPage(p: number) {
    updateParams((params) => (p === 1 ? params.delete('page') : params.set('page', String(p))));
  }

  function changeCategory(value: string) {
    updateParams((params) => {
      params.delete('page'); // new filter → back to page 1
      if (value) params.set('category', value);
      else params.delete('category');
    });
  }

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

  async function handleSave(input: ProductInput, image: ImageChange) {
    if (editing) {
      // If the image fails, the form stays open with the error and Save can simply be pressed again
      await updateProduct(editing.id, input);
      await setProductImage(editing, image);
    } else {
      const created = await createProduct(input);
      try {
        await setProductImage(created, image);
      } catch (e) {
        // The product already exists: close the form, otherwise Save again would hit "SKU already exists"
        closeForm();
        await load();
        setError(`The product was saved, but its image was not: ${(e as Error).message} Use Edit to add the image again.`);
        return;
      }
    }
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

  if (loading) {
    return <p className="py-24 text-center text-sm text-slate-500">Loading products…</p>;
  }

  // Fix the URL if the page doesn't exist: "?page=99" → last page, "?page=abc" or "?page=1" → no param.
  // This also moves you back a page after deleting the last product on the last page.
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

  const switchingPage = loadedQuery !== query; // old rows stay visible (dimmed) until the new page arrives

  // Name of the selected category, for the header ("7 products in Beverages")
  const categoryName = category === UNCATEGORIZED
    ? 'Uncategorized'
    : categories.find((c) => c.id === category)?.name;

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} {total === 1 ? 'product' : 'products'}{' '}
            {category
              ? <>in <span className="font-medium text-slate-700">{categoryName ?? 'this category'}</span></>
              : 'in your inventory'}
          </p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={openAdd}>
            <span aria-hidden>+</span> Add product
          </button>
        )}
      </header>

      <div className="space-y-6">
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

        {error && <p className="alert-error">{error}</p>}

        <div className="card overflow-hidden">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-700">Category</span>
              <select className="input w-auto py-1.5" value={category ?? ''} onChange={(e) => changeCategory(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value={UNCATEGORIZED}>Uncategorized</option>
              </select>
            </label>
            {category && (
              <button className="btn btn-ghost" onClick={() => changeCategory('')}>
                <span aria-hidden>✕</span> Clear filter
              </button>
            )}
          </div>

          <div className={`overflow-x-auto transition-opacity ${switchingPage ? 'opacity-50' : ''}`} aria-busy={switchingPage}>
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {total === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      {category ? (
                        <>
                          No products in this category.{' '}
                          <button className="font-medium text-indigo-600 hover:text-indigo-500" onClick={() => changeCategory('')}>
                            Show all products
                          </button>
                        </>
                      ) : (
                        <>No products yet. Click <span className="font-medium text-slate-700">Add product</span> to create your first one.</>
                      )}
                    </td>
                  </tr>
                )}
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <ProductImage src={p.image_path ? productImageUrl(p.image_path) : null} alt={p.name} />
                        <span className="font-medium text-slate-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">{p.sku}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.category ? p.category.name : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {p.stock_quantity === 0
                        ? <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-600/20 ring-inset">Sold out</span>
                        : p.stock_quantity}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button className="btn btn-ghost" onClick={() => openStock(p)}>Stock</button>
                      <button className="btn btn-ghost" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(p)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > 0 && (
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={goToPage} />
          )}
        </div>
      </div>
    </>
  );
}
