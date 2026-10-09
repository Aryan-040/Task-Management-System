/**
 * CORS middleware — sets Access-Control-Allow-Origin to the FRONTEND_URL env var.
 * Requirements: 6.4
 */
import { Request, Response, NextFunction } from 'express';

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Respond to pre-flight requests immediately.
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}
