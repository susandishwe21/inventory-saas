import { useEffect, useState, type SubmitEvent } from 'react';
import { Link } from 'react-router';
import { createSupplier, deleteSupplier, listSuppliers, updateSupplier } from '../services/suppliers';
import { useRole } from '../shop/ShopContext';
import type { SupplierInput, SupplierWithCount } from '../types';

function productCount(n: number) {
  return n === 0 ? 'No products' : `${n} ${n === 1 ? 'product' : 'products'}`;
}

export function SuppliersPage() {
  const { isOwner } = useRole(); // only owners add / edit / delete
  const [suppliers, setSuppliers] = useState<SupplierWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SupplierWithCount | null>(null); // null + showForm = adding

  useEffect(() => {
    listSuppliers()
      .then(setSuppliers)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Reload after add / edit / delete
  async function load() {
    try {
      setSuppliers(await listSuppliers());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function openAdd() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(s: SupplierWithCount) {
    setEditing(s);
    setShowForm(true);
  }

  function closeForm() {
    setEditing(null);
    setShowForm(false);
  }

  async function handleSave(input: SupplierInput) {
    if (editing) await updateSupplier(editing.id, input);
    else await createSupplier(input);
    closeForm();
    await load();
  }

  async function handleDelete(s: SupplierWithCount) {
    const message = s.product_count > 0
      ? `Delete "${s.name}"? Its ${productCount(s.product_count).toLowerCase()} will have no supplier (they are not deleted).`
      : `Delete "${s.name}"?`;
    if (!confirm(message)) return;
    try {
      await deleteSupplier(s.id);
      if (editing?.id === s.id) closeForm();
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (loading) {
    return <p className="py-24 text-center text-sm text-slate-500">Loading suppliers…</p>;
  }

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Where your products come from. {suppliers.length} {suppliers.length === 1 ? 'supplier' : 'suppliers'}.
          </p>
        </div>
        {isOwner && !showForm && (
          <button className="btn btn-primary" onClick={openAdd}>
            <span aria-hidden>+</span> Add supplier
          </button>
        )}
      </header>

      <div className="space-y-6">
        {showForm && (
          <SupplierForm key={editing?.id ?? 'new'} initial={editing ?? undefined} onSave={handleSave} onCancel={closeForm} />
        )}

        {error && <p className="alert-error">{error}</p>}

        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                {isOwner && <th className="px-4 py-3"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    {isOwner
                      ? <>No suppliers yet. Click <span className="font-medium text-slate-700">Add supplier</span> to add your first one.</>
                      : 'No suppliers yet. The shop owner adds suppliers.'}
                  </td>
                </tr>
              )}
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    {/* Click to see this supplier's products (same as on the Categories page) */}
                    <Link to={`/products?supplier=${s.id}`} className="group block py-1">
                      <p className="font-medium text-slate-900 group-hover:text-indigo-600">{s.name}</p>
                      <p className="text-xs text-slate-500">
                        {productCount(s.product_count)}
                        {s.product_count > 0 && <span className="text-indigo-600 opacity-0 group-hover:opacity-100"> · View products →</span>}
                      </p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.contact_name || <Empty />}</td>
                  <td className="px-4 py-3">
                    {s.email ? <a href={`mailto:${s.email}`} className="text-indigo-600 hover:text-indigo-500">{s.email}</a> : <Empty />}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {s.phone ? <a href={`tel:${s.phone}`} className="text-indigo-600 hover:text-indigo-500">{s.phone}</a> : <Empty />}
                  </td>
                  {isOwner && (
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button className="btn btn-ghost" onClick={() => openEdit(s)}>Edit</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(s)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Empty() {
  return <span className="text-slate-400">—</span>;
}

type FormProps = {
  initial?: SupplierWithCount; // for editing
  onSave: (input: SupplierInput) => Promise<void>;
  onCancel: () => void;
};

// Add / edit form. Empty optional fields are saved as null.
function SupplierForm({ initial, onSave, onCancel }: FormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [contactName, setContactName] = useState(initial?.contact_name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Name is required.');

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        contact_name: contactName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
      });
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6">
      <h2 className="text-base font-semibold">{initial ? 'Edit supplier' : 'New supplier'}</h2>
      <p className="mt-1 text-sm text-slate-500">Only the name is required.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Name</span>
          <input className="input" placeholder="e.g. Golden Foods Co." value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <label>
          <span className="label">Contact person</span>
          <input className="input" placeholder="e.g. Ko Aung" value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </label>
        <label>
          <span className="label">Email</span>
          <input className="input" type="email" placeholder="sales@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          <span className="label">Phone</span>
          <input className="input" type="tel" placeholder="e.g. 09 123 456 789" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
      </div>

      {error && <p className="alert-error mt-4">{error}</p>}

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
        <button className="btn btn-secondary" type="button" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Save supplier'}
        </button>
      </div>
    </form>
  );
}
