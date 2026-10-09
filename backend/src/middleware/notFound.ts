/**
 * 404 catch-all middleware — responds with HTTP 404 for any unmatched route.
 * Requirements: 6.2
 */
import { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
}
