/**
 * Zod validation schemas for task-related request bodies and query parameters.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Calendar date helper
// ---------------------------------------------------------------------------

/**
 * Verifies that a YYYY-MM-DD string represents a real calendar date.
 * For example, 2025-02-30 returns false because February has no 30th day.
 */
export function isValidCalendarDate(s: string): boolean {
  const [year, month, day] = s.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

// ---------------------------------------------------------------------------
// Reusable field fragments
// ---------------------------------------------------------------------------

const titleField = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(255, 'Title must be 255 characters or fewer');

const descriptionField = z
  .string()
  .trim()
  .min(1, 'Description is required')
  .max(1000, 'Description must be 1000 characters or fewer');

const dueDateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'dueDate must be YYYY-MM-DD')
  .refine(isValidCalendarDate, 'dueDate is not a valid calendar date')
  .nullable()
  .optional();

// ---------------------------------------------------------------------------
// POST /api/tasks — all required fields with sensible defaults
// ---------------------------------------------------------------------------

export const CreateTaskSchema = z.object({
  title: titleField,
  description: descriptionField,
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: dueDateField,
});

// ---------------------------------------------------------------------------
// PUT /api/tasks/:id — all fields required (full replacement, not a patch)
// ---------------------------------------------------------------------------

export const UpdateTaskSchema = z.object({
  title: titleField,
  description: descriptionField,
  status: z.enum(['pending', 'in_progress', 'completed']),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: dueDateField,
});

// ---------------------------------------------------------------------------
// GET /api/tasks — query string parameters (all optional, coerce numeric)
// ---------------------------------------------------------------------------

export const ListTasksQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  sortBy: z.enum(['createdAt', 'dueDate', 'priority', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(10000).optional(),
});

