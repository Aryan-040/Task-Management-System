'use client';

/**
 * URL state hook for task filters.
 * Reads/writes all filter, sort, and pagination state from/to the URL query
 * string using Next.js App Router primitives.
 *
 * Requirements: 13.1, 13.4, 13.8, 13.9, 14.2, 14.3, 14.5, 14.6
 */

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type {
  ListTasksParams,
  TaskStatus,
  TaskPriority,
} from '../../../lib/api/tasks';

// ---------------------------------------------------------------------------
// Constants / defaults
// ---------------------------------------------------------------------------

const DEFAULT_SORT_BY = 'createdAt' as const;
const DEFAULT_SORT_ORDER = 'desc' as const;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;

type SortField = 'createdAt' | 'dueDate' | 'priority' | 'title';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface UseTaskFiltersReturn {
  /**
   * Serialised params object ready for use as a TanStack Query key and API
   * call argument. 'all' status/priority values are omitted (mapped to
   * `undefined`) so the API never receives them.
   */
  params: ListTasksParams;

  /** Updates the search term and resets page to 1. */
  setSearch(v: string): void;
  /** Updates the status filter and resets page to 1. */
  setStatus(v: TaskStatus | 'all'): void;
  /** Updates the priority filter and resets page to 1. */
  setPriority(v: TaskPriority | 'all'): void;
  /**
   * Updates the sort field and resets page to 1.
   * If the new field is the same as the current field, toggles sort order
   * (asc → desc or desc → asc). If a different field is chosen, the sort
   * order resets to 'desc'.
   * Requirements: 13.8
   */
  setSortBy(v: SortField): void;
  /** Updates the sort order without resetting the page. */
  setSortOrder(v: 'asc' | 'desc'): void;
  /** Navigates to a specific page number. */
  setPage(v: number): void;
  /** Updates the page size and resets page to 1. Requirements: 14.5 */
  setPageSize(v: number): void;
  /**
   * Resets all params to their defaults: empty search, 'all' status,
   * 'all' priority, 'createdAt' sort, 'desc' order, page 1, pageSize 25.
   * Requirements: 13.4
   */
  clearAll(): void;
  /**
   * True when any non-default filter is active:
   *   - search is non-empty, OR
   *   - status !== 'all', OR
   *   - priority !== 'all'
   * Requirements: 13.3
   */
  isFiltered: boolean;
}

// ---------------------------------------------------------------------------
// URL param parsers
// ---------------------------------------------------------------------------

function parseStatus(v: string | null): TaskStatus | 'all' {
  if (v === 'pending' || v === 'in_progress' || v === 'completed') return v;
  return 'all';
}

function parsePriority(v: string | null): TaskPriority | 'all' {
  if (v === 'low' || v === 'medium' || v === 'high') return v;
  return 'all';
}

function parseSortBy(v: string | null): SortField {
  if (
    v === 'createdAt' ||
    v === 'dueDate' ||
    v === 'priority' ||
    v === 'title'
  ) {
    return v;
  }
  return DEFAULT_SORT_BY;
}

function parseSortOrder(v: string | null): 'asc' | 'desc' {
  if (v === 'asc' || v === 'desc') return v;
  return DEFAULT_SORT_ORDER;
}

/**
 * Parses page from a URL string value.
 * Falls back to 1 for non-positive-integer values.
 * Requirements: 14.6
 */
function parsePage(v: string | null): number {
  const n = parseInt(v ?? '', 10);
  return Number.isInteger(n) && n >= 1 ? n : DEFAULT_PAGE;
}

