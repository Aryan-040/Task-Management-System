/**
 * Shared test helpers for backend integration and unit tests.
 * Each call to createTestApp() wires a fresh isolated repository + service +
 * app instance and captures the repository in the exported `testRepo` variable
 * so that setup.ts can reset the store between tests.
 */

import express from 'express';
import { createTaskRepository, TaskRepository } from '../repositories/taskRepository';
import { createTaskService } from '../services/taskService';
import { createApp } from '../app';

/**
 * Shared repository reference.
 * Set by createTestApp() and read by setup.ts's beforeEach hook.
 * Typed as TaskRepository | undefined because the variable starts unset before
 * the first createTestApp() call.
 */
export let testRepo: TaskRepository | undefined;

/**
 * Create a fully-wired, isolated Express application for testing.
 *
 * Call this once per test suite (e.g. inside a beforeAll).  The resulting app
 * is backed by an empty in-memory store and the shared `testRepo` reference is
 * updated so that setup.ts can reset the store to empty before each test.
 */
export function createTestApp(): express.Express {
  testRepo = createTaskRepository([]);
  const service = createTaskService(testRepo);
  return createApp(service);
}
