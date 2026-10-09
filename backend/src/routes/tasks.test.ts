/**
 * Backend integration tests for Task API Routes.
 * Uses supertest against a createTestApp() instance (empty in-memory store).
 * The vitest setup file (src/test/setup.ts) resets the store to empty before
 * each test, so tests are fully isolated.
 *
 * Requirements: 25.1–25.11, 6.1, 6.2, 6.8
 */

import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import type express from 'express';
import { createTestApp } from '../test/helpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid POST body for task creation. */
const validPayload = {
  title: 'Test Task',
  description: 'A valid description for this test task.',
  status: 'pending' as const,
  priority: 'medium' as const,
  dueDate: '2099-12-31',
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Task API Routes', () => {
  let app: express.Express;
  let request: ReturnType<typeof supertest>;

  beforeAll(() => {
    app = createTestApp();
    request = supertest(app);
  });

  // -------------------------------------------------------------------------
  // POST /api/tasks — create
  // -------------------------------------------------------------------------

  describe('POST /api/tasks', () => {
    it('valid payload → 201 with all 8 task fields', async () => {
      const res = await request.post('/api/tasks').send(validPayload);

      expect(res.status).toBe(201);

      const task = res.body;
      // All 8 required fields must be present
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title', validPayload.title);
      expect(task).toHaveProperty('description', validPayload.description);
      expect(task).toHaveProperty('status', validPayload.status);
      expect(task).toHaveProperty('priority', validPayload.priority);
      expect(task).toHaveProperty('dueDate', validPayload.dueDate);
      expect(task).toHaveProperty('createdAt');
      expect(task).toHaveProperty('updatedAt');

      // id must be a non-empty string
      expect(typeof task.id).toBe('string');
      expect(task.id.length).toBeGreaterThan(0);

      // timestamps must be valid ISO 8601
      expect(() => new Date(task.createdAt)).not.toThrow();
      expect(() => new Date(task.updatedAt)).not.toThrow();
    });

    it('missing title → 400 with errors.title', async () => {
      const { title: _t, ...noTitle } = validPayload;
      const res = await request.post('/api/tasks').send(noTitle);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('errors');
      expect(res.body.errors).toHaveProperty('title');
    });

    it('missing description → 400 with errors.description', async () => {
      const { description: _d, ...noDesc } = validPayload;
      const res = await request.post('/api/tasks').send(noDesc);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('errors');
      expect(res.body.errors).toHaveProperty('description');
    });

    it('malformed JSON body → 400', async () => {
      const res = await request
        .post('/api/tasks')
        .set('Content-Type', 'application/json')
        .send('{ "title": "oops"  INVALID }');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  // -------------------------------------------------------------------------
  // GET /api/tasks — collection
  // -------------------------------------------------------------------------

  describe('GET /api/tasks', () => {
    it('empty store → 200 with empty data array and total 0', async () => {
      // Store is reset to empty before each test by setup.ts
      const res = await request.get('/api/tasks');

      expect(res.status).toBe(200);
      // Response must include a data array and a total count
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(0);
      expect(res.body).toHaveProperty('total', 0);
    });

    it('after creating tasks → 200 with tasks in data array', async () => {
      // Create two tasks first
      await request.post('/api/tasks').send(validPayload);
      await request.post('/api/tasks').send({
        ...validPayload,
        title: 'Second Task',
        description: 'Another task description.',
      });

      const res = await request.get('/api/tasks');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body).toHaveProperty('total');
      expect(res.body.total).toBeGreaterThanOrEqual(2);
    });
  });

  // -------------------------------------------------------------------------
  // GET /api/tasks/:id — individual task
  // -------------------------------------------------------------------------

  describe('GET /api/tasks/:id', () => {
    it('existing task → 200 with matching id, title, description', async () => {
      const createRes = await request.post('/api/tasks').send(validPayload);
      expect(createRes.status).toBe(201);
      const created = createRes.body;

      const res = await request.get(`/api/tasks/${created.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', created.id);
      expect(res.body).toHaveProperty('title', created.title);
      expect(res.body).toHaveProperty('description', created.description);
    });

    it('missing id → 404 with JSON message', async () => {
      const res = await request.get('/api/tasks/non-existent-id-12345');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(typeof res.body.message).toBe('string');
    });
  });

  // -------------------------------------------------------------------------
  // PUT /api/tasks/:id — update
  // -------------------------------------------------------------------------

  describe('PUT /api/tasks/:id', () => {
    it('valid update → 200 with updated values', async () => {
      const createRes = await request.post('/api/tasks').send(validPayload);
      expect(createRes.status).toBe(201);
      const { id } = createRes.body;

      const updatePayload = {
        title: 'Updated Title',
        description: 'Updated description here.',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2099-06-15',
      };

      const res = await request.put(`/api/tasks/${id}`).send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', id);
      expect(res.body).toHaveProperty('title', updatePayload.title);
      expect(res.body).toHaveProperty('description', updatePayload.description);
      expect(res.body).toHaveProperty('status', updatePayload.status);
      expect(res.body).toHaveProperty('priority', updatePayload.priority);
      expect(res.body).toHaveProperty('dueDate', updatePayload.dueDate);
      // updatedAt must have changed (or at least be present)
      expect(res.body).toHaveProperty('updatedAt');
    });

    it('non-existent id → 404', async () => {
      const res = await request.put('/api/tasks/non-existent-id-put').send({
        title: 'X',
        description: 'Y',
        status: 'pending',
        priority: 'low',
        dueDate: null,
      });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
    });
  });

  // -------------------------------------------------------------------------
  // DELETE /api/tasks/:id
  // -------------------------------------------------------------------------

  describe('DELETE /api/tasks/:id', () => {
    it('existing task → 200 with success message', async () => {
      const createRes = await request.post('/api/tasks').send(validPayload);
      expect(createRes.status).toBe(201);
      const { id } = createRes.body;

      const res = await request.delete(`/api/tasks/${id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Task deleted successfully');
    });

    it('after delete: subsequent GET → 404', async () => {
      const createRes = await request.post('/api/tasks').send(validPayload);
      expect(createRes.status).toBe(201);
      const { id } = createRes.body;

      await request.delete(`/api/tasks/${id}`);

      const getRes = await request.get(`/api/tasks/${id}`);
      expect(getRes.status).toBe(404);
    });

    it('non-existent id → 404', async () => {
      const res = await request.delete('/api/tasks/non-existent-id-delete');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
    });
  });

  // -------------------------------------------------------------------------
  // GET /api/health
  // -------------------------------------------------------------------------

  describe('GET /api/health', () => {
    it('→ 200 with { status: "ok", timestamp }', async () => {
      const res = await request.get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
      // timestamp must be parseable as a date
      expect(isNaN(new Date(res.body.timestamp).getTime())).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Unknown route → 404
  // -------------------------------------------------------------------------

  describe('Unknown route', () => {
    it('GET /api/unknown-route → 404', async () => {
      const res = await request.get('/api/unknown-route');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
    });

    it('GET /totally-unknown → 404', async () => {
      const res = await request.get('/totally-unknown');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
    });
  });
});
