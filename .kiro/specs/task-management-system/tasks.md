# Implementation Plan: Task Management System

## Overview

Full-stack TypeScript monorepo with a Next.js 14 (App Router) frontend and a Node.js/Express backend. All task data lives in backend process memory only. Implementation proceeds bottom-up: monorepo scaffolding and shared types → backend data layer (seed data, repository) → backend business logic (validation, service) → backend HTTP layer (middleware, controllers, routes, docs) → backend tests → frontend setup and providers → frontend data layer (API client, Zod schemas, TanStack Query hooks, URL state) → frontend UI (shell, task components, pages) → frontend tests → documentation.

## Tasks

- [x] 1. Initialize monorepo structure and shared types
  - [x] 1.1 Scaffold root monorepo layout and environment files
    - Create root directories: `frontend/`, `backend/`, `docs/`
    - Add root `.gitignore` excluding `node_modules/`, `dist/`, `build/`, `.env*`, `.DS_Store`, `Thumbs.db`
    - Create `backend/.env.example` with `PORT`, `FRONTEND_URL`, `NODE_ENV`, `SEED_DATA`
    - Create `frontend/.env.example` with `NEXT_PUBLIC_API_URL`
    - _Requirements: 1.1, 1.5, 1.7, 1.8_

  - [x] 1.2 Define shared TypeScript interfaces and types for the backend
    - Create `backend/src/types/index.ts` exporting: `Task`, `TaskStatus`, `TaskPriority`, `CreateTaskDto`, `UpdateTaskDto`, `PaginatedTasksResponse`, `ApiErrorBody`, `HealthResponse`, `ListTasksParams`
    - Align field shapes exactly to the data model: `id` (string, max 128), `title` (string), `description` (string), `status` (union), `priority` (union), `dueDate` (string | null), `createdAt` (string), `updatedAt` (string)
    - _Requirements: 2.1_

- [x] 2. Backend — Seed data and in-memory repository
  - [x] 2.1 Implement seed data module
    - Create `backend/src/repositories/seedData.ts` exporting `SEED_TASKS: Task[]`
    - Include at least 5 pre-constructed tasks: one per status (`pending`, `in_progress`, `completed`), one per priority (`low`, `medium`, `high`), one with a past `dueDate`, one with a future `dueDate`, one with `dueDate: null`
    - _Requirements: 3.2, 28.1, 28.2_

  - [x] 2.2 Implement task repository with factory pattern
    - Create `backend/src/repositories/taskRepository.ts`
    - Export `createTaskRepository(initial?: Task[]): TaskRepository` factory and default singleton `taskRepository` (uses seed data)
    - Implement `findAll`, `findById`, `create`, `update`, `delete`, `reset` on the `TaskRepository` interface
    - Generate IDs with `crypto.randomUUID()`; set `createdAt` and `updatedAt` to current server timestamp on create; update only `updatedAt` on modify; ignore any client-supplied `id`, `createdAt`, or `updatedAt`
    - Read `SEED_DATA` env var — when `'false'`, initialize the store with an empty array
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 3.1, 3.3, 3.5_

  - [x]* 2.3 Write property test for Task ID Uniqueness
    - **Property 1: Task ID Uniqueness**
    - **Validates: Requirements 2.2**
    - Use `fc.array(createDtoArb, { minLength: 1, maxLength: 50 })` to drive N sequential creates; assert all resulting IDs are pairwise distinct

  - [x]* 2.4 Write property test for Timestamp Invariant
    - **Property 2: Timestamp Invariant**
    - **Validates: Requirements 2.3, 2.4**
    - Assert `createdAt === updatedAt` immediately after create; after each update assert `new updatedAt >= original createdAt` and `new updatedAt >= previous updatedAt`

  - [x]* 2.5 Write property test for Server-Generated Fields Override
    - **Property 3: Server-Generated Fields Override Client-Supplied Values**
    - **Validates: Requirements 2.5**
    - Submit create DTOs augmented with arbitrary `id`, `createdAt`, `updatedAt` fields; assert the persisted task's `id`, `createdAt`, and `updatedAt` all differ from the client-supplied values

