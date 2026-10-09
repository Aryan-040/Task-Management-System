import { z } from 'zod';

/**
 * Validates that a YYYY-MM-DD string corresponds to a real calendar date.
 * Rejects non-existent dates like Feb 30 or April 31.
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

export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or fewer'),

  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(1000, 'Description must be 1000 characters or fewer'),

  status: z.enum(['pending', 'in_progress', 'completed'], {
    errorMap: () => ({ message: 'Status must be pending, in_progress, or completed' }),
  }),

  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Priority must be low, medium, or high' }),
  }),

  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')
    .refine(isValidCalendarDate, 'Invalid calendar date (e.g. Feb 30 is not valid)')
    .nullable()
    .optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
