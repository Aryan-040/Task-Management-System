/**
 * Centralised error-handling middleware.
 *
 * Mapping:
 *   NotFoundError              → 404
 *   SyntaxError with status 400 → 400  (malformed JSON body)
 *   any other Error            → 500
 *
 * Stack trace is stripped from the response body in production
 * (NODE_ENV === 'production') but is always written to console.error.
 *
 * Requirements: 6.3, 6.7
 */
import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../services/taskService';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Always log the full error (including stack) to the server console.
  console.error(err);

  const isProd = process.env.NODE_ENV === 'production';

  // NotFoundError → 404
  if (err instanceof NotFoundError) {
    res.status(404).json({ message: err.message });
    return;
  }

  // SyntaxError with status 400 → malformed JSON body
  if (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as { status: number }).status === 400
  ) {
    res.status(400).json({ message: 'Invalid JSON: ' + err.message });
    return;
  }

  // All other errors → 500
  const body: Record<string, unknown> = {
    message: err.message || 'Internal server error',
  };

  if (!isProd && err.stack) {
    body.stack = err.stack;
  }

  res.status(500).json(body);
}
