/**
 * Task and health controller — thin HTTP handlers.
 * All business logic is delegated to TaskService.
 * No validation logic lives here — that belongs in middleware.
 * Requirements: 4.1, 4.8, 4.9, 4.10, 5.1–5.7, 6.1
 */

import { Request, Response, NextFunction } from 'express';
import type { TaskService } from '../services/taskService';
import type { ListTasksParams, CreateTaskDto, UpdateTaskDto } from '../types';

/**
 * Factory that returns a controller object bound to the given TaskService.
 * Using a factory keeps the service injectable for testing.
 */
export function createTaskController(service: TaskService) {
  return {
    /**
     * GET /api/tasks
     * Extract query params, delegate to service, respond 200.
     */
    async listTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const params: ListTasksParams = {
          search: req.query.search as string | undefined,
          status: req.query.status as ListTasksParams['status'],
          priority: req.query.priority as ListTasksParams['priority'],
          sortBy: req.query.sortBy as ListTasksParams['sortBy'],
          sortOrder: req.query.sortOrder as ListTasksParams['sortOrder'],
          page: req.query.page !== undefined ? Number(req.query.page) : undefined,
          pageSize:
            req.query.pageSize !== undefined ? Number(req.query.pageSize) : undefined,
        };

        const result = service.listTasks(params);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },

    /**
     * GET /api/tasks/:id
     * Delegate to service; service throws NotFoundError when absent.
     */
    async getTask(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const task = service.getTask(req.params.id);
        res.status(200).json(task);
      } catch (err) {
        next(err);
      }
    },

    /**
     * POST /api/tasks
     * Body has already been validated by validateBody middleware.
     * Respond 201 with the created task.
     */
    async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const task = service.createTask(req.body as CreateTaskDto);
        res.status(201).json(task);
      } catch (err) {
        next(err);
      }
    },

    /**
     * PUT /api/tasks/:id
     * Body has already been validated by validateBody middleware.
     * Service throws NotFoundError when the task is absent.
     */
    async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const task = service.updateTask(req.params.id, req.body as UpdateTaskDto);
        res.status(200).json(task);
      } catch (err) {
        next(err);
      }
    },

    /**
     * DELETE /api/tasks/:id
     * Service throws NotFoundError when the task is absent.
     * Respond 200 with a deletion-confirmation message.
     */
    async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        service.deleteTask(req.params.id);
        res.status(200).json({ message: 'Task deleted successfully' });
      } catch (err) {
        next(err);
      }
    },

    /**
     * GET /api/health
     * Synchronous — no async needed.
     * Respond 200 with { status: 'ok', timestamp: <ISO 8601> }.
     */
    healthCheck(_req: Request, res: Response): void {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    },
  };
}
