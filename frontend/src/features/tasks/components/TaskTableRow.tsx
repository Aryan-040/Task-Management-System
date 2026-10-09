'use client';

/**
 * TaskTableRow — renders a single <tr> for a Task inside TaskTable.
 *
 * Per-cell details:
 *  - Title: full text, semibold.
 *  - Description: truncated to ≤100 characters; "…" appended when truncated
 *    (Req 12.1).
 *  - Status: pill badge with aria-label="Status: <value>" (Req 23.3).
 *  - Priority: pill badge with aria-label="Priority: <value>" (Req 23.4).
 *  - Due Date: "Jan 15, 2025" via Intl.DateTimeFormat; "No due date" when null
 *    (Req 12.5, 12.6); OverdueLabel / DueSoonLabel shown beneath the date
 *    (Req 12.3, 12.4).
 *  - Actions: icon-only View / Edit / Delete buttons, each with a descriptive
 *    aria-label (Req 23.5); clicking opens the corresponding dialog.
 *
 * Requirements: 12.1, 12.3, 12.4, 12.5, 12.6, 23.3, 23.4, 23.5
 */

import { useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Task } from '../../../lib/api/tasks';
import { TaskDetailView } from './TaskDetailView';
import { TaskFormDialog } from './TaskFormDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { OverdueLabel } from './OverdueLabel';
import { DueSoonLabel } from './DueSoonLabel';

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** Truncates the description to at most 100 characters, appending "…". */
function truncateDescription(text: string, maxLen = 100): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}…`;
}

/**
 * Formats a YYYY-MM-DD date string as "Jan 15, 2025".
 * Parses as local midnight to avoid UTC-offset date shifting.
 * Req 12.5
 */
function formatDueDate(dueDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${dueDate}T00:00:00`));
}

// ---------------------------------------------------------------------------
// Visual maps — status
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<Task['status'], string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const STATUS_CLASSES: Record<Task['status'], string> = {
  pending: [
    'bg-yellow-100 text-yellow-800',
    'dark:bg-yellow-900/30 dark:text-yellow-200',
  ].join(' '),
  in_progress: [
    'bg-blue-100 text-blue-800',
    'dark:bg-blue-900/30 dark:text-blue-200',
  ].join(' '),
  completed: [
    'bg-green-100 text-green-800',
    'dark:bg-green-900/30 dark:text-green-200',
  ].join(' '),
};

// ---------------------------------------------------------------------------
// Visual maps — priority
// ---------------------------------------------------------------------------

const PRIORITY_LABELS: Record<Task['priority'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const PRIORITY_CLASSES: Record<Task['priority'], string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: [
    'bg-orange-100 text-orange-800',
    'dark:bg-orange-900/30 dark:text-orange-200',
  ].join(' '),
  high: [
    'bg-red-100 text-red-800',
    'dark:bg-red-900/30 dark:text-red-200',
  ].join(' '),
};

// ---------------------------------------------------------------------------
// Shared button base class
// ---------------------------------------------------------------------------

const ICON_BTN_BASE = [
  'p-1.5 rounded-md',
  'text-muted-foreground',
  'transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
].join(' ');

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TaskTableRowProps {
  task: Task;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TaskTableRow({ task }: TaskTableRowProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <>
      <tr className="border-b border-border hover:bg-accent/30 transition-colors">
        {/* ── Title ──────────────────────────────────────────────────────── */}
        <td className="px-4 py-3 text-sm font-medium text-foreground">
          {task.title}
        </td>

        {/* ── Description — truncated to ≤100 chars (Req 12.1) ─────────── */}
        <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px]">
          {truncateDescription(task.description)}
        </td>

        {/* ── Status badge (Req 23.3) ────────────────────────────────────── */}
        <td className="px-4 py-3">
          <span
            aria-label={`Status: ${task.status}`}
            className={[
              'inline-flex items-center px-2 py-0.5 rounded-full',
              'text-xs font-medium',
              STATUS_CLASSES[task.status],
            ].join(' ')}
          >
            {STATUS_LABELS[task.status]}
          </span>
        </td>

        {/* ── Priority badge (Req 23.4) ──────────────────────────────────── */}
        <td className="px-4 py-3">
          <span
            aria-label={`Priority: ${task.priority}`}
            className={[
              'inline-flex items-center px-2 py-0.5 rounded-full',
              'text-xs font-medium',
              PRIORITY_CLASSES[task.priority],
            ].join(' ')}
          >
            {PRIORITY_LABELS[task.priority]}
          </span>
        </td>

        {/* ── Due date (Req 12.5, 12.6) with status labels (Req 12.3, 12.4) */}
        <td className="px-4 py-3 text-sm text-muted-foreground">
          <div className="flex flex-col gap-0.5">
            {task.dueDate ? (
              <span>{formatDueDate(task.dueDate)}</span>
            ) : (
              <span className="text-muted-foreground/60 italic">No due date</span>
            )}
            <OverdueLabel task={task} />
            <DueSoonLabel task={task} />
          </div>
        </td>

        {/* ── Actions — icon-only buttons (Req 23.5) ────────────────────── */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-0.5">
            {/* View */}
            <button
              type="button"
              onClick={() => setShowDetail(true)}
              aria-label={`View task ${task.title}`}
              className={`${ICON_BTN_BASE} hover:bg-accent hover:text-foreground`}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Edit */}
            <button
              type="button"
              onClick={() => setShowEdit(true)}
              aria-label={`Edit task ${task.title}`}
              className={`${ICON_BTN_BASE} hover:bg-accent hover:text-foreground`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              aria-label={`Delete task ${task.title}`}
              className={`${ICON_BTN_BASE} hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </td>
      </tr>

      {/* ── Dialogs ─────────────────────────────────────────────────────────
           Rendered outside <tr> so they're not nested inside table elements.
           Each dialog is conditionally rendered (isOpen guard prevents
           unnecessary DOM nodes). ─────────────────────────────────────── */}

      {/* Task detail view (Req 19.1–19.5) */}
      {showDetail && (
        <TaskDetailView
          isOpen={showDetail}
          task={task}
          onClose={() => setShowDetail(false)}
        />
      )}

      {/* Edit form (Req 17.1–17.5) */}
      {showEdit && (
        <TaskFormDialog
          isOpen={showEdit}
          task={task}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* Delete confirmation (Req 18.1–18.6) */}
      {showDelete && (
        <DeleteConfirmDialog
          isOpen={showDelete}
          task={task}
          onClose={() => setShowDelete(false)}
        />
      )}
    </>
  );
}
