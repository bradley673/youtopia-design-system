import React from "react";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  /** How many numbered buttons to show around the current page. */
  siblings?: number;
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/** Page navigation with prev/next and a windowed set of page numbers. */
export function Pagination({ page, pageCount, onChange, siblings = 1 }: PaginationProps) {
  const start = Math.max(1, page - siblings);
  const end = Math.min(pageCount, page + siblings);
  const pages = range(start, end);
  const go = (p: number) => onChange(Math.min(pageCount, Math.max(1, p)));

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="page-btn" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Previous page">‹</button>
      {start > 1 && (
        <>
          <button type="button" className="page-btn" onClick={() => go(1)}>1</button>
          {start > 2 && <span className="page-ellipsis" aria-hidden="true">…</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className="page-btn"
          aria-current={p === page ? "page" : undefined}
          data-active={p === page || undefined}
          onClick={() => go(p)}
        >
          {p}
        </button>
      ))}
      {end < pageCount && (
        <>
          {end < pageCount - 1 && <span className="page-ellipsis" aria-hidden="true">…</span>}
          <button type="button" className="page-btn" onClick={() => go(pageCount)}>{pageCount}</button>
        </>
      )}
      <button type="button" className="page-btn" onClick={() => go(page + 1)} disabled={page >= pageCount} aria-label="Next page">›</button>
    </nav>
  );
}
