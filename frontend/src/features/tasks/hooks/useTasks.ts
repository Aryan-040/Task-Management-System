'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import {
  tasksApi,
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  PaginatedTasksResponse,
  ListTasksParams,
  ApiError,
} from '../../../lib/api/tasks';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const taskKeys = {
  all: () => ['tasks'] as const,
  lists: () => ['tasks', 'list'] as const,
  list: (params: ListTasksParams) => ['tasks', 'list', params] as const,
  detail: (id: string) => ['tasks', 'detail', id] as const,
};

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

/**
 * Fetches a paginated/filtered task list.
 * staleTime: 30 s — keeps the list fresh for quick navigation between pages.
 */
export function useTaskList(
  params: ListTasksParams = {},
): UseQueryResult<PaginatedTasksResponse, ApiError> {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => tasksApi.list(params),
    staleTime: 10_000,
  });
}

/**
 * Fetches a single task by ID.
 * staleTime: 60 s — detail views are less volatile than the list.
 * Disabled when `id` is empty to avoid spurious requests.
 */
export function useTask(id: string): UseQueryResult<Task, ApiError> {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksApi.get(id),
    staleTime: 20_000,
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

/**
 * Creates a new task.
 * On success, invalidates all list queries so every list view re-fetches.
 */
export function useCreateTask(): UseMutationResult<
  Task,
  ApiError,
  CreateTaskDto
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTaskDto) => tasksApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(), refetchType: 'all' });
    },
  });
}

/**
 * Updates an existing task.
 * On success, invalidates both list queries and the specific detail query so
 * any open detail view also reflects the latest data.
 */
export function useUpdateTask(): UseMutationResult<
  Task,
  ApiError,
  { id: string; input: UpdateTaskDto }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => tasksApi.update(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.id), refetchType: 'all' });
    },
  });
}

/**
 * Deletes a task by ID.
 * On success, invalidates all list queries so the deleted item disappears.
 */
export function useDeleteTask(): UseMutationResult<
  { message: string },
  ApiError,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists(), refetchType: 'all' });
    },
  });
}
