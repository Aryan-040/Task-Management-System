/**
 * Component tests for TaskTable.
 *
 * 26.3: task list API in pending state → Skeleton loader elements visible in list region
 *
 * Requirements: 26.3
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskTable } from './TaskTable';
import type { Task } from '../../../lib/api/tasks';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SAMPLE_TASK: Task = {
  id: 'task-1',
  title: 'Sample Task',
  description: 'A sample task for testing.',
  status: 'pending',
  priority: 'medium',
  dueDate: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TaskTable', () => {
  describe('26.3: loading state', () => {
    it('renders skeleton rows when isLoading is true', () => {
      render(<TaskTable tasks={[]} isLoading={true} />);

      const skeletonRows = screen.getAllByTestId('skeleton-row');
      expect(skeletonRows.length).toBeGreaterThan(0);
    });

    it('skeleton rows are aria-hidden so screen readers skip them', () => {
      render(<TaskTable tasks={[]} isLoading={true} />);

      const skeletonRows = screen.getAllByTestId('skeleton-row');
      skeletonRows.forEach((row) => {
        expect(row).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('does not render task rows while loading', () => {
      render(<TaskTable tasks={[SAMPLE_TASK]} isLoading={true} />);

      // Task title should NOT appear while loading
      expect(screen.queryByText('Sample Task')).not.toBeInTheDocument();
    });
  });

  describe('normal state', () => {
    it('renders task rows when not loading', () => {
      render(<TaskTable tasks={[SAMPLE_TASK]} isLoading={false} />);

      expect(screen.getByText('Sample Task')).toBeInTheDocument();
    });

    it('renders no skeleton rows when not loading', () => {
      render(<TaskTable tasks={[SAMPLE_TASK]} isLoading={false} />);

      expect(screen.queryAllByTestId('skeleton-row')).toHaveLength(0);
    });

    it('renders an empty tbody when tasks array is empty and not loading', () => {
      render(<TaskTable tasks={[]} isLoading={false} />);

      // No skeleton rows and no task rows
      expect(screen.queryAllByTestId('skeleton-row')).toHaveLength(0);
      expect(screen.queryByText('Sample Task')).not.toBeInTheDocument();
    });
  });

  describe('column headers', () => {
    it('renders all six column headers', () => {
      render(<TaskTable tasks={[]} />);

      expect(screen.getByRole('columnheader', { name: /title/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /description/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /priority/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /due date/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
    });
  });
});
