/**
 * HTTP server entry point.
 * Reads PORT from the environment (default 3001) and starts the server.
 * Requirements: 6.6, 6.9
 */

// Load .env before any other import so all modules see the env vars.
import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { taskRepository } from './repositories/taskRepository';
import { createTaskService } from './services/taskService';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

const service = createTaskService(taskRepository);
const app = createApp(service);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
