# Task Management System

A full-stack task management application built as a TypeScript monorepo. The backend is a Node.js + Express REST API; the frontend is a Next.js 14 (App Router) application. All task data is stored exclusively in backend process memory — no database or external storage is used.

---

## Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm 10+** (bundled with Node 20)

---

## Install Steps

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## Environment Setup

### Backend (`backend/.env`)

Copy the example file and adjust as needed:

```bash
cp backend/.env.example backend/.env
```

| Variable       | Default                   | Description                              |
|----------------|---------------------------|------------------------------------------|
| `PORT`         | `3001`                    | Port the API server listens on           |
| `FRONTEND_URL` | `http://localhost:3000`   | Allowed CORS origin                      |
| `NODE_ENV`     | `development`             | Set to `production` to disable Swagger UI|
| `SEED_DATA`    | _(unset — uses seed)_     | Set to `false` to start with an empty store |

### Frontend (`frontend/.env.local`)

```bash
cp frontend/.env.example frontend/.env.local
```

| Variable              | Default                   | Description             |
|-----------------------|---------------------------|-------------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001`   | Backend API base URL    |

---

## Run Commands

```bash
# Start the backend in development mode (hot-reload)
cd backend
npm run dev

# Start the frontend in development mode
cd frontend
npm run dev
```

The backend listens on **http://localhost:3001** by default.  
The frontend runs on **http://localhost:3000** by default.

---

## API Documentation (Swagger UI)

When the backend is running in development mode (`NODE_ENV !== 'production'`), an interactive Swagger UI is available at:

> **http://localhost:3001/api-docs**

The underlying OpenAPI 3.x specification file is located at [`docs/openapi.yaml`](docs/openapi.yaml).

---

## API Endpoint Table

| Method   | Path                  | Description                              |
|----------|-----------------------|------------------------------------------|
| `GET`    | `/api/health`         | Service health check                     |
| `GET`    | `/api/tasks`          | List tasks (search, filter, sort, paginate) |
| `POST`   | `/api/tasks`          | Create a new task                        |
| `GET`    | `/api/tasks/:id`      | Get a task by ID                         |
| `PUT`    | `/api/tasks/:id`      | Update a task (full replacement)         |
| `DELETE` | `/api/tasks/:id`      | Delete a task                            |

### Query parameters for `GET /api/tasks`

| Parameter   | Type    | Default     | Description                                             |
|-------------|---------|-------------|---------------------------------------------------------|
| `search`    | string  | —           | Case-insensitive substring match on title + description |
| `status`    | enum    | —           | `pending` \| `in_progress` \| `completed`               |
| `priority`  | enum    | —           | `low` \| `medium` \| `high`                             |
| `sortBy`    | enum    | `createdAt` | `createdAt` \| `dueDate` \| `priority` \| `title`       |
| `sortOrder` | enum    | `desc`      | `asc` \| `desc`                                         |
| `page`      | integer | `1`         | 1-indexed page number                                   |
| `pageSize`  | integer | `25`        | Tasks per page (max 100)                                |

---

## Architecture Overview

```
task-management/
├── backend/          Node.js + Express REST API (TypeScript)
│   └── src/
│       ├── controllers/   Thin HTTP handlers — delegate to services
│       ├── middleware/     CORS, body parser, validation, error handler
│       ├── repositories/  In-memory store + seed data
│       ├── routes/        Express Router wiring with per-route middleware
│       ├── services/      Business logic (filter/sort/paginate pipeline)
│       ├── types/         Shared TypeScript interfaces
│       ├── validation/    Zod schemas for request bodies and query params
│       ├── app.ts         Express app factory (injectable service)
│       └── server.ts      HTTP server entry point
├── frontend/         Next.js 14 (App Router) + React + TypeScript
│   └── src/
│       ├── app/           Next.js pages and layouts
│       ├── components/    Shared UI components (shell, navigation)
│       ├── features/      Task-specific components, hooks, and forms
│       ├── lib/api/       Typed API client
│       └── lib/validation/ Client-side Zod schemas
└── docs/
    └── openapi.yaml  OpenAPI 3.x API specification
```

---

## Design Decisions

**In-memory store only** — task data is stored in a JavaScript array held in the backend process. There is no database, no file system writes, and no external storage of any kind. This satisfies the project constraint and keeps the backend dependency-free at runtime.

**Factory pattern for testability** — both the repository (`createTaskRepository`) and the app (`createApp`) are factories that accept their dependencies as arguments. This means tests can inject an empty repository without touching the singleton or the seed data.

**Zod validation at the boundary** — all incoming data is validated with Zod schemas in dedicated middleware before reaching a controller or service. The same schemas are mirrored on the frontend to keep client and server validation rules in sync.

**Swagger UI in development only** — the OpenAPI spec at `docs/openapi.yaml` is served via swagger-ui-express when `NODE_ENV !== 'production'`. This keeps the production bundle clean while giving developers a full interactive explorer in development.

---

## In-Memory Data Limitations

> ⚠️ **Important**: All three of the following constraints apply to this system.

1. **Task data is stored in backend process memory** — the Node.js array that holds all tasks lives only for the lifetime of the backend process.
2. **Task data is not persisted to any external storage** — there is no database, no file, no cache, and no network storage involved.
3. **Task data resets to the seed state whenever the backend process restarts** — stopping and restarting the backend (e.g. after a code change) discards all tasks created during the previous session and restores the five built-in seed tasks.

---

## Test Commands

```bash
# Backend tests (Vitest)
cd backend
npm test

# Backend tests in watch mode
npm run test:watch

# Frontend tests (Vitest + React Testing Library)
cd frontend
npm test

# Frontend tests in watch mode
npm run test:watch
```

---

## Demo Checklist

Use the following steps to verify the system end-to-end after starting both servers:

1. **Create a new task** — click "Create Task" in the top bar, fill in title and description, submit. Expect: task appears in the list, success toast shown.
2. **Edit an existing task** — click the edit icon on any task row, change the title, submit. Expect: task updates in place, success toast shown.
3. **Delete a task with confirmation** — click the delete icon, confirm in the dialog. Expect: confirmation dialog names the task, success toast shown after deletion, task removed from list.
4. **Filter by status and priority** — use the status and priority dropdowns in the filter bar. Expect: active filter badge appears, list narrows to matching tasks.
5. **Search by title and description** — type in the global search box. Expect: list updates after ~300 ms, matching tasks highlighted.
6. **Toggle between list view and Kanban board** — use the Board link in the sidebar. Expect: tasks arranged in Pending / In Progress / Completed columns; drag a card to a new column to update its status.
