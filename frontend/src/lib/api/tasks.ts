/**
 * Typed API client for the Task Management backend.
 * All HTTP calls to the backend are centralised here.
 * Requirements: 21.1, 21.2, 21.5, 21.6
 */

// ---------------------------------------------------------------------------
// Types (mirroring backend/src/types/index.ts)
// ---------------------------------------------------------------------------

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  /** UUID v4, max 128 characters, server-generated */
  id: string;
  /** 1–255 characters */
  title: string;
  /** 1–1000 characters */
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** ISO 8601 calendar date string "YYYY-MM-DD", or null */
  dueDate: string | null;
  /** ISO 8601 timestamp */
  createdAt: string;
  /** ISO 8601 timestamp */
  updatedAt: string;
}

/** Body shape for POST /api/tasks */
export interface CreateTaskDto {
  title: string;
  description: string;
  /** Defaults to 'pending' when absent */
  status?: TaskStatus;
  /** Defaults to 'medium' when absent */
  priority?: TaskPriority;
  dueDate?: string | null;
}

/** Body shape for PUT /api/tasks/:id */
export interface UpdateTaskDto {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
}

/** Response shape for GET /api/tasks */
export interface PaginatedTasksResponse {
  data: Task[];
  total: number;
  page: number;
  pageSize: number;
}

/** Query parameters for GET /api/tasks */
export interface ListTasksParams {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// ApiError
// ---------------------------------------------------------------------------

/**
 * Thrown by the `request` helper for any non-2xx response.
 * `status` carries the HTTP status code; `errors` carries field-level messages
 * when the server returns a 400 validation failure.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
    // Maintain prototype chain in compiled ES5 targets
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

import { API_URL } from '../config';

const BASE_URL = API_URL;

/**
 * Generic fetch wrapper.
 * Resolves with the parsed JSON body on 2xx responses.
 * Rejects with an `ApiError` on any non-2xx response.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);

  if (!res.ok) {
    let body: { message?: string; errors?: Record<string, string> } = {};
    try {
      body = await res.json();
    } catch {
      // body is not valid JSON — use a fallback message
    }
    throw new ApiError(
      res.status,
      body.message ?? 'An unexpected error occurred',
      body.errors,
    );
  }

  return res.json() as Promise<T>;
}

/**
 * Serialises a `ListTasksParams` object into a URL query string.
 * Omits keys whose value is `undefined`.
 */
function toQueryString(params: ListTasksParams): string {
  const sp = new URLSearchParams();

  if (params.search !== undefined) sp.set('search', params.search);
  if (params.status !== undefined) sp.set('status', params.status);
  if (params.priority !== undefined) sp.set('priority', params.priority);
  if (params.sortBy !== undefined) sp.set('sortBy', params.sortBy);
  if (params.sortOrder !== undefined) sp.set('sortOrder', params.sortOrder);
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.pageSize !== undefined) sp.set('pageSize', String(params.pageSize));

  return sp.toString();
}

// ---------------------------------------------------------------------------
// Public API client
// ---------------------------------------------------------------------------

export const tasksApi = {
  /**
   * GET /api/tasks
   * Returns a paginated, filtered, sorted list of tasks.
   */
  list: (params: ListTasksParams = {}): Promise<PaginatedTasksResponse> => {
    const qs = toQueryString(params);
    return request<PaginatedTasksResponse>(`/api/tasks${qs ? `?${qs}` : ''}`);
  },

  /**
   * GET /api/tasks/:id
   * Returns a single task by ID. Rejects with ApiError(404) when not found.
   */
  get: (id: string): Promise<Task> => request<Task>(`/api/tasks/${id}`),

  /**
   * POST /api/tasks
   * Creates a new task. Rejects with ApiError(400) on validation failure.
   */
  create: (dto: CreateTaskDto): Promise<Task> =>
    request<Task>('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    }),

  /**
   * PUT /api/tasks/:id
   * Replaces all mutable fields of an existing task.
   * Rejects with ApiError(400) on validation failure, ApiError(404) when not found.
   */
  update: (id: string, dto: UpdateTaskDto): Promise<Task> =>
    request<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    }),

  /**
   * DELETE /api/tasks/:id
   * Removes a task from the store. Rejects with ApiError(404) when not found.
   */
  delete: (id: string): Promise<{ message: string }> =>
    request<{ message: string }>(`/api/tasks/${id}`, { method: 'DELETE' }),
};
