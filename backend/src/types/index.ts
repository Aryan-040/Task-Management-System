/**
 * Shared TypeScript interfaces and types for the Task Management backend.
 * All layers (repository, service, controller) operate on these contracts.
 * Requirement 2.1
 */

// ---------------------------------------------------------------------------
// Primitive union types
// ---------------------------------------------------------------------------

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type TaskPriority = 'low' | 'medium' | 'high';

// ---------------------------------------------------------------------------
// Core domain model
// ---------------------------------------------------------------------------

export interface Task {
  /** UUID v4, max 128 characters, server-generated — never set by the client */
  id: string;
  /** 1–255 characters (stored trimmed) */
  title: string;
  /** 1–1000 characters (stored trimmed) */
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** ISO 8601 calendar date string "YYYY-MM-DD", or null when no due date is set */
  dueDate: string | null;
  /** ISO 8601 timestamp — set by the server on creation, never updated */
  createdAt: string;
  /** ISO 8601 timestamp — set by the server on creation and on every successful update; always >= createdAt */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

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

/** Body shape for PUT /api/tasks/:id (full replacement, not a partial patch) */
export interface UpdateTaskDto {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
}

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------

/** Body returned by GET /api/tasks */
export interface PaginatedTasksResponse {
  data: Task[];
  /** Total number of tasks matching the current filter/search parameters (before pagination) */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of tasks per page */
  pageSize: number;
}

/** Body returned on all 4xx and 5xx responses */
export interface ApiErrorBody {
  message: string;
  /** Field-level error messages keyed by field name, present on validation errors */
  errors?: Record<string, string>;
}

/** Body returned by GET /api/health */
export interface HealthResponse {
  status: 'ok';
  /** Current server timestamp in ISO 8601 format */
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Query parameter shapes
// ---------------------------------------------------------------------------

/** Parsed query parameters for GET /api/tasks */
export interface ListTasksParams {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  /** Field to sort by; defaults to 'createdAt' when absent */
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'title';
  /** Sort direction; defaults to 'desc' when absent */
  sortOrder?: 'asc' | 'desc';
  /** Page number (1-indexed); defaults to 1 */
  page?: number;
  /** Tasks per page; defaults to 25 */
  pageSize?: number;
}
