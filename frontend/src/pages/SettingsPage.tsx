import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { createInvite, listInvites, listMembers, removeMember } from '../services/members';
import { useShop } from '../shop/ShopContext';
import type { Member, OrgInvite } from '../types';

// Codes are stored as 8 characters and shown as XXXX-XXXX so they are easier to read out
function formatCode(code: string) {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

// Members, plus invite codes when the user is the owner
async function loadAll(isOwner: boolean) {
  const [members, invites] = await Promise.all([listMembers(), isOwner ? listInvites() : Promise.resolve([])]);
  return { members, invites };
}

export function SettingsPage() {
  const { session } = useAuth();
  const { shop } = useShop();
  const isOwner = shop?.role === 'owner'; // Phase 7 adds a proper role check (hook + RLS)

  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState<string | null>(null); // the code just generated
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadAll(isOwner)
      .then((result) => {
        setMembers(result.members);
        setInvites(result.invites);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isOwner]);

  // Reload after generate / remove
  async function load() {
    try {
      const result = await loadAll(isOwner);
      setError(null);
      setMembers(result.members);
      setInvites(result.invites);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setCopied(false);
    try {
      setNewCode(await createInvite());
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy(code: string) {
    try {
      await navigator.clipboard.writeText(formatCode(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy. Select the code and copy it yourself.');
    }
  }

  async function handleRemove(m: Member) {
    if (!confirm(`Remove ${m.email} from ${shop?.organization.name}? They will lose access to this shop.`)) return;
    try {
      await removeMember(m.user_id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (loading) {
    return <p className="py-24 text-center text-sm text-slate-500">Loading settings…</p>;
  }

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">{shop?.organization.name}: team members and invite codes.</p>
      </header>

      {error && <p className="alert-error mb-6">{error}</p>}

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <h2 className="text-base font-semibold">Members</h2>
            <p className="text-sm text-slate-500">
              {members.length} {members.length === 1 ? 'person' : 'people'} in this shop.
            </p>
          </div>
          {isOwner && (
            <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
              {generating ? 'Generating…' : 'Generate invite code'}
            </button>
          )}
        </div>

        {/* The code that was just generated, ready to share */}
        {newCode && (
          <div className="mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
            <div>
              <p className="font-mono text-xl font-semibold tracking-widest text-indigo-700">{formatCode(newCode)}</p>
              <p className="text-xs text-indigo-700/80">
                Give this code to your staff member. They enter it after registering. It works once and expires in 7 days.
              </p>
            </div>
            <button className="btn btn-secondary" onClick={() => handleCopy(newCode)}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}

        <ul className="divide-y divide-slate-100 border-t border-slate-200">
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {m.email}
                  {m.user_id === session?.user.id && <span className="ml-1.5 text-xs font-normal text-slate-400">(you)</span>}
                </p>
                <p className="text-xs text-slate-500">Joined {formatDate(m.created_at)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${
                    m.role === 'owner' ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' : 'bg-slate-50 text-slate-600 ring-slate-500/20'
                  }`}
                >
                  {m.role}
                </span>
                {isOwner && m.role === 'staff' && (
                  <button className="btn btn-danger" onClick={() => handleRemove(m)}>Remove</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {isOwner && (
        <section className="card mt-6 overflow-hidden">
          <div className="px-4 py-4">
            <h2 className="text-base font-semibold">Unused invite codes</h2>
            <p className="text-sm text-slate-500">Codes that nobody has used yet and that haven't expired.</p>
          </div>
          <ul className="divide-y divide-slate-100 border-t border-slate-200">
            {invites.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-slate-500">No unused codes.</li>
            )}
            {invites.map((inv) => (
              <li key={inv.code} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="font-mono text-sm font-medium tracking-widest text-slate-900">{formatCode(inv.code)}</span>
                <span className="text-xs text-slate-500">Expires {formatDate(inv.expires_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
