'use client';

/**
 * DueSoonLabel — text + icon indicator for tasks due within 48 hours.
 *
 * A task is considered "due soon" when:
 *  - dueDate is not null, AND
 *  - the due date is >= today's local date (not overdue), AND
 *  - the due date (taken as end-of-day 23:59:59) is within 48 hours from now, AND
 *  - status is not 'completed'.
 *
 * Using end-of-day ensures that a task due today (even if midnight has passed)
 * is still considered "due soon" for the entire calendar day.
 *
 * The label uses both an icon AND visible text, satisfying the requirement that
 * the indicator must NOT rely on color alone (Req 12.4).
 *
 * Requirements: 12.4
 */

import { Clock } from 'lucide-react';
import type { Task } from '../../../lib/api/tasks';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DueSoonLabelProps {
  /** Minimum task fields required to determine due-soon status */
  task: Pick<Task, 'dueDate' | 'status'>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Returns true when the task's due date is within the next 48 hours and the
 * task is neither completed nor already overdue.
 */
export function isDueSoon(dueDate: string | null, status: Task['status']): boolean {
  if (!dueDate || status === 'completed') return false;

  const now = new Date();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start of the due date (local midnight) — used to detect overdue
  const dueStart = new Date(`${dueDate}T00:00:00`);

  // End of the due date (local 23:59:59) — used to check 48-hour window
  const dueEnd = new Date(`${dueDate}T23:59:59`);

  // Must not be overdue: due date's start >= today midnight
  const notOverdue = dueStart >= today;

  // Due within 48 hours: end of the due date is within 48 h from now
  const withinWindow = dueEnd.getTime() - now.getTime() <= FORTY_EIGHT_HOURS_MS;

  return notOverdue && withinWindow;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DueSoonLabel({ task }: DueSoonLabelProps) {
  if (!isDueSoon(task.dueDate, task.status)) return null;

  return (
    <span
      className={[
        'inline-flex items-center gap-1 text-xs font-medium',
        'text-amber-600 dark:text-amber-400',
      ].join(' ')}
      aria-label="Due soon"
    >
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      Due soon
    </span>
  );
}
