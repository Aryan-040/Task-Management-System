/**
 * Express application factory.
 * Returns a fully configured Express app for a given TaskService instance.
 * Using a factory keeps the server logic separate from the app setup,
 * making the app easy to test in isolation.
 * Requirements: 6.4, 6.5, 6.6, 8.1
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import type { TaskService } from './services/taskService';
import { corsMiddleware } from './middleware/cors';
import { jsonParser, syntaxErrorHandler } from './middleware/bodyParser';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import { createTaskRoutes } from './routes/taskRoutes';

export function createApp(service: TaskService): express.Express {
  const app = express();

  // 1. CORS — must come first so pre-flight responses include the right headers.
  app.use(corsMiddleware);

  // 2. Body parsing — jsonParser then syntaxErrorHandler to catch malformed JSON
  //    before any route handler sees it (Req 6.5, 6.8).
  app.use(jsonParser);
  // syntaxErrorHandler is a 4-argument error handler; Express recognises it by
  // arity and only invokes it when jsonParser calls next(err).
  app.use(syntaxErrorHandler as express.ErrorRequestHandler);

  // 3. Swagger UI — served only in non-production environments (Req 8.1).
  //    Accessible at /api-docs.
  if (process.env.NODE_ENV !== 'production') {
    // js-yaml is a transitive dependency of swagger-jsdoc (already installed).
    // Dynamic require avoids the need for @types/js-yaml in devDependencies.
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const jsYaml = require('js-yaml') as { load(s: string): any };
    const specPath = path.resolve(__dirname, '../../docs/openapi.yaml');

    let swaggerSpec: Record<string, unknown> = {};
    try {
      swaggerSpec = jsYaml.load(fs.readFileSync(specPath, 'utf8')) as Record<string, unknown>;
    } catch (err) {
      // Non-fatal: Swagger UI will render an empty spec if the file is missing.
      console.warn('[swagger] Could not load OpenAPI spec from', specPath, ':', (err as Error).message);
    }

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  // 4. API routes — all task and health endpoints are scoped under /api.
  app.use('/api', createTaskRoutes(service));

  // 5. 404 catch-all — must come after all real routes (Req 6.2).
  app.use(notFoundHandler);

  // 6. Centralised error handler — must be last (Req 6.3, 6.7).
  app.use(errorHandler);

  return app;
}
