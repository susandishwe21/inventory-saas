type Props = {
  page: number; // current page, starts at 1
  pageSize: number;
  total: number; // all rows, not just this page
  onPageChange: (page: number) => void;
};

export function Pagination({ page, pageSize, total, onPageChange }: Props) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm">
      <p className="text-slate-500">
        Showing <span className="font-medium text-slate-900 tabular-nums">{from}–{to}</span> of{' '}
        <span className="font-medium text-slate-900 tabular-nums">{total}</span> products
      </p>

      <div className="flex items-center gap-2">
        <button className="btn btn-secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <span aria-hidden>‹</span> Previous
        </button>
        <span className="px-1 text-slate-500 tabular-nums">Page {page} of {lastPage}</span>
        <button className="btn btn-secondary" disabled={page >= lastPage} onClick={() => onPageChange(page + 1)}>
          Next <span aria-hidden>›</span>
        </button>
      </div>
    </div>
  );
}
