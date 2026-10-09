/**
 * Task service — business logic layer.
 * Implements filter → sort → paginate pipeline for listTasks,
 * and delegates CRUD to the repository.
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

import type {
  Task,
  TaskPriority,
  CreateTaskDto,
  UpdateTaskDto,
  PaginatedTasksResponse,
  ListTasksParams,
} from '../types';
import type { TaskRepository } from '../repositories/taskRepository';

// ---------------------------------------------------------------------------
// Domain errors
// ---------------------------------------------------------------------------

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
    // Fix prototype chain for instanceof checks when compiling to ES5.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ---------------------------------------------------------------------------
// Service interface
// ---------------------------------------------------------------------------

export interface TaskService {
  /**
   * Return a paginated, filtered, sorted list of tasks.
   * Pipeline: search → status filter → priority filter → sort → paginate
   */
  listTasks(params: ListTasksParams): PaginatedTasksResponse;

  /** Return a single task by id. Throws NotFoundError when absent. */
  getTask(id: string): Task;

  /** Create and persist a new task. */
  createTask(input: CreateTaskDto): Task;

  /** Update an existing task. Throws NotFoundError when absent. */
  updateTask(id: string, input: UpdateTaskDto): Task;

  /** Delete a task. Throws NotFoundError when absent. */
  deleteTask(id: string): void;
}

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

/** Priority → numeric weight for comparison */
const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

/**
 * Compare two tasks by the given sortBy field and direction.
 * Returns a negative/zero/positive number (standard comparator contract).
 *
 * Null-handling for dueDate: null sorts last regardless of direction.
 * Title comparison is case-insensitive.
 * createdAt / updatedAt are ISO 8601 strings that sort correctly lexicographically.
 */
function compareTasksByField(
  a: Task,
  b: Task,
  sortBy: NonNullable<ListTasksParams['sortBy']>,
  sortOrder: NonNullable<ListTasksParams['sortOrder']>,
): number {
  const dir = sortOrder === 'asc' ? 1 : -1;

  switch (sortBy) {
    case 'priority': {
      const diff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      return diff * dir;
    }

    case 'title': {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      if (aTitle < bTitle) return -1 * dir;
      if (aTitle > bTitle) return 1 * dir;
      return 0;
    }

    case 'dueDate': {
      // null values always sort last, regardless of direction.
      if (a.dueDate === null && b.dueDate === null) return 0;
      if (a.dueDate === null) return 1;   // a goes after b → last
      if (b.dueDate === null) return -1;  // b goes after a → last

      // Both non-null — lexicographic comparison of YYYY-MM-DD strings.
      if (a.dueDate < b.dueDate) return -1 * dir;
      if (a.dueDate > b.dueDate) return 1 * dir;
      return 0;
    }

    case 'createdAt':
    default: {
      // ISO 8601 timestamps sort correctly lexicographically.
      if (a.createdAt < b.createdAt) return -1 * dir;
      if (a.createdAt > b.createdAt) return 1 * dir;
      return 0;
    }
  }
}

/**
 * Stable sort — Array.prototype.sort is stable in all modern engines (V8 ≥ 7.0,
 * per ECMAScript 2019 spec). We rely on that here; the index-based fallback is
 * included as an explicit stability guarantee for the sort key.
 */
function stableSortTasks(
  tasks: Task[],
  sortBy: NonNullable<ListTasksParams['sortBy']>,
  sortOrder: NonNullable<ListTasksParams['sortOrder']>,
): Task[] {
  return tasks
    .map((task, index) => ({ task, index }))
    .sort((a, b) => {
      const primary = compareTasksByField(a.task, b.task, sortBy, sortOrder);
      // Preserve original insertion order for equal keys (stable sort).
      return primary !== 0 ? primary : a.index - b.index;
    })
    .map(({ task }) => task);
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createTaskService(repo: TaskRepository): TaskService {
  return {
    // -----------------------------------------------------------------------
    // listTasks
    // -----------------------------------------------------------------------
    listTasks(params: ListTasksParams): PaginatedTasksResponse {
      // 1. Fetch all tasks from the repository.
      let tasks: Task[] = repo.findAll();

      // 2. Search filter — case-insensitive substring on title + description.
      if (params.search !== undefined && params.search !== '') {
        const q = params.search.toLowerCase();
        tasks = tasks.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q),
        );
      }

      // 3. Status filter.
      if (params.status !== undefined) {
        tasks = tasks.filter((t) => t.status === params.status);
      }

      // 4. Priority filter.
      if (params.priority !== undefined) {
        tasks = tasks.filter((t) => t.priority === params.priority);
      }

      // 5. Stable sort.
      const sortBy = params.sortBy ?? 'createdAt';
      const sortOrder = params.sortOrder ?? 'desc';
      tasks = stableSortTasks(tasks, sortBy, sortOrder);

      // 6. Capture total after all filters and sorting (before slicing).
      const total = tasks.length;

      // 7. Paginate.
      const page = params.page !== undefined && params.page >= 1 ? params.page : 1;
      const pageSize =
        params.pageSize !== undefined && params.pageSize >= 1 ? params.pageSize : 25;

      const start = (page - 1) * pageSize;
      const data = tasks.slice(start, start + pageSize);

      // 8. Return paginated response.
      return { data, total, page, pageSize };
    },

    // -----------------------------------------------------------------------
    // getTask
    // -----------------------------------------------------------------------
    getTask(id: string): Task {
      const task = repo.findById(id);
      if (task === undefined) {
        throw new NotFoundError(`Task with id "${id}" not found.`);
      }
      return task;
    },

    // -----------------------------------------------------------------------
    // createTask
    // -----------------------------------------------------------------------
    createTask(input: CreateTaskDto): Task {
      return repo.create({
        ...input,
        title: input.title.trim(),
        description: input.description.trim(),
      });
    },

    // -----------------------------------------------------------------------
    // updateTask
    // -----------------------------------------------------------------------
    updateTask(id: string, input: UpdateTaskDto): Task {
      const trimmedInput = { ...input, title: input.title.trim(), description: input.description.trim() };
      const task = repo.update(id, trimmedInput);
      if (task === undefined) {
        throw new NotFoundError(`Task with id "${id}" not found.`);
      }
      return task;
    },

    // -----------------------------------------------------------------------
    // deleteTask
    // -----------------------------------------------------------------------
    deleteTask(id: string): void {
      const deleted = repo.delete(id);
      if (!deleted) {
        throw new NotFoundError(`Task with id "${id}" not found.`);
      }
    },
  };
}


