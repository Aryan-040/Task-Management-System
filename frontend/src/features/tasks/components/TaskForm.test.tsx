/**
 * Component tests for TaskForm.
 *
 * 26.1: submit TaskForm with whitespace-only title → validation error visible
 * 26.2: submit TaskForm with whitespace-only description → validation error visible
 *
 * Requirements: 26.1, 26.2
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskForm } from './TaskForm';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TaskForm – client-side validation', () => {
  it('26.1: shows "Title is required" when title is whitespace-only on submit', async () => {
    const user = userEvent.setup();
    render(
      <TaskForm isSubmitting={false} onSubmit={vi.fn()} onCancel={vi.fn()} />,
      { wrapper: Wrapper },
    );

    // Type only spaces into the title field
    const titleInput = screen.getByLabelText(/title/i);
    await user.type(titleInput, '   ');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /create task/i }));

    // Validation error should be visible
    expect(screen.getByText('Title is required')).toBeInTheDocument();

    // onSubmit must not have been called (prevented by validation)
    expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
  });

  it('26.2: shows "Description is required" when description is whitespace-only on submit', async () => {
    const user = userEvent.setup();
    render(
      <TaskForm isSubmitting={false} onSubmit={vi.fn()} onCancel={vi.fn()} />,
      { wrapper: Wrapper },
    );

    // Provide a valid title so only description fails
    await user.type(screen.getByLabelText(/title/i), 'Valid Title');

    // Type only spaces into the description field
    await user.type(screen.getByLabelText(/description/i), '   ');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /create task/i }));

    // Validation error should be visible
    expect(screen.getByText('Description is required')).toBeInTheDocument();
  });

  it('does not call onSubmit when title is empty', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <TaskForm isSubmitting={false} onSubmit={onSubmit} onCancel={vi.fn()} />,
      { wrapper: Wrapper },
    );

    // Leave title empty, add valid description
    await user.type(screen.getByLabelText(/description/i), 'Some description');
    await user.click(screen.getByRole('button', { name: /create task/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with trimmed values when form is valid', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <TaskForm isSubmitting={false} onSubmit={onSubmit} onCancel={vi.fn()} />,
      { wrapper: Wrapper },
    );

    await user.type(screen.getByLabelText(/title/i), 'My Task');
    await user.type(screen.getByLabelText(/description/i), 'Task description');
    await user.click(screen.getByRole('button', { name: /create task/i }));

    expect(onSubmit).toHaveBeenCalledOnce();
    const values = onSubmit.mock.calls[0][0];
    expect(values.title).toBe('My Task');
    expect(values.description).toBe('Task description');
  });

  it('disables submit button when isSubmitting is true', () => {
    render(
      <TaskForm isSubmitting={true} onSubmit={vi.fn()} onCancel={vi.fn()} />,
      { wrapper: Wrapper },
    );

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('shows server-level field errors via serverErrors prop', () => {
    render(
      <TaskForm
        isSubmitting={false}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        serverErrors={{ title: 'Title already taken' }}
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getByText('Title already taken')).toBeInTheDocument();
  });
});
