'use client';

/**
 * PaginationControls — previous / page-number / next navigation + page-size selector.
 *
 * Features:
 *  - Previous button: disabled when on page 1.
 *  - Next button: disabled when on the last page.
 *  - Current page / total pages display.
 *  - Direct page-number buttons shown as a compact window around the current page.
 *  - Page-size <select> with exactly the values 10, 25, and 50 (Req 14.4).
 *  - Changing page size resets to page 1 (Req 14.5, handled inside setPageSize).
 *
 * Requirements: 14.1, 14.4, 14.5
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { UseTaskFiltersReturn } from '../hooks/useTaskFilters';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PaginationControlsProps {
  /** The full return value from useTaskFilters */
  filters: UseTaskFiltersReturn;
  /** Total number of tasks matching the current filters (before pagination) */
  total: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZES = [10, 25, 50] as const;

/** Maximum number of page-number buttons to show at once */
const MAX_PAGE_BUTTONS = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a compact window of page numbers around the active page.
 * Always includes page 1 and the last page; fills the rest from around `current`.
 */
function buildPageWindow(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= MAX_PAGE_BUTTONS) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: Array<number | 'ellipsis'> = [];
  const half = Math.floor(MAX_PAGE_BUTTONS / 2);

  let start = Math.max(2, current - half);
  let end = Math.min(total - 1, current + half);

  // Shift the window if it is near the edges
  if (current - half <= 1) {
    end = Math.min(total - 1, MAX_PAGE_BUTTONS - 1);
  }
  if (current + half >= total) {
    start = Math.max(2, total - MAX_PAGE_BUTTONS + 2);
  }

  pages.push(1);
  if (start > 2) pages.push('ellipsis');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push('ellipsis');
  pages.push(total);

  return pages;
}

// ---------------------------------------------------------------------------
// Shared class helpers
// ---------------------------------------------------------------------------

const NAV_BTN_BASE = [
  'inline-flex items-center justify-center rounded-md',
  'text-sm font-medium border',
  'transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'disabled:cursor-not-allowed disabled:opacity-40',
].join(' ');

const NAV_BTN_DEFAULT = 'border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground';
const NAV_BTN_ACTIVE  = 'border-primary bg-primary text-primary-foreground';
const NAV_BTN_ICON    = 'h-9 w-9';
const NAV_BTN_PAGE    = 'h-9 min-w-[2.25rem] px-2';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PaginationControls({ filters, total }: PaginationControlsProps) {
  const { params, setPage, setPageSize } = filters;

  const currentPage = params.page ?? 1;
  const currentPageSize = params.pageSize ?? 25;
  const totalPages = Math.max(1, Math.ceil(total / currentPageSize));

  const pageWindow = buildPageWindow(currentPage, totalPages);

  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* ── Page info ───────────────────────────────────────────────────── */}
      <p className="text-sm text-muted-foreground shrink-0">
        Page{' '}
        <span className="font-medium text-foreground">{currentPage}</span>
        {' '}of{' '}
        <span className="font-medium text-foreground">{totalPages}</span>
        {' '}·{' '}
        <span className="font-medium text-foreground">{total}</span> task
        {total !== 1 ? 's' : ''}
      </p>

      {/* ── Navigation controls ─────────────────────────────────────────── */}
      <nav aria-label="Pagination" className="flex items-center gap-1">
        {/* Previous */}
        <button
          type="button"
          onClick={() => setPage(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          className={[NAV_BTN_BASE, NAV_BTN_DEFAULT, NAV_BTN_ICON].join(' ')}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Page numbers */}
        {pageWindow.map((entry, idx) =>
          entry === 'ellipsis' ? (
            <span
              key={`ellipsis-${idx}`}
              className="flex h-9 w-6 items-center justify-center text-sm text-muted-foreground"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => setPage(entry)}
              aria-label={`Page ${entry}`}
              aria-current={entry === currentPage ? 'page' : undefined}
              className={[
                NAV_BTN_BASE,
                NAV_BTN_PAGE,
                entry === currentPage ? NAV_BTN_ACTIVE : NAV_BTN_DEFAULT,
              ].join(' ')}
            >
              {entry}
            </button>
          ),
        )}

        {/* Next */}
        <button
          type="button"
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className={[NAV_BTN_BASE, NAV_BTN_DEFAULT, NAV_BTN_ICON].join(' ')}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </nav>

      {/* ── Page-size selector ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        <label
          htmlFor="page-size-select"
          className="text-sm text-muted-foreground whitespace-nowrap"
        >
          Rows per page:
        </label>
        <select
          id="page-size-select"
          value={currentPageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className={[
            'h-9 rounded-md border border-input bg-background px-2 py-1',
            'text-sm text-foreground cursor-pointer',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          ].join(' ')}
          aria-label="Rows per page"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
