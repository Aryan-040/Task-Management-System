/**
 * Unit tests for CreateTaskSchema and UpdateTaskSchema.
 * Requirements: 25.1–25.11, 7.1–7.8
 */

import { describe, it, expect } from 'vitest';
import { CreateTaskSchema, UpdateTaskSchema } from './taskSchemas';

// ---------------------------------------------------------------------------
// Helper — extract flat field errors from a ZodError
// ---------------------------------------------------------------------------
function fieldErrors(result: ReturnType<typeof CreateTaskSchema.safeParse>) {
  if (result.success) return {};
  return result.error.flatten().fieldErrors;
}

// ---------------------------------------------------------------------------
// CreateTaskSchema
// ---------------------------------------------------------------------------

describe('CreateTaskSchema', () => {
  // ---- title ----------------------------------------------------------------

  describe('title validation', () => {
    it('fails when title is absent', () => {
      const result = CreateTaskSchema.safeParse({ description: 'Valid description' });
      expect(result.success).toBe(false);
      expect(fieldErrors(result).title).toBeDefined();
    });

    it('fails when title is an empty string', () => {
      const result = CreateTaskSchema.safeParse({ title: '', description: 'Valid description' });
      expect(result.success).toBe(false);
      expect(fieldErrors(result).title).toBeDefined();
    });

    it('fails when title contains only whitespace', () => {
      const result = CreateTaskSchema.safeParse({
        title: '   \t\n',
        description: 'Valid description',
      });
      expect(result.success).toBe(false);
      expect(fieldErrors(result).title).toBeDefined();
    });
  });

  // ---- description ----------------------------------------------------------

  describe('description validation', () => {
    it('fails when description is absent', () => {
      const result = CreateTaskSchema.safeParse({ title: 'Valid title' });
      expect(result.success).toBe(false);
      expect(fieldErrors(result).description).toBeDefined();
    });

    it('fails when description is an empty string', () => {
      const result = CreateTaskSchema.safeParse({ title: 'Valid title', description: '' });
      expect(result.success).toBe(false);
      expect(fieldErrors(result).description).toBeDefined();
    });

    it('fails when description contains only whitespace', () => {
      const result = CreateTaskSchema.safeParse({
        title: 'Valid title',
        description: '   \t\n',
      });
      expect(result.success).toBe(false);
      expect(fieldErrors(result).description).toBeDefined();
    });
  });

  // ---- status enum ----------------------------------------------------------

  describe('status validation', () => {
    it('fails when status is not a valid enum value', () => {
      const result = CreateTaskSchema.safeParse({
        title: 'Valid title',
        description: 'Valid description',
        status: 'not_a_status',
      });
      expect(result.success).toBe(false);
      expect(fieldErrors(result).status).toBeDefined();
    });

    it('accepts each valid status value', () => {
      for (const status of ['pending', 'in_progress', 'completed'] as const) {
        const result = CreateTaskSchema.safeParse({
          title: 'Valid title',
          description: 'Valid description',
          status,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  // ---- priority enum --------------------------------------------------------

  describe('priority validation', () => {
    it('fails when priority is not a valid enum value', () => {
      const result = CreateTaskSchema.safeParse({
        title: 'Valid title',
        description: 'Valid description',
        priority: 'urgent',
      });
      expect(result.success).toBe(false);
      expect(fieldErrors(result).priority).toBeDefined();
    });

    it('accepts each valid priority value', () => {
      for (const priority of ['low', 'medium', 'high'] as const) {
        const result = CreateTaskSchema.safeParse({
          title: 'Valid title',
          description: 'Valid description',
          priority,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  // ---- dueDate format -------------------------------------------------------

  describe('dueDate validation', () => {
    it('fails when dueDate is not in YYYY-MM-DD format', () => {
      const result = CreateTaskSchema.safeParse({
        title: 'Valid title',
        description: 'Valid description',
        dueDate: '01/15/2025',
      });
      expect(result.success).toBe(false);
      expect(fieldErrors(result).dueDate).toBeDefined();
    });

    it('fails when dueDate is an invalid calendar date (e.g. Feb 30)', () => {
      const result = CreateTaskSchema.safeParse({
        title: 'Valid title',
        description: 'Valid description',
        dueDate: '2025-02-30',
      });
      expect(result.success).toBe(false);
      expect(fieldErrors(result).dueDate).toBeDefined();
    });

    it('fails when dueDate has an invalid month (month 13)', () => {
      const result = CreateTaskSchema.safeParse({
        title: 'Valid title',
        description: 'Valid description',
        dueDate: '2025-13-01',
      });
      expect(result.success).toBe(false);
      expect(fieldErrors(result).dueDate).toBeDefined();
    });

    it('passes when dueDate is a valid YYYY-MM-DD calendar date', () => {
      const result = CreateTaskSchema.safeParse({
        title: 'Valid title',
        description: 'Valid description',
        dueDate: '2025-12-31',
      });
      expect(result.success).toBe(true);
    });

    it('passes when dueDate is null', () => {
      const result = CreateTaskSchema.safeParse({
        title: 'Valid title',
        description: 'Valid description',
        dueDate: null,
      });
      expect(result.success).toBe(true);
    });

    it('passes when dueDate is omitted', () => {
      const result = CreateTaskSchema.safeParse({
        title: 'Valid title',
        description: 'Valid description',
      });
      expect(result.success).toBe(true);
    });
  });

  // ---- valid full payload ---------------------------------------------------

  describe('valid payload', () => {
    it('passes with a complete valid payload', () => {
      const result = CreateTaskSchema.safeParse({
        title: 'Buy groceries',
        description: 'Milk, eggs, bread',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2025-12-31',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Buy groceries');
        expect(result.data.status).toBe('in_progress');
        expect(result.data.priority).toBe('high');
      }
    });

    it('passes with only the required fields (uses defaults for status and priority)', () => {
      const result = CreateTaskSchema.safeParse({
        title: 'Minimal task',
        description: 'Minimal description',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('pending');
        expect(result.data.priority).toBe('medium');
      }
    });

    it('trims leading and trailing whitespace from title and description', () => {
      const result = CreateTaskSchema.safeParse({
        title: '  Padded title  ',
        description: '  Padded description  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Padded title');
        expect(result.data.description).toBe('Padded description');
      }
    });
  });

  // ---- multi-field errors ---------------------------------------------------

  describe('multi-field errors', () => {
    it('returns field-level errors for every invalid field in a single response', () => {
      const result = CreateTaskSchema.safeParse({
        title: '',
        description: '',
        status: 'not_valid',
        priority: 'not_valid',
        dueDate: 'not-a-date',
      });
      expect(result.success).toBe(false);
      const errors = fieldErrors(result);
      expect(errors.title).toBeDefined();
      expect(errors.description).toBeDefined();
      expect(errors.status).toBeDefined();
      expect(errors.priority).toBeDefined();
      expect(errors.dueDate).toBeDefined();
    });

    it('returns separate errors for title and description when both are absent', () => {
      const result = CreateTaskSchema.safeParse({});
      expect(result.success).toBe(false);
      const errors = fieldErrors(result);
      expect(errors.title).toBeDefined();
      expect(errors.description).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// UpdateTaskSchema
// ---------------------------------------------------------------------------

describe('UpdateTaskSchema', () => {
  it('fails when title is absent', () => {
    const result = UpdateTaskSchema.safeParse({
      description: 'Valid description',
      status: 'pending',
      priority: 'low',
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.flatten().fieldErrors.title).toBeDefined();
  });

  it('fails when title is whitespace-only', () => {
    const result = UpdateTaskSchema.safeParse({
      title: '   ',
      description: 'Valid description',
      status: 'pending',
      priority: 'low',
    });
    expect(result.success).toBe(false);
  });

  it('fails when description is whitespace-only', () => {
    const result = UpdateTaskSchema.safeParse({
      title: 'Valid title',
      description: '   ',
      status: 'pending',
      priority: 'low',
    });
    expect(result.success).toBe(false);
  });

  it('fails when an invalid status is provided', () => {
    const result = UpdateTaskSchema.safeParse({
      title: 'Valid title',
      description: 'Valid description',
      status: 'done',
      priority: 'low',
    });
    expect(result.success).toBe(false);
  });

  it('fails when an invalid priority is provided', () => {
    const result = UpdateTaskSchema.safeParse({
      title: 'Valid title',
      description: 'Valid description',
      status: 'pending',
      priority: 'critical',
    });
    expect(result.success).toBe(false);
  });

  it('fails when dueDate is an invalid calendar date', () => {
    const result = UpdateTaskSchema.safeParse({
      title: 'Valid title',
      description: 'Valid description',
      status: 'pending',
      priority: 'low',
      dueDate: '2025-02-30',
    });
    expect(result.success).toBe(false);
  });

  it('passes with all valid fields', () => {
    const result = UpdateTaskSchema.safeParse({
      title: 'Updated title',
      description: 'Updated description',
      status: 'completed',
      priority: 'high',
      dueDate: '2025-06-15',
    });
    expect(result.success).toBe(true);
  });

  it('returns errors for both title and description when both are whitespace-only', () => {
    const result = UpdateTaskSchema.safeParse({
      title: '   ',
      description: '   ',
      status: 'pending',
      priority: 'low',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.title).toBeDefined();
      expect(errors.description).toBeDefined();
    }
  });
});
