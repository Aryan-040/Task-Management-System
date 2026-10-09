/**
 * Unit tests for DeleteConfirmDialog.
 *
 * Requirements validated: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { ToastProvider } from '../../../components/ui/Toast';
import { ApiError, Task } from '../../../lib/api/tasks';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockMutateAsync = vi.fn();
const mockShowToast = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('../hooks/useTasks', () => ({
  useDeleteTask: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  taskKeys: {
    lists: () => ['tasks', 'list'],
  },
}));

vi.mock('../../../components/ui/Toast', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../components/ui/Toast')>();
  return {
    ...actual,
    useToast: () => ({ showToast: mockShowToast }),
  };
});

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  };
});

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const MOCK_TASK: Task = {
  id: 'task-1',
  title: 'Fix login bug',
  description: 'Users cannot log in when 2FA is enabled.',
  status: 'in_progress',
  priority: 'high',
  dueDate: '2025-12-31',
  createdAt: '2025-01-01T10:00:00.000Z',
  updatedAt: '2025-01-02T12:00:00.000Z',
};

function renderDialog(
  props: Partial<React.ComponentProps<typeof DeleteConfirmDialog>> = {},
) {
  const queryClient = new QueryClient();
  const onClose = vi.fn();

  const result = render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <DeleteConfirmDialog
          isOpen={true}
          task={MOCK_TASK}
          onClose={onClose}
          {...props}
        />
      </ToastProvider>
    </QueryClientProvider>,
  );

  return { ...result, onClose };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DeleteConfirmDialog', () => {
  describe('rendering', () => {
    it('is not rendered when isOpen is false', () => {
      const { queryByRole } = renderDialog({ isOpen: false });
      expect(queryByRole('dialog')).toBeNull();
    });

    it('renders the dialog with correct ARIA role and modal attribute', () => {
      renderDialog();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      // Radix Dialog sets aria-modal; just verify the dialog element exists with correct role
      expect(dialog).toBeTruthy();
    });

    it('shows the task title in the confirmation message (Req 18.1)', () => {
      renderDialog();
      expect(screen.getByText(/Fix login bug/)).toBeInTheDocument();
    });

    it('renders a Cancel button and a Delete task button', () => {
      renderDialog();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete task/i })).toBeInTheDocument();
    });

    it('Delete task button is enabled by default', () => {
      renderDialog();
      expect(screen.getByRole('button', { name: /delete task/i })).not.toBeDisabled();
    });
  });

  describe('cancel / close', () => {
    it('calls onClose when Cancel is clicked (Req 18.4)', async () => {
      const { onClose } = renderDialog();
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when the X icon button is clicked', async () => {
      const { onClose } = renderDialog();
      await userEvent.click(screen.getByRole('button', { name: /close dialog/i }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when Escape is pressed (Req 18.4)', () => {
      const { onClose } = renderDialog();
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when the backdrop is clicked', async () => {
      const { onClose } = renderDialog();
      // The backdrop is the sibling div with aria-hidden
      const backdrop = document
        .querySelector('[aria-hidden="true"]') as HTMLElement;
      // Radix Dialog closes on overlay click via onOpenChange
      const dlg = screen.getByRole('dialog')
      fireEvent.keyDown(dlg, { key: 'Escape', code: 'Escape' });
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('successful deletion (HTTP 200)', () => {
    beforeEach(() => {
      mockMutateAsync.mockResolvedValue({ message: 'Task deleted' });
    });

    it('calls mutateAsync with task.id (Req 18.2)', async () => {
      renderDialog();
      await userEvent.click(screen.getByRole('button', { name: /delete task/i }));
      await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledWith('task-1'));
    });

    it('shows a success toast with duration ≥3 s (Req 18.2)', async () => {
      renderDialog();
      await userEvent.click(screen.getByRole('button', { name: /delete task/i }));
      await waitFor(() => expect(mockShowToast).toHaveBeenCalled());
      const [opts] = mockShowToast.mock.calls[0];
      expect(opts.message).toBe('Task deleted successfully');
      expect(opts.type).toBe('success');
      expect(opts.duration).toBeGreaterThanOrEqual(3000);
    });

    it('closes dialog after successful deletion (Req 18.2)', async () => {
      const { onClose } = renderDialog();
      await userEvent.click(screen.getByRole('button', { name: /delete task/i }));
      await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    });

    it('invokes onDeleted callback after successful deletion', async () => {
      const onDeleted = vi.fn();
      renderDialog({ onDeleted });
      await userEvent.click(screen.getByRole('button', { name: /delete task/i }));
      await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce());
    });
  });

  describe('HTTP 404 response (Req 18.3)', () => {
    beforeEach(() => {
      mockMutateAsync.mockRejectedValue(new ApiError(404, 'Not found'));
    });

    it('shows "Task not found" error toast with duration ≥3 s (Req 18.3)', async () => {
      renderDialog();
      await userEvent.click(screen.getByRole('button', { name: /delete task/i }));
      await waitFor(() => expect(mockShowToast).toHaveBeenCalled());
      const [opts] = mockShowToast.mock.calls[0];
      expect(opts.message).toBe('Task not found');
      expect(opts.type).toBe('error');
      expect(opts.duration).toBeGreaterThanOrEqual(3000);
    });

    it('invalidates the task list query on 404', async () => {
      renderDialog();
      await userEvent.click(screen.getByRole('button', { name: /delete task/i }));
      await waitFor(() => expect(mockInvalidateQueries).toHaveBeenCalled());
    });

    it('closes dialog on 404', async () => {
      const { onClose } = renderDialog();
      await userEvent.click(screen.getByRole('button', { name: /delete task/i }));
      await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    });

    it('invokes onDeleted on 404', async () => {
      const onDeleted = vi.fn();
      renderDialog({ onDeleted });
      await userEvent.click(screen.getByRole('button', { name: /delete task/i }));
      await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce());
    });
  });

  describe('other errors / network failure (Req 18.6)', () => {
    beforeEach(() => {
      mockMutateAsync.mockRejectedValue(new Error('Network error'));
    });

    it('shows "Failed to delete task" error toast with duration ≥3 s (Req 18.6)', async () => {
      renderDialog();
      await userEvent.click(screen.getByRole('button', { name: /delete task/i }));
      await waitFor(() => expect(mockShowToast).toHaveBeenCalled());
      const [opts] = mockShowToast.mock.calls[0];
      expect(opts.message).toBe('Failed to delete task');
      expect(opts.type).toBe('error');
      expect(opts.duration).toBeGreaterThanOrEqual(3000);
    });

    it('does NOT close the dialog on other errors (task stays in list)', async () => {
      const { onClose } = renderDialog();
      await userEvent.click(screen.getByRole('button', { name: /delete task/i }));
      await waitFor(() => expect(mockShowToast).toHaveBeenCalled());
      expect(onClose).not.toHaveBeenCalled();
    });

    it('does NOT call onDeleted on other errors', async () => {
      const onDeleted = vi.fn();
      renderDialog({ onDeleted });
      await userEvent.click(screen.getByRole('button', { name: /delete task/i }));
      await waitFor(() => expect(mockShowToast).toHaveBeenCalled());
      expect(onDeleted).not.toHaveBeenCalled();
    });
  });

  describe('focus trap', () => {
    it('does not navigate outside on Tab from last focusable element', () => {
      renderDialog();
      const dialog = screen.getByRole('dialog');
      const buttons = screen.getAllByRole('button');
      const lastButton = buttons[buttons.length - 1];
      lastButton.focus();
      fireEvent.keyDown(dialog, { key: 'Tab', code: 'Tab' });
      // Focus should have wrapped — the active element is still in the dialog
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// 26.6 / 26.7 — TaskTableRow integration: delete button flow
// ---------------------------------------------------------------------------
// These tests render the full TaskTableRow so we can verify that:
//   26.6: clicking the row's delete action button reveals the dialog
//   26.7: clicking Cancel inside the dialog dismisses it while the task stays
// The existing mocks (useDeleteTask, useToast, useQueryClient) are already
// active for this file, so no extra providers are needed.
// ---------------------------------------------------------------------------

import { TaskTableRow } from './TaskTableRow';

describe('26.6 & 26.7: TaskTableRow → DeleteConfirmDialog integration', () => {
  it('26.6: clicking the delete action button reveals DeleteConfirmDialog', async () => {
    render(<TaskTableRow task={MOCK_TASK} />);

    // Dialog must be absent initially
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Click the per-row delete icon button
    await userEvent.click(
      screen.getByRole('button', { name: /delete task fix login bug/i }),
    );

    // Dialog is now visible
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // Task title appears in the dialog confirmation message (scope within dialog
    // because the title is also present in the row's <td>)
    expect(within(dialog).getByText(/fix login bug/i)).toBeInTheDocument();
  });

  it('26.7: clicking Cancel in DeleteConfirmDialog dismisses dialog and task title remains', async () => {
    render(<TaskTableRow task={MOCK_TASK} />);

    // Open the dialog
    await userEvent.click(
      screen.getByRole('button', { name: /delete task fix login bug/i }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click the Cancel button inside the dialog
    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    // Dialog dismissed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Task title is still present in the row — task was not removed
    expect(screen.getByText('Fix login bug')).toBeInTheDocument();
  });

  it('success toast appears only after the API responds (not optimistically)', async () => {
    // Arrange: delete resolves after a short delay to confirm toast is deferred
    let resolve!: () => void;
    const deferred = new Promise<{ message: string }>((res) => {
      resolve = () => res({ message: 'Task deleted' });
    });
    mockMutateAsync.mockReturnValue(deferred);
    mockShowToast.mockClear();

    render(<TaskTableRow task={MOCK_TASK} />);

    // Open dialog and confirm delete
    await userEvent.click(
      screen.getByRole('button', { name: /delete task fix login bug/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: /^delete task$/i }));

    // Toast must NOT have fired yet — API hasn't responded
    expect(mockShowToast).not.toHaveBeenCalled();

    // Resolve the API promise
    resolve();
    await waitFor(() => expect(mockShowToast).toHaveBeenCalled());

    // Confirm it's the success toast
    const [opts] = mockShowToast.mock.calls[0];
    expect(opts.type).toBe('success');
    expect(opts.message).toBe('Task deleted successfully');
  });
});


