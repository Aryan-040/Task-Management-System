/**
 * Global vitest setup file.
 * Runs before every test, regardless of which test file is executing.
 * Resets the in-memory store to an empty state so tests never share data.
 *
 * Relies on `testRepo` being set by a createTestApp() call (typically in a
 * beforeAll at the top of each test suite).  The guard allows the setup hook
 * to be registered without error before the first createTestApp() call runs.
 */

import { beforeEach } from 'vitest';
import { testRepo } from './helpers';

beforeEach(() => {
  testRepo?.reset([]);
});