- [x] 3. Backend — Zod validation schemas
  - [x] 3.1 Implement request validation schemas
    - Create `backend/src/validation/taskSchemas.ts` with `CreateTaskSchema`, `UpdateTaskSchema`, `ListTasksQuerySchema`
    - Implement `isValidCalendarDate(s: string): boolean` helper used by the `dueDate` `.refine()` call
    - Enforce: title/description trimmed and non-empty (min 1 after trim, max 255/1000); valid `status` enum; valid `priority` enum; `dueDate` must match `/^\d{4}-\d{2}-\d{2}$/` and pass calendar validity (e.g. rejects Feb 30); fields are nullable/optional as designed
    - Produce the validation error shape `{ message, errors: Record<string, string> }` on failure
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [x]* 3.2 Write property test for Whitespace-Only Input Rejection (server-side)
    - **Property 8: Whitespace-Only Input Rejected by Both Validators (server-side)**
    - **Validates: Requirements 7.1, 7.2**
    - Use `fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'))` as `title` and as `description`; assert `CreateTaskSchema.safeParse` fails with a field-level error on the targeted field

  - [x]* 3.3 Write property test for Invalid Enum Values Rejection (server-side)
    - **Property 9: Invalid Enum Values Rejected (server-side)**
    - **Validates: Requirements 7.3, 7.4**
    - Use `fc.string().filter(s => !['pending','in_progress','completed'].includes(s))` for `status`; use `fc.string().filter(s => !['low','medium','high'].includes(s))` for `priority`; assert schema rejects with field-level errors naming the invalid value

  - [x]* 3.4 Write property test for Invalid Calendar Dates Rejection (server-side)
    - **Property 10: Invalid Calendar Dates Rejected (server-side)**
    - **Validates: Requirements 7.5**
    - Use `invalidDateArb` (non-`YYYY-MM-DD` strings and logically invalid dates like Feb 30, month 13); assert `CreateTaskSchema` rejects; use a valid-date generator (dates between 2020-01-01 and 2030-12-31 via `fc.date().map(d => d.toISOString().slice(0,10))`) and assert acceptance

  - [x]* 3.5 Write property test for Stored Strings Trimmed (server-side)
    - **Property 11: Stored Strings Are Always Trimmed**
    - **Validates: Requirements 7.7**
    - Generate valid title/description strings; prepend and append arbitrary whitespace; submit to `createTask`; assert `task.title === input.title.trim()` and `task.description === input.description.trim()`

