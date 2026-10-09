/**
 * Page-level tests for the Tasks page.
 *
 * 26.5: task list API call fails → error state element and Retry button visible.
 *
 * Requirements: 26.5
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TasksPage from './page';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock Next.js router / navigation so useTaskFilters works in tests
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/tasks',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock useTaskList to return the error state for 26.5
vi.mock('../../features/tasks/hooks/useTasks', () => ({
  useTaskList: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch: vi.fn(),
  })),
  useCreateTask: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateTask: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteTask: () => ({ mutateAsync: vi.fn(), isPending: false }),
  taskKeys: {
    all: () => ['tasks'],
    lists: () => ['tasks', 'list'],
    list: (p: unknown) => ['tasks', 'list', p],
    detail: (id: string) => ['tasks', 'detail', id],
  },
}));

// Toast: keep the real ToastProvider, silence useToast calls from children
vi.mock('../../components/ui/Toast', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../components/ui/Toast')>();
  return {
    ...actual,
    useToast: () => ({ showToast: vi.fn() }),
  };
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <TasksPage />
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TasksPage – error state (requirement 26.5)', () => {
  it('26.5: renders an alert element with an error message when the API fails', async () => {
    renderPage();

    // The error container has role="alert"
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/failed to load tasks/i);
  });

  it('26.5: renders a Retry button when the API fails', async () => {
    renderPage();

    const retryBtn = await screen.findByRole('button', { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();
  });
});
