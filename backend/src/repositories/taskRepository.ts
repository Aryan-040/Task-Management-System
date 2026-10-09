/**
 * In-memory task repository with factory pattern.
 * Requirements: 2.2, 2.3, 2.4, 2.5, 3.1, 3.3, 3.5
 */

import { Task, CreateTaskDto, UpdateTaskDto } from '../types';
import { SEED_TASKS } from './seedData';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface TaskRepository {
  /** Return all tasks currently in the store. */
  findAll(): Task[];
  /** Return the task with the given id, or undefined if not found. */
  findById(id: string): Task | undefined;
  /**
   * Create a new task. Server generates id, createdAt, and updatedAt.
   * Any client-supplied id/createdAt/updatedAt in the input are ignored.
   */
  create(input: CreateTaskDto): Task;
  /**
   * Update an existing task. Server sets updatedAt; createdAt is preserved.
   * Returns the updated task, or undefined if not found.
   */
  update(id: string, input: UpdateTaskDto): Task | undefined;
  /** Remove a task. Returns true if found and deleted, false otherwise. */
  delete(id: string): boolean;
  /**
   * Reset the store.
   * - When called with no argument: restores the store to the initial array
   *   provided when the repository was created (or the seed data for the singleton).
   * - When called with a tasks array: replaces the store with that array.
   */
  reset(tasks?: Task[]): void;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates an isolated TaskRepository instance backed by an in-memory array.
 *
 * @param initial - Optional seed array. Defaults to an empty array when not
 *                  provided (the singleton handles its own seed logic).
 */
export function createTaskRepository(initial: Task[] = []): TaskRepository {
  // Shallow-copy so external mutations of the initial array don't affect the store.
  let store: Task[] = [...initial];

  return {
    findAll(): Task[] {
      return [...store];
    },

    findById(id: string): Task | undefined {
      return store.find((task) => task.id === id);
    },

    create(input: CreateTaskDto): Task {
      const now = new Date().toISOString();

      // Destructure to strip any client-supplied id/createdAt/updatedAt (Req 2.5).
      // The remaining fields come from the DTO.
      const { title, description, status, priority, dueDate } = input as CreateTaskDto & {
        id?: unknown;
        createdAt?: unknown;
        updatedAt?: unknown;
      };

      const task: Task = {
        id: crypto.randomUUID(), // Req 2.2 — server-generated, non-derivable
        title,
        description,
        status: status ?? 'pending',
        priority: priority ?? 'medium',
        dueDate: dueDate !== undefined ? dueDate ?? null : null,
        createdAt: now, // Req 2.3 — set to current server timestamp
        updatedAt: now, // Req 2.3 — createdAt === updatedAt immediately after create
      };

      store.push(task);
      return { ...task };
    },

    update(id: string, input: UpdateTaskDto): Task | undefined {
      const index = store.findIndex((task) => task.id === id);
      if (index === -1) {
        return undefined;
      }

      // Req 2.4 — only updatedAt changes; createdAt is preserved.
      const existing = store[index];
      const updated: Task = {
        ...existing,
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate !== undefined ? input.dueDate ?? null : existing.dueDate,
        updatedAt: new Date().toISOString(),
      };

      store[index] = updated;
      return { ...updated };
    },

    delete(id: string): boolean {
      const index = store.findIndex((task) => task.id === id);
      if (index === -1) {
        return false;
      }
      store.splice(index, 1);
      return true;
    },

    reset(tasks?: Task[]): void {
      if (tasks !== undefined) {
        // Caller supplied a replacement array.
        store = [...tasks];
      } else {
        // Restore to the initial array this instance was created with (Req 3.3, 3.5).
        store = [...initial];
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

/**
 * Determine initial tasks for the singleton, honouring the SEED_DATA env var.
 * Req 3.5 — "allow the Seed Data source to be replaced with a custom list or
 * set to empty by changing a single configuration value".
 *
 * SEED_DATA=false → empty store (useful for testing/CI environments)
 * anything else   → use SEED_TASKS
 */
function resolveSeedTasks(): Task[] {
  return process.env.SEED_DATA === 'false' ? [] : [...SEED_TASKS];
}

/**
 * Default singleton repository.
 * Initialised from SEED_TASKS (or empty when SEED_DATA=false).
 * Calling `taskRepository.reset()` restores this original seed state.
 */
export const taskRepository: TaskRepository = createTaskRepository(resolveSeedTasks());
