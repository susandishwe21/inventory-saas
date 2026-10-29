import { useEffect, useState, type ChangeEvent, type SubmitEvent } from 'react';
import { Link } from 'react-router';
import { resizeImage } from '../lib/resizeImage';
import { listCategories } from '../services/categories';
import { productImageUrl } from '../services/productImages';
import type { Category, ImageChange, Product, ProductInput } from '../types';
import { ProductImage } from './ProductImage';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_ORIGINAL_BYTES = 15 * 1024 * 1024; // photos up to 15 MB are accepted, then resized
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // same limit as the storage bucket

// Define the props for the ProductForm component
type Props = {
  initial?: Product; // For Update product
  onSave: (input: ProductInput, image: ImageChange) => Promise<void>;
  onCancel: () => void;
};

export function ProductForm({ initial, onSave, onCancel }: Props) {
  const isEdit = initial !== undefined;

  // Start with the product's current values when editing (the parent remounts this form per product via `key`)
  const [name, setName] = useState(initial?.name ?? '');
  const [sku, setSku] = useState(initial?.sku ?? '');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [costPrice, setCostPrice] = useState(initial ? String(initial.cost_price) : '');
  const [lowStockLevel, setLowStockLevel] = useState(initial ? String(initial.low_stock_level) : '10');
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageChange, setImageChange] = useState<ImageChange>({ type: 'keep' });
  const [localPreview, setLocalPreview] = useState<string | null>(null); // blob: URL of a newly picked image
  const [processingImage, setProcessingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch((e: Error) => setError(e.message));
  }, []);

  // Free the memory of the old preview when it is replaced or the form closes
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  // What the image box shows: new picked image, the saved image, or nothing
  const previewSrc =
    imageChange.type === 'set' ? localPreview
    : imageChange.type === 'remove' ? null
    : initial?.image_path ? productImageUrl(initial.image_path)
    : null;

  async function handlePickImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // so picking the same file again still triggers onChange
    if (!file) return;
    setError(null);

    if (!IMAGE_TYPES.includes(file.type)) return setError('Please choose a JPG, PNG or WebP image.');
    if (file.size > MAX_ORIGINAL_BYTES) return setError('This image is too large (max 15 MB).');

    setProcessingImage(true);
    try {
      const resized = await resizeImage(file);
      if (resized.size > MAX_UPLOAD_BYTES) return setError('This image is still larger than 2 MB after resizing.');
      setImageChange({ type: 'set', image: resized });
      setLocalPreview(URL.createObjectURL(resized));
    } catch {
      setError('Could not read this image. Try another file.');
    } finally {
      setProcessingImage(false);
    }
  }

  function handleRemoveImage() {
    setImageChange(initial?.image_path ? { type: 'remove' } : { type: 'keep' });
    setLocalPreview(null);
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault(); // Prevent the default form submission behavior
    setError(null);

    const priceNum = Number(price);
    const costNum = Number(costPrice); // empty = 0
    const levelNum = Number(lowStockLevel);
    if (!name.trim() || !sku.trim()) return setError('Name and SKU are required.');
    if (Number.isNaN(priceNum) || priceNum < 0) return setError('Selling price must be 0 or more.');
    if (Number.isNaN(costNum) || costNum < 0) return setError('Cost price must be 0 or more.');
    if (lowStockLevel.trim() === '' || !Number.isInteger(levelNum) || levelNum < 0) {
      return setError('Low-stock level must be a whole number, 0 or more.');
    }

    const input: ProductInput = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      price: priceNum,
      cost_price: costNum,
      low_stock_level: levelNum,
      category_id: categoryId || null, // '' = "No category"
    };

    setSaving(true);
    try {
      await onSave(input, imageChange);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  //value ={name} onChange  for controll input fields
  return (
    <form onSubmit={handleSubmit} className="card p-6">
      <h2 className="text-base font-semibold">{isEdit ? 'Edit product' : 'New product'}</h2>
      <p className="mt-1 text-sm text-slate-500">
        {isEdit ? 'Update the details of this product.' : 'Add an item to your inventory.'}
      </p>

      {/* Product image */}
      <div className="mt-5 flex items-center gap-4">
        <ProductImage src={previewSrc} alt={name || 'Product image'} className="size-24" />
        <div>
          <span className="label">Image</span>
          <div className="flex flex-wrap gap-2">
            <label className="btn btn-secondary cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-600">
              {processingImage ? 'Processing…' : previewSrc ? 'Change image' : 'Upload image'}
              <input type="file" accept={IMAGE_TYPES.join(',')} className="sr-only" onChange={handlePickImage} disabled={processingImage} />
            </label>
            {previewSrc && (
              <button className="btn btn-ghost" type="button" onClick={handleRemoveImage}>Remove</button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">JPG, PNG or WebP. Large photos are resized automatically.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Name</span>
          <input className="input" placeholder="e.g. Coca-Cola 330ml" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          <span className="label">SKU</span>
          <input className="input font-mono uppercase" placeholder="e.g. BEV-002" value={sku} onChange={(e) => setSku(e.target.value)} />
        </label>
        <label>
          <span className="label">Category</span>
          <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {categories.length === 0 && (
            <span className="mt-1 block text-xs text-slate-500">
              No categories yet. <Link to="/categories" className="font-medium text-indigo-600 hover:text-indigo-500">Create one</Link>
            </span>
          )}
        </label>
        <label>
          <span className="label">Selling price</span>
          <input className="input" placeholder="0.00" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label>
          <span className="label">Cost price</span>
          <input className="input" placeholder="0.00" type="number" step="0.01" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
          <span className="mt-1 block text-xs text-slate-500">What you paid for one item. Used for stock value.</span>
        </label>
        <label>
          <span className="label">Low-stock level</span>
          <input className="input" type="number" step="1" min="0" value={lowStockLevel} onChange={(e) => setLowStockLevel(e.target.value)} />
          <span className="mt-1 block text-xs text-slate-500">Shown as "Low stock" when stock is at or below this number.</span>
        </label>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {isEdit ? 'To change stock' : 'New products start with 0 in stock. To add opening stock after saving'}, use the{' '}
        <span className="font-medium">Stock</span> button in the table.
      </p>

      {error && <p className="alert-error mt-4">{error}</p>}

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
        <button className="btn btn-secondary" type="button" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" type="submit" disabled={saving || processingImage}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save product'}
        </button>
      </div>
    </form>
  );
}
