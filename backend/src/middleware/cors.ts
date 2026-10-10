/**
 * CORS middleware — allows requests from any origin.
 * Updated to support multiple frontend deployments.
 * Requirements: 6.4
 */
import { Request, Response, NextFunction } from 'express';

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Allow all origins (useful for demos and multiple frontend deployments)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Respond to pre-flight requests immediately.
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}
