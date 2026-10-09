'use client';

/**
 * OverdueLabel — text + icon indicator for overdue tasks.
 *
 * A task is considered overdue when:
 *  - dueDate is not null, AND
 *  - the due date (as a calendar date) is strictly before today's date, AND
 *  - status is not 'completed'.
 *
 * The label uses both an icon AND visible text, satisfying the requirement that
 * the indicator must NOT rely on color alone (Req 12.3).
 *
 * Requirements: 12.3
 */

import { AlertCircle } from 'lucide-react';
import type { Task } from '../../../lib/api/tasks';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OverdueLabelProps {
  /** Minimum task fields required to determine overdue status */
  task: Pick<Task, 'dueDate' | 'status'>;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Returns true when the task's due date is strictly before today's local date
 * AND the task is not completed.
 */
export function isOverdue(dueDate: string | null, status: Task['status']): boolean {
  if (!dueDate || status === 'completed') return false;

  // Parse as local midnight to avoid UTC offset shifting the displayed date
  const due = new Date(`${dueDate}T00:00:00`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return due < today;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OverdueLabel({ task }: OverdueLabelProps) {
  if (!isOverdue(task.dueDate, task.status)) return null;

  return (
    <span
      className={[
        'inline-flex items-center gap-1 text-xs font-medium',
        'text-red-600 dark:text-red-400',
      ].join(' ')}
      aria-label="Overdue"
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      Overdue
    </span>
  );
}
