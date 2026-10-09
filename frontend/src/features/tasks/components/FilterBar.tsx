'use client';

/**
 * FilterBar — status and priority filter selects wired to useTaskFilters setters.
 *
 * Renders two labelled <select> elements:
 *  - Status: all | pending | in_progress | completed
 *  - Priority: all | low | medium | high
 *
 * Each select calls the appropriate setter from useTaskFilters, which resets
 * pagination to page 1 automatically (Req 13.9).
 *
 * Requirements: 13.2, 13.9
 */

import type { UseTaskFiltersReturn } from '../hooks/useTaskFilters';
import type { TaskPriority, TaskStatus } from '../../../lib/api/tasks';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface FilterBarProps {
  /** The full return value from useTaskFilters — only setters and params are used */
  filters: UseTaskFiltersReturn;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: Array<{ value: TaskStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_OPTIONS: Array<{ value: TaskPriority | 'all'; label: string }> = [
  { value: 'all', label: 'All Priority' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

// ---------------------------------------------------------------------------
// Shared select class string
// ---------------------------------------------------------------------------

const SELECT_CLASSES = [
  'h-9 rounded-md border border-input bg-background px-3 py-1.5',
  'text-sm text-foreground',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'cursor-pointer',
].join(' ');

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FilterBar({ filters }: FilterBarProps) {
  const { params, setStatus, setPriority } = filters;

  // 'all' is omitted from params (maps to undefined), so reconstruct it
  const currentStatus: TaskStatus | 'all' = params.status ?? 'all';
  const currentPriority: TaskPriority | 'all' = params.priority ?? 'all';

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* ── Status filter ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="filter-status"
          className="text-xs font-medium text-muted-foreground"
        >
          Status
        </label>
        <select
          id="filter-status"
          value={currentStatus}
          onChange={(e) => setStatus(e.target.value as TaskStatus | 'all')}
          className={SELECT_CLASSES}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Priority filter ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="filter-priority"
          className="text-xs font-medium text-muted-foreground"
        >
          Priority
        </label>
        <select
          id="filter-priority"
          value={currentPriority}
          onChange={(e) => setPriority(e.target.value as TaskPriority | 'all')}
          className={SELECT_CLASSES}
          aria-label="Filter by priority"
        >
          {PRIORITY_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
