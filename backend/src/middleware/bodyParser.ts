/**
 * Body-parser middleware — parses application/json request bodies.
 * Catches SyntaxErrors thrown by express.json() and forwards a structured 400.
 * Requirements: 6.5, 6.8
 */
import express, { Request, Response, NextFunction } from 'express';

/** Parse JSON bodies. Mount this before syntaxErrorHandler. */
export const jsonParser = express.json();

/**
 * Error-handling middleware that catches the SyntaxError thrown by express.json()
 * when the request body is malformed JSON.
 *
 * Mount immediately after jsonParser in the middleware chain.
 */
export function syntaxErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    res.status(400).json({ message: 'Invalid JSON: ' + err.message });
    return;
  }
  next(err);
}
