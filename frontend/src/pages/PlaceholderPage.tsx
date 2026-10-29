type Props = {
  title: string;
  description: string;
  phase: number; // roadmap phase that builds this page
};

// Shown for pages that are in the sidebar but not built yet (see docs/ROADMAP.md)
export function PlaceholderPage({ title, description, phase }: Props) {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </header>

      <div className="grid place-items-center rounded-xl border-2 border-dashed border-slate-200 px-6 py-20 text-center">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-600/20 ring-inset">
          Coming in Phase {phase}
        </span>
        <p className="mt-3 text-sm text-slate-500">This page isn't built yet.</p>
      </div>
    </>
  );
}
