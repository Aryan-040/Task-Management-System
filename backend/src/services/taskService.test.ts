/**
 * Unit tests for TaskService.
 * Requirements: 25.1–25.11
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTaskRepository } from '../repositories/taskRepository';
import { createTaskService, NotFoundError } from './taskService';
import type { CreateTaskDto } from '../types';

describe('TaskService', () => {
  let repo: ReturnType<typeof createTaskRepository>;
  let service: ReturnType<typeof createTaskService>;

  beforeEach(() => {
    repo = createTaskRepository([]);
    service = createTaskService(repo);
  });

  // ---------------------------------------------------------------------------
  // listTasks — empty store
  // ---------------------------------------------------------------------------

  describe('listTasks', () => {
    it('returns empty data array and total 0 when store is empty', () => {
      const result = service.listTasks({});
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // createTask
  // ---------------------------------------------------------------------------

  describe('createTask', () => {
    const baseDto: CreateTaskDto = {
      title: 'Test Task',
      description: 'Test description',
    };

    it('returns a task with a non-empty server-generated id', () => {
      const task = service.createTask(baseDto);
      expect(task.id).toBeDefined();
      expect(task.id).not.toBe('');
    });

    it('sets createdAt and updatedAt to current ISO 8601 timestamps', () => {
      const before = new Date().toISOString();
      const task = service.createTask(baseDto);
      const after = new Date().toISOString();

      expect(task.createdAt).toBeDefined();
      expect(task.updatedAt).toBeDefined();
      // Both must fall within the window around the call.
      expect(task.createdAt >= before).toBe(true);
      expect(task.createdAt <= after).toBe(true);
      // createdAt and updatedAt are equal immediately after creation.
      expect(task.updatedAt).toBe(task.createdAt);
    });

    it('ignores client-supplied id, createdAt, and updatedAt', () => {
      const clientId = 'client-supplied-id';
      const clientCreatedAt = '2000-01-01T00:00:00.000Z';
      const clientUpdatedAt = '2000-01-01T00:00:00.000Z';

      // Cast through unknown so TypeScript doesn't object to extra fields.
      const task = service.createTask({
        ...baseDto,
        id: clientId,
        createdAt: clientCreatedAt,
        updatedAt: clientUpdatedAt,
      } as unknown as CreateTaskDto);

      expect(task.id).not.toBe(clientId);
      expect(task.createdAt).not.toBe(clientCreatedAt);
      expect(task.updatedAt).not.toBe(clientUpdatedAt);
    });
  });

  // ---------------------------------------------------------------------------
  // getTask
  // ---------------------------------------------------------------------------

  describe('getTask', () => {
    it('returns the task when it exists', () => {
      const created = service.createTask({ title: 'Test', description: 'Desc' });
      const found = service.getTask(created.id);
      expect(found).toEqual(created);
    });

    it('throws NotFoundError for a non-existent id', () => {
      expect(() => service.getTask('non-existent-id')).toThrow(NotFoundError);
    });
  });

  // ---------------------------------------------------------------------------
  // updateTask
  // ---------------------------------------------------------------------------

  describe('updateTask', () => {
    it('updates the task fields and returns the updated task', () => {
      const created = service.createTask({ title: 'Original', description: 'Desc' });
      const updated = service.updateTask(created.id, {
        title: 'Updated title',
        description: 'Updated description',
        status: 'in_progress',
        priority: 'high',
      });

      expect(updated.title).toBe('Updated title');
      expect(updated.description).toBe('Updated description');
      expect(updated.status).toBe('in_progress');
      expect(updated.priority).toBe('high');
      // id and createdAt must be preserved; updatedAt must be >= createdAt.
      expect(updated.id).toBe(created.id);
      expect(updated.createdAt).toBe(created.createdAt);
      expect(updated.updatedAt >= created.updatedAt).toBe(true);
    });

    it('throws NotFoundError for a non-existent id', () => {
      expect(() =>
        service.updateTask('non-existent', {
          title: 'Title',
          description: 'Desc',
          status: 'pending',
          priority: 'low',
        }),
      ).toThrow(NotFoundError);
    });
  });

  // ---------------------------------------------------------------------------
  // deleteTask
  // ---------------------------------------------------------------------------

  describe('deleteTask', () => {
    it('removes the task from the store so getTask throws afterwards', () => {
      const task = service.createTask({ title: 'To Delete', description: 'Desc' });
      service.deleteTask(task.id);
      expect(() => service.getTask(task.id)).toThrow(NotFoundError);
    });

    it('throws NotFoundError for a non-existent id', () => {
      expect(() => service.deleteTask('non-existent-id')).toThrow(NotFoundError);
    });
  });

  // ---------------------------------------------------------------------------
  // listTasks — search, status, priority filters
  // ---------------------------------------------------------------------------

  describe('listTasks with filters', () => {
    beforeEach(() => {
      service.createTask({
        title: 'Buy groceries',
        description: 'Go to the store',
        status: 'pending',
        priority: 'low',
      });
      service.createTask({
        title: 'Write report',
        description: 'Annual company report',
        status: 'in_progress',
        priority: 'high',
      });
      service.createTask({
        title: 'Call dentist',
        description: 'Schedule an appointment',
        status: 'completed',
        priority: 'medium',
      });
    });

    it('returns only tasks whose title matches the search term', () => {
      const result = service.listTasks({ search: 'groceries' });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Buy groceries');
      expect(result.total).toBe(1);
    });

    it('returns only tasks whose description matches the search term', () => {
      const result = service.listTasks({ search: 'Annual' });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Write report');
    });

    it('performs a case-insensitive search', () => {
      const result = service.listTasks({ search: 'CALL' });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Call dentist');
    });

    it('returns an empty result when no tasks match the search term', () => {
      const result = service.listTasks({ search: 'zzz-no-match' });
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('returns only tasks with the specified status', () => {
      const result = service.listTasks({ status: 'in_progress' });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe('in_progress');
      expect(result.total).toBe(1);
    });

    it('returns only tasks with the specified priority', () => {
      const result = service.listTasks({ priority: 'high' });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].priority).toBe('high');
      expect(result.total).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // listTasks — sort by createdAt
  // ---------------------------------------------------------------------------

  describe('listTasks sorting by createdAt', () => {
    it('returns tasks sorted by createdAt descending by default', () => {
      vi.useFakeTimers();
      try {
        vi.setSystemTime(new Date('2025-01-01T10:00:00.000Z'));
        const task1 = service.createTask({ title: 'Task 1', description: 'Desc' });

        vi.setSystemTime(new Date('2025-01-02T10:00:00.000Z'));
        const task2 = service.createTask({ title: 'Task 2', description: 'Desc' });

        vi.setSystemTime(new Date('2025-01-03T10:00:00.000Z'));
        const task3 = service.createTask({ title: 'Task 3', description: 'Desc' });

        const result = service.listTasks({});
        expect(result.data).toHaveLength(3);
        // Most recently created task appears first in descending order.
        expect(result.data[0].id).toBe(task3.id);
        expect(result.data[1].id).toBe(task2.id);
        expect(result.data[2].id).toBe(task1.id);
      } finally {
        vi.useRealTimers();
      }
    });

    it('returns tasks sorted by createdAt ascending when sortOrder is asc', () => {
      vi.useFakeTimers();
      try {
        vi.setSystemTime(new Date('2025-01-01T10:00:00.000Z'));
        const task1 = service.createTask({ title: 'Task A', description: 'Desc' });

        vi.setSystemTime(new Date('2025-01-02T10:00:00.000Z'));
        const task2 = service.createTask({ title: 'Task B', description: 'Desc' });

        vi.setSystemTime(new Date('2025-01-03T10:00:00.000Z'));
        const task3 = service.createTask({ title: 'Task C', description: 'Desc' });

        const result = service.listTasks({ sortBy: 'createdAt', sortOrder: 'asc' });
        expect(result.data).toHaveLength(3);
        // Earliest task appears first in ascending order.
        expect(result.data[0].id).toBe(task1.id);
        expect(result.data[1].id).toBe(task2.id);
        expect(result.data[2].id).toBe(task3.id);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // listTasks — pagination
  // ---------------------------------------------------------------------------

  describe('listTasks pagination', () => {
    beforeEach(() => {
      for (let i = 1; i <= 10; i++) {
        service.createTask({ title: `Task ${i}`, description: `Description ${i}` });
      }
    });

    it('returns correct slice for the first page', () => {
      const result = service.listTasks({ page: 1, pageSize: 3 });
      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(3);
    });

    it('returns correct slice for the second page with no overlap from the first', () => {
      const page1 = service.listTasks({ page: 1, pageSize: 3 });
      const page2 = service.listTasks({ page: 2, pageSize: 3 });

      expect(page2.data).toHaveLength(3);
      expect(page2.page).toBe(2);

      const page1Ids = new Set(page1.data.map((t) => t.id));
      const overlap = page2.data.filter((t) => page1Ids.has(t.id));
      expect(overlap).toHaveLength(0);
    });

    it('returns an empty data array when the page exceeds total pages', () => {
      const result = service.listTasks({ page: 100, pageSize: 25 });
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(10);
    });

    it('returns all tasks when pageSize exceeds total task count', () => {
      const result = service.listTasks({ page: 1, pageSize: 100 });
      expect(result.data).toHaveLength(10);
      expect(result.total).toBe(10);
    });
  });
});