- [x] 4. Backend — Service layer with filter/sort/paginate pipeline
  - [x] 4.1 Implement TaskService
    - Create `backend/src/services/taskService.ts` exporting `TaskService` interface and `createTaskService(repo: TaskRepository): TaskService` factory
    - Define `NotFoundError` domain error class (extends `Error`)
    - Implement `listTasks` with the pipeline: search (case-insensitive substring on `title` + `description`) → status filter → priority filter → stable sort (priority weight: `{ low: 0, medium: 1, high: 2 }`; default: `createdAt desc`) → paginate (default page 1, pageSize 25); return `{ data, total, page, pageSize }`
    - Implement `getTask` (throws `NotFoundError` when absent), `createTask`, `updateTask` (throws `NotFoundError`), `deleteTask` (throws `NotFoundError`)
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x]* 4.2 Write property test for Search Filter Correctness
    - **Property 4: Search Filter Correctness**
    - **Validates: Requirements 4.2**
    - For arbitrary task collections and arbitrary non-empty search strings, assert every returned task's `title` or `description` contains the query (case-insensitive); assert no task in the store whose title/description matches is absent from the result

  - [x]* 4.3 Write property test for Status and Priority Filter Correctness
    - **Property 5: Status and Priority Filter Correctness**
    - **Validates: Requirements 4.3, 4.4**
    - For arbitrary task collections and valid `status`/`priority` filter values, assert all returned tasks match the filter value exactly; assert no task satisfying the criterion is absent from the result

  - [x]* 4.4 Write property test for Sort Ordering Invariant
    - **Property 6: Sort Ordering Invariant**
    - **Validates: Requirements 4.5, 4.6**
    - For all four `sortBy` values and both `sortOrder` directions, assert every adjacent pair in the result satisfies the expected ordering relation for that field and direction; verify stable sort for tasks with equal sort-key values

  - [x]* 4.5 Write property test for Pagination Slice Correctness
    - **Property 7: Pagination Slice Correctness**
    - **Validates: Requirements 4.7, 14.1, 14.2**
    - For arbitrary page (≥1) and pageSize (1–100), assert `data` contains exactly the tasks at positions `(page-1)*pageSize` through `page*pageSize-1` of the fully filtered+sorted collection; assert `total` equals the pre-pagination count; assert echoed `page` and `pageSize` match the request

  - [x]* 4.6 Write property test for Composed Filters
    - **Property 12: Composed Filters Satisfy All Active Criteria Simultaneously**
    - **Validates: Requirements 4.2, 4.3, 4.4, 13.6**
    - For arbitrary combinations of active `search`, `status`, and `priority` params in a single `listTasks` call, assert every returned task satisfies all active criteria simultaneously; assert no task passing all criteria is omitted

- [x] 5. Backend — Middleware stack
  - [x] 5.1 Implement all middleware modules
    - Create `backend/src/middleware/cors.ts` — set `Access-Control-Allow-Origin` to `FRONTEND_URL` env var value
    - Create `backend/src/middleware/bodyParser.ts` — parse `application/json`; catch `SyntaxError` from body-parser and forward a structured 400 response
    - Create `backend/src/middleware/validateBody.ts` — factory accepting a Zod schema; Zod-parse `req.body`; on failure return 400 with `{ message: 'Validation failed', errors: Record<string, string> }`
    - Create `backend/src/middleware/validateQuery.ts` — same pattern applied to `req.query`
    - Create `backend/src/middleware/notFound.ts` — 404 catch-all for any unmatched route
    - Create `backend/src/middleware/errorHandler.ts` — map `NotFoundError` → 404, `ValidationError` → 400, `SyntaxError` with `.status === 400` → 400, all other errors → 500; strip `stack` from response body when `NODE_ENV === 'production'`; write full error to `console.error` always
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.7, 6.8_

