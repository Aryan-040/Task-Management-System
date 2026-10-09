/**
 * Task route definitions.
 * Registers all /api/* routes with their per-route middleware.
 * Requirements: 6.6, 6.9
 */

import { Router } from 'express';
import type { TaskService } from '../services/taskService';
import { createTaskController } from '../controllers/taskController';
import { validateBody } from '../middleware/validateBody';
import { validateQuery } from '../middleware/validateQuery';
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  ListTasksQuerySchema,
} from '../validation/taskSchemas';

/**
 * Returns an Express Router with all task and health routes wired up.
 * Mount at /api in app.ts, e.g. app.use('/api', createTaskRoutes(service)).
 */
export function createTaskRoutes(service: TaskService): Router {
  const router = Router();
  const ctrl = createTaskController(service);

  // Health check — no authentication or validation needed.
  router.get('/health', ctrl.healthCheck.bind(ctrl));

  // Task collection endpoints.
  router.get('/tasks', validateQuery(ListTasksQuerySchema), ctrl.listTasks.bind(ctrl));
  router.post('/tasks', validateBody(CreateTaskSchema), ctrl.createTask.bind(ctrl));

  // Individual task endpoints.
  router.get('/tasks/:id', ctrl.getTask.bind(ctrl));
  router.put('/tasks/:id', validateBody(UpdateTaskSchema), ctrl.updateTask.bind(ctrl));
  router.delete('/tasks/:id', ctrl.deleteTask.bind(ctrl));

  return router;
}
