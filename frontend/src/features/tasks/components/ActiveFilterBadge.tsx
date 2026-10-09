'use client';

/**
 * ActiveFilterBadge — rendered only when one or more filters are active.
 *
 * Shows a "Clear filters" button with an X icon. Clicking calls clearAll(),
 * which resets all filter, sort, and search params to their defaults (Req 13.4).
 *
 * The component renders nothing when isFiltered is false.
 *
 * Requirements: 13.3, 13.4
 */

import { X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ActiveFilterBadgeProps {
  /** True when any non-default filter (search, status, or priority) is active */
  isFiltered: boolean;
  /** Resets all filters, sort, and pagination to defaults */
  clearAll: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActiveFilterBadge({ isFiltered, clearAll }: ActiveFilterBadgeProps) {
  if (!isFiltered) return null;

  return (
    <button
      type="button"
      onClick={clearAll}
      aria-label="Clear all active filters"
      className={[
        'inline-flex items-center gap-1.5 rounded-full',
        'border border-primary/30 bg-primary/10 px-3 py-1',
        'text-xs font-medium text-primary',
        'hover:bg-primary/20 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      ].join(' ')}
    >
      <X className="h-3 w-3" aria-hidden="true" />
      Clear filters
    </button>
  );
}