- [x] 6. Backend — Controllers, routes, and API documentation
  - [x] 6.1 Implement task and health controllers
    - Create `backend/src/controllers/taskController.ts` with thin handler functions: `listTasks`, `getTask`, `createTask`, `updateTask`, `deleteTask`, `healthCheck`
    - Extract validated params from `req.query` / `req.params` / `req.body`; delegate entirely to `TaskService`; set status codes: 201 on create, 200 on read/update/delete, 200 with `{ status: 'ok', timestamp: new Date().toISOString() }` on health
    - No business logic in controllers
    - _Requirements: 4.1, 4.8, 4.9, 4.10, 5.1–5.7, 6.1_

  - [x] 6.2 Wire Express app factory and HTTP server
    - Create `backend/src/routes/taskRoutes.ts` defining all route registrations with per-route middleware: `GET /api/health`, `GET /api/tasks` (validateQuery), `POST /api/tasks` (validateBody CreateTaskSchema), `GET /api/tasks/:id`, `PUT /api/tasks/:id` (validateBody UpdateTaskSchema), `DELETE /api/tasks/:id`
    - Create `backend/src/app.ts` as `createApp(service: TaskService): Express` factory applying CORS, bodyParser, routes, notFound, errorHandler middleware
    - Create `backend/src/server.ts` reading `PORT` from env (default `3001`) and starting the HTTP server; log port on listen
    - _Requirements: 6.6, 6.9_

  - [x] 6.3 Create OpenAPI specification and configure Swagger UI
    - Write `docs/openapi.yaml` in OpenAPI 3.x format; document all 6 endpoints (`GET /api/health`, `GET /api/tasks`, `POST /api/tasks`, `GET /api/tasks/:id`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`) with request parameter/body schemas, at least one success and one error response schema per endpoint, and at least one request+response example per endpoint
    - Configure `swagger-jsdoc` + `swagger-ui-express` in `app.ts` (development mode only); serve at `/api-docs`; mention the path in README
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 7. Backend — Tests
  - [x] 7.1 Configure backend test infrastructure
    - Create `backend/vitest.config.ts` with `environment: 'node'` and `globals: true`
    - Create `backend/src/test/helpers.ts` exporting `createTestApp()` that instantiates `createTaskRepository([])` → `createTaskService(repo)` → `createApp(service)` for a fully isolated test instance
    - Create `backend/src/test/setup.ts` calling `repo.reset([])` in a `beforeEach` to ensure per-test store isolation
    - _Requirements: 25.8_

  - [x] 7.2 Write backend unit tests for service and validation
    - Create `backend/src/services/taskService.test.ts` covering: empty store returns `{ data: [], total: 0 }`; create returns server-generated `id`/`createdAt`/`updatedAt`; client-supplied `id`/`createdAt`/`updatedAt` are ignored; getTask found/not-found; updateTask found/not-found; deleteTask found/not-found; listTasks with search, status filter, priority filter, sort by `createdAt`, pagination
    - Create `backend/src/validation/taskSchemas.test.ts` covering: absent title/description → 400; whitespace-only → 400; invalid status/priority enum → 400; invalid `dueDate` format → 400; valid full payload → passes; multi-field errors returned in single response
    - _Requirements: 25.1–25.11_

  - [x] 7.3 Write backend integration tests with Supertest
    - Create `backend/src/routes/tasks.test.ts` using `createTestApp()` and `supertest`
    - Cover: `POST /api/tasks` valid → 201 with all 8 fields; `GET /api/tasks` → 200 array; empty store → empty array; `GET /api/tasks/:id` existing → 200 matching fields; `GET /api/tasks/:id` missing → 404 JSON error; `POST /api/tasks` missing fields → 400 per-field errors; `PUT /api/tasks/:id` valid → 200 updated values; `DELETE /api/tasks/:id` → 200; subsequent `GET` → 404; `PUT` not-found → 404; `DELETE` not-found → 404; `GET /api/health` → 200 `{ status: 'ok' }`; unknown route → 404; malformed JSON body → 400
    - _Requirements: 25.1–25.11, 6.1, 6.2, 6.8_

- [x] 8. Checkpoint — Run backend tests
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 9. Frontend — Project setup and providers
  - [x] 9.1 Initialize Next.js 14 frontend with all dependencies
    - Scaffold `frontend/` with Next.js 14 (App Router), TypeScript 5, Tailwind CSS, shadcn/ui
    - Install: TanStack Query v5, React Hook Form v7, Zod v3, @dnd-kit/core, Lucide icons
    - Create `frontend/vitest.config.ts` with `environment: 'jsdom'`, `globals: true`, and the Vite React plugin
    - Create `frontend/src/test/setup.ts` importing `@testing-library/jest-dom` for extended matchers
    - Add `dev`, `build`, `lint`, `typecheck`, `test` scripts to `frontend/package.json`
    - _Requirements: 1.2, 27.1_

  - [x] 9.2 Implement QueryClientProvider and ThemeProvider
    - Create `frontend/src/providers/ThemeProvider.tsx`: on mount read `localStorage.getItem('theme')`; fall back to `window.matchMedia('(prefers-color-scheme: dark)').matches`; apply/remove `dark` class on `document.documentElement`; on toggle flip, write to `localStorage` (catch block for unavailable storage), update class
    - Create `frontend/src/providers/index.tsx` composing `QueryClientProvider` (TanStack Query) and `ThemeProvider` as the root provider tree
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 10. Frontend — API client and client-side validation
  - [x] 10.1 Implement typed API client
    - Create `frontend/src/lib/api/tasks.ts` with `ApiError extends Error` (fields: `status: number`, `message: string`, `errors?: Record<string, string>`)
    - Implement internal `request<T>` helper reading base URL from `process.env.NEXT_PUBLIC_API_URL`; reject with `ApiError` on any non-2xx response
    - Export `tasksApi` object: `list(params)`, `get(id)`, `create(dto)`, `update(id, dto)`, `delete(id)` — all typed against the interfaces from the backend types
    - _Requirements: 21.1, 21.2, 21.5, 21.6_

  - [x] 10.2 Implement client-side Zod validation schema
    - Create `frontend/src/lib/validation/taskSchema.ts` with `taskFormSchema` and exported `TaskFormValues` type
    - Enforce: `title` non-empty after trim, max 255; `description` non-empty after trim, max 1000; `status` enum; `priority` enum; `dueDate` optional/nullable with `YYYY-MM-DD` regex and `isValidCalendarDate` refinement
    - Implement `isValidCalendarDate(s: string): boolean` helper (same logic as server-side)
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8_

  - [x]* 10.3 Write property test for client-side Whitespace Rejection
    - **Property 8: Whitespace-Only Input Rejected by Both Validators (client-side)**
    - **Validates: Requirements 20.3, 20.4**
    - Create `frontend/src/lib/validation/taskSchema.property.test.ts`; use `fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'))` as `title` and `description`; assert `taskFormSchema.safeParse` fails with a field-level issue on the tested field; run ≥100 iterations

  - [x]* 10.4 Write property test for client-side Invalid Calendar Dates
    - **Property 10: Invalid Calendar Dates Rejected (client-side)**
    - **Validates: Requirements 20.7**
    - In the same property test file; use `invalidDateArb` to assert `taskFormSchema` rejects invalid dates; use a valid-date generator to assert acceptance; run ≥100 iterations

- [x] 11. Frontend — TanStack Query hooks and URL state
  - [x] 11.1 Implement TanStack Query data hooks
    - Create `frontend/src/features/tasks/hooks/useTasks.ts`
    - Export `taskKeys` factory: `all()`, `lists()`, `list(params)`, `detail(id)`
    - Export hooks: `useTaskList(params)` (`staleTime: 30_000`), `useTask(id)` (`staleTime: 60_000`), `useCreateTask()` (on success: invalidate `taskKeys.lists()`), `useUpdateTask()` (on success: invalidate `taskKeys.lists()` + `taskKeys.detail(id)`), `useDeleteTask()` (on success: invalidate `taskKeys.lists()`)
    - _Requirements: 21.3, 21.4_

  - [x] 11.2 Implement URL state hook for task filters
    - Create `frontend/src/features/tasks/hooks/useTaskFilters.ts` using Next.js `useSearchParams` + `useRouter`
    - Expose typed getters and setters for: `search`, `status`, `priority`, `sortBy`, `sortOrder`, `page`, `pageSize`; reset `page` to 1 on any filter/sort/search change; expose `clearAll()` and `isFiltered: boolean`; return a serialized `ListTasksParams` object ready for use as a TanStack Query key
    - _Requirements: 13.1, 13.4, 13.8, 13.9, 14.2, 14.3, 14.5, 14.6_

- [x] 12. Frontend — Application shell
  - [x] 12.1 Implement AppShell, Sidebar, TopBar, and DrawerMenu
    - Create `frontend/src/components/shell/Sidebar.tsx` — persistent `<nav>` at ≥768 px with brand logo, product name, and four `NavLink` items; active item styled distinctly using `usePathname()`
    - Create `frontend/src/components/shell/DrawerMenu.tsx` — collapsible slide-in panel at <768 px; on open: move focus to first NavLink; Tab/Shift-Tab cycle inside panel only (focus trap); Escape key closes; on close: return focus to hamburger toggle button
    - Create `frontend/src/components/shell/TopBar.tsx` — debounced `GlobalSearchInput` (300 ms, updates `?search=` URL param); `ThemeToggle` icon button with `aria-label`; `CreateTaskButton` that opens `TaskFormDialog` in create mode
    - Create `frontend/src/components/shell/AppShell.tsx` — compose all parts; use `<header>`, `<nav>`, `<main>` semantic landmarks for each shell region
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 23.2, 23.6, 23.7, 23.8_

- [x] 13. Frontend — Task feature components
  - [x] 13.1 Implement TaskForm and TaskFormDialog
    - Create `frontend/src/features/tasks/components/TaskForm.tsx` — React Hook Form v7 with `taskFormSchema` (Zod resolver); fields: title (max 255), description (max 1000), status `<select>`, priority `<select>`, dueDate input; support create mode (blank defaults: status `pending`, priority `medium`) and edit mode (pre-populated values); disable submit button while API call in flight; display field-level error messages beneath each field via `aria-describedby`
    - Create `frontend/src/features/tasks/components/TaskFormDialog.tsx` — `role="dialog"`, `aria-labelledby` pointing to dialog title; focus trap (Tab/Shift-Tab cycle inside); Escape closes; on 201/200 success: close, show success Toast (≥5 s shown only after API confirms), invalidate cache; on 400: show server field-level errors inline, re-enable submit, keep form open; on network error: show error Toast (≥3 s), re-enable submit, keep form open with user values intact
    - _Requirements: 16.1–16.8, 17.1–17.5, 20.8, 23.3_

  - [x] 13.2 Implement DeleteConfirmDialog and TaskDetailView
    - Create `frontend/src/features/tasks/components/DeleteConfirmDialog.tsx` — modal naming the specific task to be deleted; disable confirm button while delete in progress; on 200: close dialog, success Toast ≥3 s, remove task from list; on 404: error Toast ≥3 s, refresh task list from server; on other errors / network error: error Toast ≥3 s, leave task in list; cancel button closes dialog without side effects
    - Create `frontend/src/features/tasks/components/TaskDetailView.tsx` — read-only modal showing all task fields without truncation; format `createdAt`/`updatedAt` with `Intl.DateTimeFormat` including year, month, day, hour, minute; display 'No due date' when `dueDate` is null; provide Edit button (opens `TaskFormDialog` in edit mode) and Delete button (opens `DeleteConfirmDialog`)
    - _Requirements: 18.1–18.6, 19.1–19.5_

  - [x] 13.3 Implement filter, sort, pagination controls, and status indicators
    - Create `frontend/src/features/tasks/components/FilterBar.tsx` — status `<select>` (all / pending / in_progress / completed) and priority `<select>` (all / low / medium / high) wired to `useTaskFilters` setters
    - Create `frontend/src/features/tasks/components/SortControls.tsx` — four sort-field `<button>` elements; visually indicate active field and direction; toggle direction when the active field is clicked again (`setSortBy` toggles internally)
    - Create `frontend/src/features/tasks/components/PaginationControls.tsx` — prev / page-number / next buttons; page-size `<select>` with exactly the values 10, 25, 50; reset to page 1 when page size changes
    - Create `frontend/src/features/tasks/components/ActiveFilterBadge.tsx` — render only when `isFiltered` is true; clicking calls `clearAll()`
    - Create `frontend/src/features/tasks/components/OverdueLabel.tsx` — text + icon (not color-only) for tasks where `dueDate < today` and `status ≠ completed`
    - Create `frontend/src/features/tasks/components/DueSoonLabel.tsx` — text + icon (not color-only) for tasks where `dueDate` is within 48 hours and `status ≠ completed`
    - _Requirements: 12.3, 12.4, 12.5, 12.6, 13.2, 13.3, 13.4, 13.5, 13.7, 13.8, 14.1, 14.4_

  - [x] 13.4 Implement TaskTable and TaskTableRow
    - Create `frontend/src/features/tasks/components/TaskTable.tsx` — `<table>` with `<th>` column headers: Title, Description, Status, Priority, Due Date, Actions; wire to `useTaskList` result; show `OverdueLabel`/`DueSoonLabel` in the due date cell
    - Create `frontend/src/features/tasks/components/TaskTableRow.tsx` — one `<tr>` per task; description truncated to ≤100 characters; status badge with `aria-label='Status: ...'`; priority badge with `aria-label='Priority: ...'`; format dates as 'Jan 15, 2025' using `Intl.DateTimeFormat`; show 'No due date' when null; icon-only edit/view/delete `<button>` elements each with a descriptive `aria-label`
    - _Requirements: 12.1, 12.3, 12.4, 12.5, 12.6, 23.3, 23.4, 23.5_

  - [x] 13.5 Implement KanbanBoard, KanbanColumn, and KanbanCard
    - Create `frontend/src/features/tasks/components/KanbanBoard.tsx` — `DndContext` with `PointerSensor` + `KeyboardSensor` (for accessibility); implement `handleDragEnd`: no-op on same column; perform optimistic status update; call `useUpdateTask`; on failure: revert to original column and show error Toast (≥3 s)
    - Create `frontend/src/features/tasks/components/KanbanColumn.tsx` — `useDroppable` with droppable id equal to the column's `TaskStatus` value; column headers 'Pending', 'In Progress', 'Completed'; show empty state with Create Task CTA when no tasks in column; show loading indicator while board data is fetching
    - Create `frontend/src/features/tasks/components/KanbanCard.tsx` — `useDraggable`; display task title, priority chip ('Low'/'Medium'/'High'), due date (or 'No due date')
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

- [x] 14. Frontend — Pages and root layout
  - [x] 14.1 Implement root layout and root redirect
    - Create `frontend/src/app/layout.tsx` — wrap every page with the provider tree and `AppShell`; include all providers from `src/providers/`
    - Create `frontend/src/app/page.tsx` — redirect to `/overview` using Next.js `redirect()`
    - _Requirements: 9.3_

  - [x] 14.2 Implement Dashboard (Overview) page
    - Create `frontend/src/app/overview/page.tsx` — display metric cards (total task count, completed count, in-progress count, overdue count, completion rate %); display task list with title, short description, status, priority, due date, created date
    - Overdue logic: `dueDate < today AND status ≠ 'completed'`; calculate all metrics from the same `useTaskList` response
    - While loading: show Skeleton placeholders for cards and list; on error: replace Skeleton with error message + Retry button (`ref.focus()` on render); when store is empty: show first-run empty state with Create Task CTA
    - _Requirements: 11.1–11.6, 22.1–22.5_

  - [x] 14.3 Implement All Tasks page
    - Create `frontend/src/app/tasks/page.tsx` — compose `useTaskFilters`, `useTaskList(params)`, `TaskTable`, `FilterBar`, `SortControls`, `PaginationControls`, `ActiveFilterBadge` into a single page; pass all params from `useTaskFilters` into `useTaskList` as a single API request
    - While loading: Skeleton loaders; on error: error message + Retry button; when `total === 0` and no filters active: first-run empty state; when `total === 0` and filters active: 'No tasks match your current filters'
    - _Requirements: 12.1, 12.2, 13.1–13.9, 14.1–14.6, 22.1–22.5_

  - [x] 14.4 Implement Kanban Board page and Settings page
    - Create `frontend/src/app/board/page.tsx` — call `useTaskList` (no pagination, request all tasks); pass result to `KanbanBoard`; show loading indicator while fetching; on error: error message + Retry button
    - Create `frontend/src/app/settings/page.tsx` — placeholder page with Settings heading (navigable from sidebar)
    - _Requirements: 15.1–15.8_

- [x] 15. Frontend — Tests
  - [x] 15.1 Write frontend validation unit tests
    - Create `frontend/src/lib/validation/taskSchema.test.ts`
    - Cover: empty title fails; whitespace-only title fails; title ≤255 passes; title >255 fails; empty description fails; whitespace-only description fails; description ≤1000 passes; description >1000 fails; valid status/priority enum values pass; invalid enum values fail; valid `YYYY-MM-DD` date passes; invalid calendar date (e.g. `2025-02-30`) fails
    - _Requirements: 26.1, 26.2_

  - [x]* 15.2 Write additional frontend property tests for taskFormSchema
    - **Property 8 (client-side) and Property 10 (client-side)** — if not already fully covered in 10.3/10.4
    - **Validates: Requirements 20.3, 20.7**
    - Confirm ≥100 iterations are run for each property; consolidate into `taskSchema.property.test.ts`

  - [x] 15.3 Write frontend component tests
    - Create component test files using Vitest + React Testing Library; mock `tasksApi` with `vi.mock`
    - 26.1: submit `TaskForm` with whitespace-only title → validation error message visible for title field
    - 26.2: submit `TaskForm` with whitespace-only description → validation error message visible for description field
    - 26.3: task list API in pending state → Skeleton loader elements visible in list region
    - 26.4: task list API returns empty array → empty state element visible
    - 26.5: task list API call fails → error state element and Retry button visible
    - 26.6: delete action button clicked → `DeleteConfirmDialog` visible
    - 26.7: cancel button in `DeleteConfirmDialog` clicked → dialog dismissed, task still present in list
    - Additional: `ThemeProvider` toggle applies `dark` class to `<html>` and persists to `localStorage`; `useTaskFilters` resets `page` to 1 when any filter changes; `clearAll()` resets all params; success Toast appears only after API responds (not optimistically)
    - _Requirements: 26.1–26.7_

- [x] 16. Write project README
  - [x] 16.1 Create root README.md
    - Include dedicated sections for: prerequisites (Node 20, npm/yarn), install steps, environment variable setup (both packages), run commands (dev server for each package), architecture overview, design decisions (in-memory only, factory pattern for testability), API endpoint table, test commands
    - State all three in-memory limitations: (1) task data stored in backend process memory, (2) not persisted to any external storage, (3) resets to seed state on backend restart
    - Include demo checklist: create a new task, edit an existing task, delete a task with confirmation, filter by status and priority, search by title and description, toggle between list view and Kanban board — with expected visible UI elements confirming each step
    - _Requirements: 1.6, 3.4, 28.4, 28.5_

- [x] 17. Final checkpoint — Verify full system
  - Ensure all frontend and backend tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; they cover property-based and additional unit tests
- Each task references specific requirements for traceability
- Checkpoints (tasks 8 and 17) are not in the dependency graph — they are manual verification steps
- The backend uses a factory pattern (`createTaskRepository`, `createTaskService`, `createApp`) throughout to enable per-test isolation without restarting the process
- Property tests use `fast-check` and run a minimum of 100 iterations each; annotate each test with `// Feature: task-management-system, Property N: <text>`
- Tasks 10.3 and 10.4 create the property test file; task 15.2 extends it if coverage gaps remain

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "9.1"] },
    { "id": 2, "tasks": ["2.1", "3.1", "10.1", "10.2"] },
    { "id": 3, "tasks": ["2.2", "9.2", "10.3", "10.4", "15.1", "15.2"] },
    { "id": 4, "tasks": ["2.3", "2.4", "2.5", "3.2", "3.3", "3.4", "3.5", "7.1", "11.1", "11.2"] },
    { "id": 5, "tasks": ["4.1", "5.1", "12.1"] },
    { "id": 6, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.6", "6.1", "7.2", "13.1", "13.3", "13.5"] },
    { "id": 7, "tasks": ["6.2", "13.2", "13.4", "14.1"] },
    { "id": 8, "tasks": ["6.3", "7.3", "14.4"] },
    { "id": 9, "tasks": ["14.2", "14.3", "16.1"] },
    { "id": 10, "tasks": ["15.3"] }
  ]
}
```
