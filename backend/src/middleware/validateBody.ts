/**
 * validateBody middleware factory — validates req.body against a Zod schema.
 * On failure returns HTTP 400 with { message, errors: Record<string, string> }.
 * Requirements: 6.5
 */
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        const field = e.path.join('.');
        if (field) errors[field] = e.message;
      });
      res.status(400).json({ message: 'Validation failed', errors });
      return;
    }

    // Replace req.body with the parsed (and coerced) data.
    req.body = result.data;
    next();
  };
}