function parsePageSize(v: string | null): number {
  const n = parseInt(v ?? '', 10);
  return Number.isInteger(n) && n >= 1 ? n : DEFAULT_PAGE_SIZE;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTaskFilters(): UseTaskFiltersReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ---- Read current values from URL ---------------------------------------

  const search = searchParams.get('search') ?? '';
  const status = parseStatus(searchParams.get('status'));
  const priority = parsePriority(searchParams.get('priority'));
  const sortBy = parseSortBy(searchParams.get('sortBy'));
  const sortOrder = parseSortOrder(searchParams.get('sortOrder'));
  const page = parsePage(searchParams.get('page'));
  const pageSize = parsePageSize(searchParams.get('pageSize'));

  // ---- Derived state -------------------------------------------------------

  const isFiltered = search !== '' || status !== 'all' || priority !== 'all';

  // ---- Params object (omits 'all' values for status/priority) -------------

  const params: ListTasksParams = {
    ...(search ? { search } : {}),
    ...(status !== 'all' ? { status } : {}),
    ...(priority !== 'all' ? { priority } : {}),
    sortBy,
    sortOrder,
    page,
    pageSize,
  };

  // ---- URL update helper --------------------------------------------------

  /**
   * Creates a mutable copy of the current search params, applies the
   * `updater` function, then calls `router.replace` so the change is
   * reflected in the URL without adding a history entry.
   * Requirements: 14.3
   */
  const update = useCallback(
    (updater: (sp: URLSearchParams) => void) => {
      const sp = new URLSearchParams(searchParams.toString());
      updater(sp);
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  // ---- Setters ------------------------------------------------------------

  /** Requirements: 13.1, 13.9 */
  const setSearch = useCallback(
    (v: string) => {
      update((sp) => {
        if (v) {
          sp.set('search', v);
        } else {
          sp.delete('search');
        }
        // Reset pagination on filter change (Req 13.9)
        sp.set('page', '1');
      });
    },
    [update],
  );

  /** Requirements: 13.2, 13.9 */
  const setStatus = useCallback(
    (v: TaskStatus | 'all') => {
      update((sp) => {
        if (v === 'all') {
          sp.delete('status');
        } else {
          sp.set('status', v);
        }
        sp.set('page', '1');
      });
    },
    [update],
  );

  /** Requirements: 13.2, 13.9 */
  const setPriority = useCallback(
    (v: TaskPriority | 'all') => {
      update((sp) => {
        if (v === 'all') {
          sp.delete('priority');
        } else {
          sp.set('priority', v);
        }
        sp.set('page', '1');
      });
    },
    [update],
  );

  /**
   * Requirements: 13.5, 13.8, 13.9
   * Same field → toggle sort order.
   * Different field → set field, reset sort order to 'desc'.
   * Always resets page to 1.
   */
  const setSortBy = useCallback(
    (v: SortField) => {
      update((sp) => {
        const currentField = parseSortBy(sp.get('sortBy'));
        const currentOrder = parseSortOrder(sp.get('sortOrder'));

        if (v === currentField) {
          // Toggle direction
          sp.set('sortOrder', currentOrder === 'asc' ? 'desc' : 'asc');
        } else {
          sp.set('sortBy', v);
          sp.set('sortOrder', 'desc');
        }
        sp.set('page', '1');
      });
    },
    [update],
  );

  const setSortOrder = useCallback(
    (v: 'asc' | 'desc') => {
      update((sp) => {
        sp.set('sortOrder', v);
      });
    },
    [update],
  );

  /** Requirements: 14.1, 14.2 */
  const setPage = useCallback(
    (v: number) => {
      update((sp) => {
        sp.set('page', String(v));
      });
    },
    [update],
  );

  /** Requirements: 14.4, 14.5 */
  const setPageSize = useCallback(
    (v: number) => {
      update((sp) => {
        sp.set('pageSize', String(v));
        sp.set('page', '1');
      });
    },
    [update],
  );

  /**
   * Clears the URL to pathname-only, which restores all defaults.
   * Requirements: 13.4
   */
  const clearAll = useCallback(() => {
    router.replace(pathname);
  }, [router, pathname]);

  return {
    params,
    setSearch,
    setStatus,
    setPriority,
    setSortBy,
    setSortOrder,
    setPage,
    setPageSize,
    clearAll,
    isFiltered,
  };
}
