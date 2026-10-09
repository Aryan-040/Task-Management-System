/**
 * Seed data for the in-memory task store.
 * Loaded into the repository on backend startup; resets whenever the process restarts.
 * Requirements: 3.2, 28.1, 28.2
 *
 * Coverage:
 *  - All three status values:   pending (tasks 1, 4), in_progress (tasks 2, 5), completed (task 3)
 *  - All three priority values: low (tasks 1, 5),    medium (tasks 2, 4),       high (task 3)
 *  - Past dueDate:              tasks 1, 4
 *  - Future dueDate:            tasks 2, 5
 *  - Null dueDate:              task 3
 */

import { Task } from '../types';

export const SEED_TASKS: Task[] = [
  // ── Task 1 ──────────────────────────────────────────────────────────────────
  // status: pending | priority: low | dueDate: past
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Set up CI/CD pipeline',
    description:
      'Configure GitHub Actions workflows to run lint, type-check, and tests on every pull request. Add deployment steps for the staging environment.',
    status: 'pending',
    priority: 'low',
    dueDate: '2024-03-15',
    createdAt: '2024-02-01T09:00:00.000Z',
    updatedAt: '2024-02-01T09:00:00.000Z',
  },

  // ── Task 2 ──────────────────────────────────────────────────────────────────
  // status: in_progress | priority: medium | dueDate: future
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Implement user authentication',
    description:
      'Add JWT-based authentication to the API. Include login, logout, and token refresh endpoints. Protect all task endpoints behind authentication middleware.',
    status: 'in_progress',
    priority: 'medium',
    dueDate: '2030-06-30',
    createdAt: '2024-03-10T14:30:00.000Z',
    updatedAt: '2024-03-12T10:15:00.000Z',
  },

  // ── Task 3 ──────────────────────────────────────────────────────────────────
  // status: completed | priority: high | dueDate: null
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    title: 'Design database schema',
    description:
      'Define entity relationships and field types for tasks, users, and labels. Review the schema with the team and create the initial migration scripts.',
    status: 'completed',
    priority: 'high',
    dueDate: null,
    createdAt: '2024-01-15T08:00:00.000Z',
    updatedAt: '2024-02-20T16:45:00.000Z',
  },

  // ── Task 4 ──────────────────────────────────────────────────────────────────
  // status: pending | priority: medium | dueDate: past
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    title: 'Write API documentation',
    description:
      'Document all REST endpoints using OpenAPI 3.x. Include request/response schemas and at least one example per endpoint. Publish the spec to the docs/ directory.',
    status: 'pending',
    priority: 'medium',
    dueDate: '2024-05-01',
    createdAt: '2024-04-01T11:00:00.000Z',
    updatedAt: '2024-04-01T11:00:00.000Z',
  },

  // ── Task 5 ──────────────────────────────────────────────────────────────────
  // status: in_progress | priority: low | dueDate: future
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    title: 'Add end-to-end tests',
    description:
      'Use Playwright to write E2E tests covering the create, edit, delete, and filter flows. Run the suite in CI against a locally started dev server.',
    status: 'in_progress',
    priority: 'low',
    dueDate: '2030-12-31',
    createdAt: '2024-05-20T13:00:00.000Z',
    updatedAt: '2024-05-22T09:30:00.000Z',
  },
];
