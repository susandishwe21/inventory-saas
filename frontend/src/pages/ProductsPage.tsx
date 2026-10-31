import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { Pagination } from '../components/Pagination';
import { downloadCsv, toCsv } from '../lib/csv';
import { SearchBox } from '../components/SearchBox';
import { ProductForm } from '../components/ProductForm';
import { StockPanel } from '../components/StockPanel';
import { StockStatusPill } from '../components/StockStatusPill';
import { listCategories } from '../services/categories';
import { listSuppliers } from '../services/suppliers';
import { ProductImage } from '../components/ProductImage';
import { productImageUrl } from '../services/productImages';
import { useRole } from '../shop/ShopContext';
import { createProduct, deleteProduct, listAllProducts, listProducts, NO_SUPPLIER, setProductImage, UNCATEGORIZED, updateProduct } from '../services/products';
import type { Category, ImageChange, Product, ProductInput, StockStatus, Supplier } from '../types';

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: 'in', label: 'In stock' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
];

// "?status=low" → 'low'. Missing or unknown ("?status=abc") → null (all)
function parseStatus(raw: string | null): StockStatus | null {
  return STATUS_OPTIONS.some((o) => o.value === raw) ? (raw as StockStatus) : null;
}

// "?page=2" → 2. Missing or invalid ("abc", "0", "-1") → 1
function parsePage(raw: string | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOwner } = useRole(); // staff only record stock; owners also add / edit / delete
  const page = parsePage(searchParams.get('page'));
  const category = searchParams.get('category'); // null = all, 'none' = uncategorized, otherwise a category id
  const supplier = searchParams.get('supplier'); // null = all, 'none' = no supplier, otherwise a supplier id
  const search = searchParams.get('q') ?? ''; // part of the name or SKU
  const status = parseStatus(searchParams.get('status'));
  const query = `${page}|${category}|${supplier}|${search}|${status}`; // what is being shown: page + filters

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null); // which page + filter `products` belongs to
  const [loading, setLoading] = useState(true); // first load only
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [stockProductId, setStockProductId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Load the page whenever ?page= or a filter (?category=, ?supplier=, ?q=, ?status=) changes.
  // State is only set inside .then/.catch.
  useEffect(() => {
    let ignore = false; // if the user clicks Next quickly, ignore the older, slower response
    listProducts(page, PAGE_SIZE, { category, supplier, search, status })
      .then((result) => {
        if (ignore) return;
        setError(null);
        setProducts(result.products);
        setTotal(result.total);
        setLoadedQuery(`${page}|${category}|${supplier}|${search}|${status}`);
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
  }, [page, category, supplier, search, status]);

  // Categories and suppliers for the filter dropdowns
  useEffect(() => {
    Promise.all([listCategories(), listSuppliers()])
      .then(([categoryList, supplierList]) => {
        setCategories(categoryList);
        setSuppliers(supplierList);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  // Reload the current page after add / edit / delete / stock movement
  async function load() {
    try {
      const result = await listProducts(page, PAGE_SIZE, { category, supplier, search, status });
      setError(null);
      setProducts(result.products);
      setTotal(result.total);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  // Change one URL param and keep the others (e.g. keep ?category= when changing page)
  // replace = true: don't add a browser history entry (used while typing a search)
  function updateParams(change: (params: URLSearchParams) => void, replace = false) {
    closeForm();
    setStockProductId(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      change(next);
      return next;
    }, { replace });
  }

  function goToPage(p: number) {
    updateParams((params) => (p === 1 ? params.delete('page') : params.set('page', String(p))));
  }

  // '' = all (removes the param from the URL)
  function changeFilter(name: 'category' | 'supplier' | 'status', value: string) {
    updateParams((params) => {
      params.delete('page'); // new filter → back to page 1
      if (value) params.set(name, value);
      else params.delete(name);
    });
  }

  function changeSearch(text: string) {
    if (text === search) return; // e.g. only a space was added
    updateParams((params) => {
      params.delete('page'); // new search → back to page 1
      if (text) params.set('q', text);
      else params.delete('q');
    }, true);
  }

  function clearFilters() {
    updateParams((params) => {
      params.delete('page');
      params.delete('category');
      params.delete('supplier');
      params.delete('status');
      params.delete('q');
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

  // Download every product that matches the current filters (not just this page) as a CSV file
  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      const all = await listAllProducts({ category, supplier, search, status });
      const csv = toCsv([
        ['Name', 'SKU', 'Category', 'Supplier', 'Cost price', 'Selling price', 'Stock', 'Low-stock level', 'Status'],
        ...all.map((p) => [
          p.name,
          p.sku,
          p.category?.name,
          p.supplier?.name,
          p.cost_price.toFixed(2),
          p.price.toFixed(2),
          p.stock_quantity,
          p.low_stock_level,
          STATUS_OPTIONS.find((o) => o.value === p.status)?.label,
        ]),
      ]);
      downloadCsv(`products-${new Date().toLocaleDateString('en-CA')}.csv`, csv); // en-CA date = 2026-10-30
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(false);
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

  // Names of the selected filters, for the header ("6 products in Beverages from Golden Beverage Co.")
  const categoryName = category === UNCATEGORIZED
    ? 'Uncategorized'
    : categories.find((c) => c.id === category)?.name;
  const supplierName = suppliers.find((s) => s.id === supplier)?.name;
  const filtered = Boolean(category || supplier || search || status);
  const statusLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label;

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} {total === 1 ? 'product' : 'products'}{' '}
            {category && <>in <span className="font-medium text-slate-700">{categoryName ?? 'this category'}</span> </>}
            {supplier === NO_SUPPLIER && 'with no supplier'}
            {supplier && supplier !== NO_SUPPLIER && <>from <span className="font-medium text-slate-700">{supplierName ?? 'this supplier'}</span></>}
            {search && <> matching <span className="font-medium text-slate-700">"{search}"</span></>}
            {statusLabel && <> · <span className="font-medium text-slate-700">{statusLabel}</span></>}
            {!filtered && 'in your inventory'}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={handleExport} disabled={exporting || total === 0}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          {isOwner && !showForm && (
            <button className="btn btn-primary" onClick={openAdd}>
              <span aria-hidden>+</span> Add product
            </button>
          )}
        </div>
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
            <SearchBox value={search} onSearch={changeSearch} placeholder="Search name or SKU" />
            <label className="flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-700">Category</span>
              <select className="input w-auto py-1.5" value={category ?? ''} onChange={(e) => changeFilter('category', e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value={UNCATEGORIZED}>Uncategorized</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-700">Supplier</span>
              <select className="input w-auto py-1.5" value={supplier ?? ''} onChange={(e) => changeFilter('supplier', e.target.value)}>
                <option value="">All suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                <option value={NO_SUPPLIER}>No supplier</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-700">Status</span>
              <select className="input w-auto py-1.5" value={status ?? ''} onChange={(e) => changeFilter('status', e.target.value)}>
                <option value="">All</option>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
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
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {total === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      {filtered ? (
                        <>
                          {search && !category && !supplier && !status ? <>No products match "{search}".</> : 'No products match these filters.'}{' '}
                          <button className="font-medium text-indigo-600 hover:text-indigo-500" onClick={clearFilters}>
                            Show all products
                          </button>
                        </>
                      ) : (
                        isOwner
                          ? <>No products yet. Click <span className="font-medium text-slate-700">Add product</span> to create your first one.</>
                          : <>No products yet. The shop owner adds products.</>
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
                    <td className="px-4 py-3 text-slate-600">
                      {p.supplier ? p.supplier.name : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.stock_quantity}</td>
                    <td className="px-4 py-3">
                      <StockStatusPill status={p.status} />
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button className="btn btn-ghost" onClick={() => openStock(p)}>Stock</button>
                      {isOwner && (
                        <>
                          <button className="btn btn-ghost" onClick={() => openEdit(p)}>Edit</button>
                          <button className="btn btn-danger" onClick={() => handleDelete(p)}>Delete</button>
                        </>
                      )}
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
