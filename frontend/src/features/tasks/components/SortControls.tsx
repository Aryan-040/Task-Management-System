'use client';

/**
 * SortControls — four sort-field buttons wired to useTaskFilters.
 *
 * Each button represents one of the four sort fields:
 *   Created Date | Due Date | Priority | Title
 *
 * Behaviour:
 *  - Clicking an inactive field switches to that field (sort order resets to
 *    'desc' — handled inside setSortBy).
 *  - Clicking the currently active field toggles sort order between asc/desc
 *    (also handled inside setSortBy — Req 13.8).
 *  - The active field button is visually highlighted.
 *  - An up-arrow (↑) or down-arrow (↓) is shown next to the active field label
 *    to indicate sort direction.
 *  - Pagination resets to page 1 on every click (handled inside setSortBy).
 *
 * Requirements: 13.5, 13.8, 13.9
 */

import { ArrowUp, ArrowDown } from 'lucide-react';
import type { UseTaskFiltersReturn } from '../hooks/useTaskFilters';

// ---------------------------------------------------------------------------
// Sort field definitions
// ---------------------------------------------------------------------------

type SortField = 'createdAt' | 'dueDate' | 'priority' | 'title';

const SORT_FIELDS: Array<{ field: SortField; label: string }> = [
  { field: 'createdAt', label: 'Created Date' },
  { field: 'dueDate', label: 'Due Date' },
  { field: 'priority', label: 'Priority' },
  { field: 'title', label: 'Title' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SortControlsProps {
  /** The full return value from useTaskFilters */
  filters: UseTaskFiltersReturn;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SortControls({ filters }: SortControlsProps) {
  const { params, setSortBy } = filters;

  // Defaults match useTaskFilters defaults: createdAt desc
  const currentField: SortField = (params.sortBy as SortField) ?? 'createdAt';
  const currentOrder = params.sortOrder ?? 'desc';

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Sort tasks">
      <span className="text-xs font-medium text-muted-foreground shrink-0">
        Sort:
      </span>

      {SORT_FIELDS.map(({ field, label }) => {
        const isActive = currentField === field;

        return (
          <button
            key={field}
            type="button"
            onClick={() => setSortBy(field)}
            aria-pressed={isActive}
            aria-label={
              isActive
                ? `Sort by ${label}, currently ${currentOrder === 'asc' ? 'ascending' : 'descending'}, click to toggle`
                : `Sort by ${label}`
            }
            className={[
              'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium',
              'border transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? [
                    'border-primary bg-primary text-primary-foreground',
                    'hover:bg-primary/90',
                  ].join(' ')
                : [
                    'border-input bg-background text-foreground',
                    'hover:bg-accent hover:text-accent-foreground',
                  ].join(' '),
            ].join(' ')}
          >
            {label}
            {/* Direction indicator — only shown on the active field */}
            {isActive && (
              currentOrder === 'asc' ? (
                <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              )
            )}
          </button>
        );
      })}
    </div>
  );
}
