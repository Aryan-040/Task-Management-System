# Requirements Document

## Introduction

A Premium Task Management System built as a full-stack monorepo application. The system provides a polished, production-quality SaaS-style experience for creating, managing, tracking, and organizing tasks. The frontend is a Next.js + React + TypeScript application; the backend is a separate Node.js + Express + TypeScript REST API. All task data lives exclusively in backend process memory — no database, no browser persistence, no external storage. The application supports full CRUD operations, Kanban and list/table views, real-time search and filtering, and a rich accessible UI.

## Glossary

- **System**: The complete task management application (frontend + backend together)
- **Frontend**: The Next.js + React + TypeScript application served to the browser
- **Backend**: The Node.js + Express + TypeScript REST API server
- **API**: The RESTful HTTP interface exposed by the Backend
- **Task**: A unit of work with fields: id, title, description, status, priority, dueDate, createdAt, updatedAt
- **Store**: The in-memory array/object in the Backend process that holds all Task records
- **Repository**: The Backend module that reads from and writes to the Store
- **Controller**: The Backend module that handles HTTP request/response logic
- **Service**: The Backend module that contains business logic between Controller and Repository
- **Validator**: The module (client or server) that checks field values against rules before processing
- **Dashboard**: The Overview page showing summary statistics and a task list
- **Board**: The Kanban view displaying tasks in Pending, In Progress, and Completed columns
- **Sidebar**: The persistent left navigation panel on desktop viewports
- **TopBar**: The horizontal bar at the top of each page containing the page title, search, theme toggle, and Create Task action
- **Toast**: A transient non-blocking notification shown after an operation completes
- **Skeleton**: A placeholder UI component shown in place of content while data is loading
- **Seed Data**: A fixed set of example Tasks pre-loaded into the Store on Backend startup
- **OpenAPI_Spec**: The machine-readable API description document in OpenAPI 3.x format

---

## Requirements

### Requirement 1: Monorepo Project Structure

**User Story:** As a developer, I want a clearly organized monorepo, so that I can navigate, develop, and maintain the frontend and backend independently.

#### Acceptance Criteria

1. THE System SHALL organize source code under a root directory containing `frontend/`, `backend/`, and `docs/` subdirectories.
2. THE Frontend SHALL be structured with subdirectories: `src/app/` for routes and layouts, `src/components/` for shared UI and task components, `src/features/tasks/` for task-specific UI and hooks, `src/lib/api/` for the typed API client, and `src/lib/validation/` for client-side schemas.
3. THE Backend SHALL be structured with subdirectories: `src/routes/`, `src/controllers/`, `src/services/`, `src/repositories/`, `src/validation/`, and `src/middleware/`.
4. THE Backend SHALL expose application setup in `src/app.ts` and server entry in `src/server.ts`.
5. THE System SHALL include a root-level `.gitignore` that excludes `node_modules/`, `dist/`, `build/`, `.env` files, `.DS_Store`, and `Thumbs.db`.
6. THE System SHALL include a root-level `README.md` containing a dedicated section for each of: prerequisites, install steps, environment setup, run commands, architecture overview, design decisions, API endpoint table, test commands, and the in-memory data limitation.
7. THE Frontend SHALL include a `.env.example` file listing the `NEXT_PUBLIC_API_URL` environment variable with a placeholder value.
8. THE Backend SHALL include a `.env.example` file listing `PORT` and `FRONTEND_URL` without secrets.

---

### Requirement 2: Task Data Model

**User Story:** As a developer, I want a consistent, well-typed Task data model, so that every layer of the application operates on the same contract.

#### Acceptance Criteria

1. THE System SHALL represent each Task with exactly the following fields: `id` (unique string, max 128 characters), `title` (string, 1–255 characters), `description` (string, 1–1000 characters), `status` (`pending` | `in_progress` | `completed`), `priority` (`low` | `medium` | `high`), `dueDate` (ISO 8601 date string or null), `createdAt` (ISO 8601 timestamp), `updatedAt` (ISO 8601 timestamp).
2. WHEN a new Task is created, THE Backend SHALL generate an `id` that is unique across all Tasks in the Store and not derivable from prior IDs.
3. WHEN a new Task is created, THE Backend SHALL set `createdAt` and `updatedAt` to the current server timestamp.
4. WHEN a Task is successfully updated, THE Backend SHALL set `updatedAt` to the current server timestamp.
5. IF a request body includes values for `id`, `createdAt`, or `updatedAt`, THEN THE Backend SHALL ignore those values and apply server-generated values instead.

---

### Requirement 3: In-Memory Data Store

**User Story:** As a developer, I want task data to live only in backend process memory, so that the application satisfies the assignment constraint without any database dependency.

#### Acceptance Criteria

1. THE Repository SHALL store all Task records in a JavaScript array or object held in Backend process memory.
2. WHEN the Backend starts, THE Repository SHALL load Seed Data containing at least three Tasks covering at least two distinct status values.
3. IF the Backend process is restarted, THEN THE Store SHALL reset to the Seed Data state, discarding any previously created or modified Tasks.
4. THE System README SHALL state all three of the following: (1) task data is stored in backend process memory, (2) task data is not persisted to any external storage, and (3) task data resets to the seed state whenever the backend process restarts.
5. THE Repository SHALL allow the Seed Data source to be replaced with a custom list or set to empty by changing a single configuration value, without modifying the Repository's storage and retrieval logic.

---

### Requirement 4: Backend REST API — Task Collection Endpoints

**User Story:** As a frontend developer, I want standard REST endpoints for listing and creating tasks, so that I can build a fully connected UI without mocking.

#### Acceptance Criteria

1. WHEN a `GET /api/tasks` request is received, THE API SHALL respond with HTTP 200 and a JSON array of all Tasks in the Store.
2. WHEN a `GET /api/tasks` request includes a `search` query parameter, THE API SHALL respond with only Tasks whose `title` or `description` contains the search string (case-insensitive).
3. WHEN a `GET /api/tasks` request includes a `status` query parameter, THE API SHALL respond with only Tasks whose `status` matches the provided value.
4. WHEN a `GET /api/tasks` request includes a `priority` query parameter, THE API SHALL respond with only Tasks whose `priority` matches the provided value.
5. WHEN a `GET /api/tasks` request includes a `sortBy` query parameter with a value of `createdAt`, `dueDate`, `priority`, or `title`, THE API SHALL sort the response array by that field. THE API SHALL default to sorting by `createdAt` when `sortBy` is absent.
6. WHEN a `GET /api/tasks` request includes a `sortOrder` query parameter with a value of `asc` or `desc`, THE API SHALL apply that direction to the active sort; THE API SHALL default to `desc` when `sortOrder` is absent.
7. WHEN a `GET /api/tasks` request includes `page` (minimum 1) and `pageSize` (minimum 1, maximum 100), THE API SHALL return Tasks for the requested page and include `total`, `page`, and `pageSize` in the response. IF the requested page exceeds total pages, THE API SHALL return an empty array with accurate metadata.
8. WHEN a `POST /api/tasks` request is received with valid input, THE API SHALL create a new Task, add it to the Store, and respond with HTTP 201 and the full Task object.
9. IF a `POST /api/tasks` request body is missing required fields or contains invalid values, THEN THE API SHALL respond with HTTP 400 and a JSON error body with a field-level message for each invalid field.
10. IF any query parameter (`status`, `priority`, `sortBy`, `sortOrder`, `page`, `pageSize`) carries an out-of-range or out-of-enum value, THEN THE API SHALL respond with HTTP 400 identifying the invalid parameter.

---

### Requirement 5: Backend REST API — Individual Task Endpoints

**User Story:** As a frontend developer, I want endpoints to read, update, and delete individual tasks, so that I can implement task detail, edit, and delete flows.

#### Acceptance Criteria

1. WHEN a `GET /api/tasks/:id` request is received and the Task exists, THE API SHALL respond with HTTP 200 and the full Task object.
2. IF a `GET /api/tasks/:id` request is received and no Task with that `id` exists, THEN THE API SHALL respond with HTTP 404 and a JSON error body with a message indicating the Task was not found.
3. WHEN a `PUT /api/tasks/:id` request is received with valid input and the Task exists, THE API SHALL update the Task fields, set `updatedAt` to the current server timestamp, and respond with HTTP 200 and the updated Task object.
4. WHEN a `PUT /api/tasks/:id` request is received with invalid input, THE API SHALL respond with HTTP 400 and field-level validation messages without modifying the Store.
5. IF a `PUT /api/tasks/:id` request is received and no Task with that `id` exists, THEN THE API SHALL respond with HTTP 404 and a JSON error body with a message indicating the Task was not found.
6. WHEN a `DELETE /api/tasks/:id` request is received and the Task exists, THE API SHALL remove the Task from the Store and respond with HTTP 200 and a JSON body containing a message confirming successful deletion.
7. IF a `DELETE /api/tasks/:id` request is received and no Task with that `id` exists, THEN THE API SHALL respond with HTTP 404 and a JSON error body with a message indicating the Task was not found.

---

### Requirement 6: Backend REST API — Infrastructure Endpoints and Middleware

**User Story:** As a developer, I want health checks, consistent error handling, and CORS support, so that the API is reliable and integrable.

#### Acceptance Criteria

1. WHEN a `GET /api/health` request is received, THE API SHALL respond with HTTP 200 and a JSON body confirming the service is operational.
2. WHEN a request is received for a route that does not exist, THE API SHALL respond with HTTP 404 and a consistent JSON error body through centralized 404 middleware.
3. IF an unhandled error propagates to the error middleware, THEN THE API SHALL respond with HTTP 500 and a consistent JSON error body.
4. THE Backend SHALL enable CORS for the origin configured in the `FRONTEND_URL` environment variable.
5. THE Backend SHALL parse `application/json` request bodies and respond with HTTP 400 when the body is malformed JSON.
6. THE Backend SHALL read its listening port from the `PORT` environment variable and fall back to a documented default when `PORT` is absent.
7. WHILE `NODE_ENV` is `production`, IF an unhandled error is caught by the error middleware, THEN THE API SHALL exclude any stack trace from the response body.
8. IF a request body cannot be parsed as valid JSON, THEN THE API SHALL respond with HTTP 400 and a JSON error body describing the parsing failure.
9. IF the `PORT` environment variable is absent, THEN THE Backend SHALL listen on port 3001.

---

### Requirement 7: Server-Side Validation

**User Story:** As a developer, I want the backend to validate all incoming task data, so that the Store only ever contains well-formed Tasks regardless of client behavior.

#### Acceptance Criteria

1. IF a `POST /api/tasks` request has a `title` field that is absent or empty after trimming, THEN THE Validator SHALL return HTTP 400 with a field-level message indicating that title is required.
2. IF a `POST /api/tasks` request has a `description` field that is absent or empty after trimming, THEN THE Validator SHALL return HTTP 400 with a field-level message indicating that description is required.
3. IF a `POST /api/tasks` request includes `status` with a value not in `pending`, `in_progress`, `completed`, THEN THE Validator SHALL return HTTP 400 with a field-level message listing valid values.
4. IF a `POST /api/tasks` request includes `priority` with a value not in `low`, `medium`, `high`, THEN THE Validator SHALL return HTTP 400 with a field-level message listing valid values.
5. IF a `POST /api/tasks` request includes `dueDate` that is not a valid `YYYY-MM-DD` calendar date string, THEN THE Validator SHALL return HTTP 400 with a field-level message indicating the required format.
6. WHEN a `PUT /api/tasks/:id` request is received, THE Validator SHALL apply the same trimming, presence, and enum/format rules to all fields as it applies to `POST` requests.
7. THE Backend SHALL trim `title` and `description` before persisting them.
8. IF a request body contains multiple invalid fields, THEN THE Validator SHALL return a single response with a field-level message for each invalid field.

---

### Requirement 8: API Documentation

**User Story:** As a developer or API consumer, I want machine-readable and human-readable API documentation, so that I can explore and test every endpoint without reading source code.

#### Acceptance Criteria

1. THE Backend SHALL expose a Swagger UI page at a path listed in the project README that renders the OpenAPI_Spec in development mode, allowing users to browse endpoints, submit requests, and view responses.
2. THE OpenAPI_Spec SHALL document every endpoint (`GET /api/tasks`, `GET /api/tasks/:id`, `POST /api/tasks`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`, `GET /api/health`) with request parameters, request body schemas, and at least one success response code with its body schema and at least one error response code with its body schema per endpoint.
3. THE OpenAPI_Spec SHALL include at least one example request and response bodies for each endpoint.
4. THE System SHALL store the OpenAPI_Spec file in the `docs/` directory.

---

### Requirement 9: Application Shell and Navigation

**User Story:** As a user, I want a consistent application shell with navigation, so that I can move between views efficiently on any device.

#### Acceptance Criteria

1. WHILE the viewport width is 768 px or greater, THE Frontend SHALL render a persistent Sidebar containing the product name, brand mark, and navigation links for Overview, All Tasks, Board, and Settings.
2. WHILE the viewport width is less than 768 px, THE Frontend SHALL replace the persistent Sidebar with a collapsible drawer that is closed by default and accessible via a visible toggle control.
3. THE Frontend SHALL render a TopBar on every page displaying the current page title, a global search input, a theme toggle control, and a Create Task action button.
4. WHILE a navigation route is active, THE Frontend SHALL apply a visually distinct style to that navigation item that differentiates it from all inactive navigation items.
5. THE Frontend SHALL support keyboard navigation between all interactive shell elements with visible focus indicators.
6. THE Frontend SHALL use semantic HTML landmarks (`<nav>`, `<main>`, `<header>`) for the shell regions.

---

### Requirement 10: Theme Support

**User Story:** As a user, I want to toggle between light and dark themes, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHEN the user activates the theme toggle, THE Frontend SHALL switch the active theme between light and dark without requiring a page reload.
2. THE Frontend SHALL apply the selected theme to all pages and components without requiring a page reload.
3. WHEN the user activates the theme toggle, THE Frontend SHALL persist the selected theme in `localStorage` so that the same theme is applied on the next page load.
4. IF no theme preference is stored in `localStorage`, THEN THE Frontend SHALL apply the theme matching the user's OS `prefers-color-scheme`.
5. IF the user's system reports `prefers-reduced-motion: reduce`, THEN THE Frontend SHALL disable all CSS transitions and animations.
6. IF `localStorage` is unavailable, THEN THE Frontend SHALL apply the OS-preference theme for the current session without persisting it.

---

### Requirement 11: Dashboard Overview Page

**User Story:** As a user, I want a Dashboard showing task statistics and a task list, so that I can understand the current state of all my work at a glance.

#### Acceptance Criteria

1. THE Dashboard SHALL display the following metrics calculated from live API data: total task count, completed task count, in-progress task count, overdue task count, and completion rate as a percentage.
2. IF a Task has a non-null `dueDate` earlier than the current date and a `status` that is not `completed`, THEN THE Dashboard SHALL count that Task as overdue.
3. THE Dashboard SHALL display a task list showing each Task's title, short description, status, priority, due date, and created date.
4. WHEN the Store contains no Tasks, THE Dashboard SHALL display a first-run empty state with a prominent Create Task call-to-action.
5. WHILE task data is being fetched, THE Dashboard SHALL display Skeleton placeholders in place of the statistics and task list.
6. IF the API request returns an error, THEN THE Dashboard SHALL replace the Skeleton with an error message and a Retry button that re-issues the same request.

---

### Requirement 12: All Tasks — List and Table View

**User Story:** As a user, I want a paginated, filterable, sortable task list, so that I can find and manage any task efficiently.

#### Acceptance Criteria

1. THE Frontend SHALL display all Tasks in a table or list layout with columns for title, description excerpt (truncated to a maximum of 100 characters), status, priority, due date, and actions (edit, delete).
2. THE Frontend SHALL support toggling between a list/table view and the Kanban Board view from the same page or via navigation.
3. IF a Task has a non-null `dueDate` earlier than the current date and status not `completed`, THEN THE Frontend SHALL display an 'Overdue' text label or icon alongside the Task, not relying on color alone.
4. IF a Task has a non-null `dueDate` within the next 48 hours and status not `completed`, THEN THE Frontend SHALL display a 'Due soon' indicator that does not rely on color alone.
5. THE Frontend SHALL display dates using an abbreviated month name, numeric day, and four-digit year (e.g., 'Jan 15, 2025').
6. WHEN a Task has no `dueDate`, THE Frontend SHALL display the text 'No due date'.

---

### Requirement 13: Search, Filtering, and Sorting

**User Story:** As a user, I want composable search, filter, and sort controls, so that I can narrow down the task list to exactly what I need.

#### Acceptance Criteria

1. THE Frontend SHALL provide a debounced search input that filters the task list by `title` and `description` using a case-insensitive substring match, with a delay of at least 300 ms between the last keystroke and the API call.
2. THE Frontend SHALL provide filter controls for `status` (values: all, pending, in_progress, completed) and `priority` (values: all, low, medium, high).
3. IF one or more filters are active or a search term is entered, THEN THE Frontend SHALL display a visible active-filter indicator.
4. WHEN the user activates 'clear all filters', THE Frontend SHALL reset all filters and the search term simultaneously.
5. THE Frontend SHALL provide sort controls for `createdAt`, `dueDate`, `priority`, and `title`. THE Frontend SHALL default to sorting by `createdAt` descending. The active sort field and direction SHALL be visually indicated.
6. THE Frontend SHALL compose search, filter, sort, and pagination parameters into a single API request rather than applying them as separate sequential requests.
7. WHEN no Tasks exist in the Store, THE Frontend SHALL display the first-run empty state. WHEN Tasks exist but none match active filters, THE Frontend SHALL display 'No tasks match your current filters'.
8. WHEN the user selects the currently active sort field, THE Frontend SHALL toggle the sort direction between ascending and descending.
9. WHEN the user changes any search, filter, or sort parameter, THE Frontend SHALL reset pagination to page 1.

---

### Requirement 14: Pagination

**User Story:** As a user, I want paginated task lists, so that the UI remains fast and usable even when many tasks exist.

#### Acceptance Criteria

1. THE Frontend SHALL display Tasks in pages of 25 per page by default and provide pagination controls showing current page, total pages, and previous/next/direct-page navigation.
2. WHEN the user changes any filter or search term and the resulting total page count is less than the current page number, THE Frontend SHALL automatically navigate to page 1.
3. THE Frontend SHALL preserve the active page, filters, sort state, and search term in the URL query string so that the state survives a browser refresh.
4. WHERE `pageSize` is configurable, THE Frontend SHALL provide a selector offering exactly the values 10, 25, and 50.
5. WHEN the user selects a new page size, THE Frontend SHALL reset to page 1.
6. IF the `page` URL parameter is not a positive integer or exceeds the total page count, THEN THE Frontend SHALL load page 1.

---

### Requirement 15: Kanban Board View

**User Story:** As a user, I want a Kanban board with drag-and-drop, so that I can visualize and update task status intuitively.

#### Acceptance Criteria

1. THE Board SHALL display three columns labeled "Pending", "In Progress", and "Completed", each containing the Tasks with the corresponding `status` value.
2. WHEN the user drags a Task card from one column and drops it on a different column, THE Frontend SHALL call `PUT /api/tasks/:id` with the new `status` value before updating the UI.
3. IF the `PUT /api/tasks/:id` call fails after a drag-and-drop action, THEN THE Frontend SHALL revert the Task card to its original column and display an error Toast that remains visible for at least 3 seconds.
4. THE Board SHALL display each Task card with at minimum the task title, a priority label showing one of 'Low', 'Medium', or 'High', and the due date (or 'No due date' if absent).
5. IF the Board contains no Tasks, THEN THE Board SHALL display an empty state in each column with a Create Task call-to-action.
6. IF the user drops a Task card onto the same column it originated from, THEN THE Frontend SHALL not call the API and SHALL leave the Task unchanged.
7. IF the Board fails to load task data from the API, THEN THE Frontend SHALL display an error message and a Retry button.
8. WHILE the Board is fetching task data from the API, THE Frontend SHALL display a loading indicator.

---

### Requirement 16: Create Task Flow

**User Story:** As a user, I want a validated create-task form, so that I can add new tasks quickly and confidently.

#### Acceptance Criteria

1. WHEN the user activates the Create Task action, THE Frontend SHALL open a form with fields for: title (required, max 255 characters), description (required, max 1000 characters), status (select from pending/in_progress/completed, default: pending), priority (select from low/medium/high, default: medium), and due date (optional calendar date input).
2. WHEN the user submits the form with an empty, whitespace-only, or title exceeding 255 characters, THE Frontend SHALL display a field-level validation message on the title field and prevent API submission.
3. WHEN the user submits the form with an empty, whitespace-only, or description exceeding 1000 characters, THE Frontend SHALL display a field-level validation message on the description field and prevent API submission.
4. WHILE the API call is in progress, THE Frontend SHALL disable the submit button to prevent duplicate submissions.
5. WHEN the API responds with HTTP 201, THE Frontend SHALL close the form, display a success Toast, and refresh the task list to include the new Task.
6. IF the API responds with HTTP 400, THEN THE Frontend SHALL display the server-returned field-level validation messages without closing the form, re-enable the submit button, and preserve the user's entered values.
7. IF the API call fails due to a network error, THEN THE Frontend SHALL display an error Toast, re-enable the submit button, and keep the form open with the user's entered values intact.
8. IF the API returns any status other than 201 or 400, THEN THE Frontend SHALL display a generic error Toast, re-enable the submit button, and keep the form open.

---

### Requirement 17: Edit Task Flow

**User Story:** As a user, I want to edit an existing task, so that I can update any field when requirements change.

#### Acceptance Criteria

1. WHEN the user activates the edit action for a Task, THE Frontend SHALL open the same form used for task creation pre-populated with the Task's current field values.
2. WHEN the user submits the edit form with valid data, THE Frontend SHALL call `PUT /api/tasks/:id`. WHEN the API responds with HTTP 200, THE Frontend SHALL close the form, display a success Toast, and update the displayed Task with the field values returned in the API response.
3. IF the API responds with HTTP 400 on an edit submission, THEN THE Frontend SHALL display field-level validation messages without closing the form, re-enable the submit button, and preserve the user's entered values.
4. WHILE the edit form API call is in progress, THE Frontend SHALL disable the submit button to prevent duplicate submissions.
5. IF the API returns any status other than 200 or 400 during an edit, THEN THE Frontend SHALL display a generic error Toast, re-enable the submit button, and keep the form open.

---

### Requirement 18: Delete Task Flow

**User Story:** As a user, I want to delete tasks with a confirmation step, so that I do not accidentally lose important task data.

#### Acceptance Criteria

1. WHEN the user activates the delete action for a Task, THE Frontend SHALL display a confirmation dialog that names the task to be deleted and requires explicit user confirmation before proceeding.
2. WHEN the user confirms deletion and the API responds with HTTP 200, THE Frontend SHALL close the confirmation dialog, display a success Toast that remains visible for at least 3 seconds, and remove the Task from the displayed list.
3. IF the user confirms deletion and the API returns HTTP 404, THEN THE Frontend SHALL display an error Toast that remains visible for at least 3 seconds and refresh the task list from the server.
4. WHEN the user cancels the confirmation dialog, THE Frontend SHALL close the dialog and leave the Task unchanged.
5. WHILE a delete API call is in progress, THE Frontend SHALL disable the confirm button to prevent duplicate deletion requests.
6. IF the delete API call returns any status other than 200 or 404, or if a network error occurs, THEN THE Frontend SHALL display an error Toast that remains visible for at least 3 seconds and leave the Task in the displayed list.

---

### Requirement 19: Task Detail View

**User Story:** As a user, I want to view all details of a task in a dedicated view, so that I can read the full description and review all metadata.

#### Acceptance Criteria

1. WHEN the user activates a view action on a Task, THE Frontend SHALL display a detail view showing all Task fields: title, description (displayed without truncation), status, priority, due date, created date, and last updated date.
2. THE Task detail view SHALL format `createdAt` and `updatedAt` as date-time values that include at minimum the year, month, day, hour, and minute.
3. WHEN the user activates the Edit action in the Task detail view, THE Frontend SHALL open the edit form pre-populated with the Task's current field values.
4. WHEN the user activates the Delete action in the Task detail view, THE Frontend SHALL trigger the delete confirmation dialog for that Task.
5. IF a Task's `dueDate` is null, THEN THE Task detail view SHALL display the text 'No due date' in the due date field.

---

### Requirement 20: Client-Side Validation

**User Story:** As a developer, I want all form validation defined with Zod schemas, so that client and server validation rules are consistent and easy to maintain.

#### Acceptance Criteria

1. THE Frontend SHALL define task form validation rules using Zod schemas stored in `src/lib/validation/`.
2. WHEN the user submits a task form, THE Frontend SHALL validate all fields using the Zod schema and display inline error messages beneath each invalid field.
3. THE Validator SHALL enforce that `title` is a non-empty string after trimming, with a minimum length of 1 character and a maximum length of 255 characters.
4. THE Validator SHALL enforce that `description` is a non-empty string after trimming, with a minimum length of 1 character and a maximum length of 2000 characters.
5. IF `status` is present in the form, THEN THE Validator SHALL enforce that it is one of `pending`, `in_progress`, or `completed`.
6. IF `priority` is present in the form, THEN THE Validator SHALL enforce that it is one of `low`, `medium`, or `high`.
7. WHEN `dueDate` is provided, THE Validator SHALL enforce that it represents a valid calendar date with a valid year, month, and day combination (for example, February 30 is not valid).
8. IF a form field fails validation on submit, THEN THE Frontend SHALL display the error message immediately beneath that field.

---

### Requirement 21: API Client Layer

**User Story:** As a developer, I want a typed API client, so that all API calls in the Frontend are consistent, type-safe, and centrally maintained.

#### Acceptance Criteria

1. THE Frontend SHALL define all HTTP calls to the Backend in modules under `src/lib/api/`.
2. THE Frontend SHALL read the Backend base URL exclusively from the `NEXT_PUBLIC_API_URL` environment variable configured in `.env.example`.
3. THE Frontend SHALL use TanStack Query for all data-fetching and mutation operations, with loading states and error states exposed to each consuming component.
4. WHEN a mutation (create, update, delete) succeeds, THE Frontend SHALL invalidate or update the TanStack Query cache entries for the resource type affected by the mutation so that the UI reflects the latest Store state without requiring a full page reload.
5. THE Frontend SHALL type all API request and response shapes using TypeScript interfaces that include all fields defined in the Task data model.
6. IF an API call returns a non-2xx HTTP status code, THEN THE API client SHALL reject the resulting Promise with an error object that includes the HTTP status code and the server-returned error message.

---

### Requirement 22: Loading, Empty, and Error States

**User Story:** As a user, I want clear feedback during every phase of data loading, so that I always know what the application is doing.

#### Acceptance Criteria

1. WHILE an API request for a list or detail view is in flight, THE Frontend SHALL display Skeleton loaders in the content region. WHILE a mutation is in progress, THE Frontend SHALL display a spinner on or adjacent to the triggering element.
2. WHEN an API request completes with an error, THE Frontend SHALL replace the Skeleton with an error message indicating the nature of the failure and a Retry button that resubmits the same failed request. THE Frontend SHALL not leave a loading indicator visible after a failure.
3. WHILE the task list is empty and no filters or search terms are active, THE Frontend SHALL display an empty state with descriptive text and a Create Task call-to-action button.
4. IF the Backend is unreachable or returns an unrecognized error response, THEN THE Frontend SHALL display a message stating that the service is unavailable and provide a Retry action.
5. WHEN an API operation completes successfully, THE Frontend SHALL display a success Toast that remains visible for at least 5 seconds and is never shown before the API confirms success.

---

### Requirement 23: Accessibility

**User Story:** As a user with assistive technology, I want the application to be keyboard-navigable and screen-reader compatible, so that I can use it without relying solely on a pointer device.

#### Acceptance Criteria

1. THE Frontend SHALL provide visible keyboard focus indicators with a contrast ratio of at least 3:1 between the focus indicator and the adjacent background on all interactive elements.
2. WHEN a dialog or drawer opens, THE Frontend SHALL move keyboard focus to the first interactive element inside the dialog or drawer.
3. THE Frontend SHALL use the following ARIA attributes: `role='dialog'` and `aria-labelledby` on dialogs; `<label>` elements or `aria-label` attributes on all form fields; `aria-label` attributes on all icon-only buttons; and `aria-label` or `aria-describedby` on status and priority badges.
4. THE Frontend SHALL use semantic HTML elements (`<button>`, `<label>`, `<form>`, `<table>`, `<th>`) rather than generic `<div>` elements for interactive and tabular content.
5. THE Frontend SHALL include an `aria-label` attribute on each status and priority badge that states the full meaning (for example, `aria-label='Status: In Progress'`).
6. WHEN a dialog or drawer closes, THE Frontend SHALL return keyboard focus to the element that triggered it to open.
7. WHILE a dialog or drawer is open, THE Frontend SHALL trap keyboard focus within it so that Tab and Shift+Tab cycle only through elements inside the dialog or drawer.
8. WHEN the user presses the Escape key while a dialog or drawer is open, THE Frontend SHALL close it.

---

### Requirement 24: Visual Design and Responsiveness

**User Story:** As a user, I want a polished, responsive UI, so that the application looks and feels professional on any device.

#### Acceptance Criteria

1. THE Frontend SHALL use Tailwind CSS utility classes and shadcn/ui components as the primary styling system.
2. THE Frontend SHALL use Lucide icons as the sole icon library for all iconographic UI elements.
3. THE Frontend SHALL apply a neutral color palette for backgrounds, text, and borders, and SHALL restrict the accent color to interactive elements (such as primary buttons, active navigation items, and focus rings) and highlighted states.
4. THE Frontend SHALL render at viewport widths of 320 px, 768 px, and 1280 px without horizontal scrolling, with body text readable without zooming, and with all interactive elements reachable by pointer or keyboard.
5. THE Frontend SHALL apply uniform spacing values for equivalent layout elements and SHALL use a minimum body text size of 14 px.
6. THE Frontend SHALL apply CSS transitions with a duration between 100 ms and 300 ms on interactive elements when `prefers-reduced-motion` is not active.
7. IF the user's system reports `prefers-reduced-motion: reduce`, THEN THE Frontend SHALL disable all CSS transitions and animations.

---

### Requirement 25: Backend Testing

**User Story:** As a developer, I want automated backend tests, so that I can verify API correctness and catch regressions.

#### Acceptance Criteria

1. THE Backend SHALL include a test that sends `POST /api/tasks` with valid data and verifies the response is HTTP 201 with a JSON body containing `id`, `title`, `description`, `status`, `priority`, `dueDate`, `createdAt`, and `updatedAt`.
2. THE Backend SHALL include tests that verify `GET /api/tasks` returns HTTP 200 with a JSON array, including when the Store is empty (returns an empty array).
3. THE Backend SHALL include a test that creates a Task and verifies `GET /api/tasks/:id` returns HTTP 200 with field values exactly matching the created Task.
4. THE Backend SHALL include a test that verifies `GET /api/tasks/:id` returns HTTP 404 with a JSON error body when no Task with the given ID exists.
5. THE Backend SHALL include a test that verifies `POST /api/tasks` returns HTTP 400 with a validation error response identifying each invalid field when required fields are missing.
6. THE Backend SHALL include a test that creates a Task and verifies `PUT /api/tasks/:id` returns HTTP 200 with the updated field values when valid input is provided.
7. THE Backend SHALL include tests that verify `DELETE /api/tasks/:id` removes the Task and returns HTTP 200, and that a subsequent `GET /api/tasks/:id` returns HTTP 404.
8. THE Backend SHALL include tests that verify in-memory isolation: changes made in one test do not affect other tests.
9. FOR ALL valid Task field combinations provided as input to `POST /api/tasks`, THE Backend SHALL create a Task whose `id`, `createdAt`, and `updatedAt` are server-generated and not equal to any client-supplied values.
10. THE Backend SHALL include a test that verifies `PUT /api/tasks/:id` returns HTTP 404 when the specified Task does not exist.
11. THE Backend SHALL include a test that verifies `DELETE /api/tasks/:id` returns HTTP 404 when the specified Task does not exist.

---

### Requirement 26: Frontend Testing

**User Story:** As a developer, I want automated frontend tests, so that I can verify critical UI flows and form behavior.

#### Acceptance Criteria

1. WHEN the create-task form is submitted with no characters or only whitespace in the title field, THE Frontend test SHALL verify that a visible validation error message for the title field is displayed.
2. WHEN the create-task form is submitted with no characters or only whitespace in the description field, THE Frontend test SHALL verify that a visible validation error message for the description field is displayed.
3. WHILE the API request for the task list is pending, THE Frontend test SHALL verify that Skeleton loader elements are visible in the task list region.
4. WHEN the API returns an empty array for the task list, THE Frontend test SHALL verify that the empty state element is displayed.
5. WHEN the API call for the task list fails, THE Frontend test SHALL verify that an error state element and a Retry button are displayed.
6. WHEN the delete action is triggered for a Task, THE Frontend test SHALL verify that the confirmation dialog is displayed.
7. WHEN the user cancels the delete confirmation dialog, THE Frontend test SHALL verify that the dialog is dismissed and the Task remains in the task list.

---

### Requirement 27: Developer Tooling and Scripts

**User Story:** As a developer, I want consistent scripts for development, building, linting, type-checking, and testing, so that I can maintain quality across both applications.

#### Acceptance Criteria

1. THE Frontend `package.json` SHALL include scripts for `dev` (start development server), `build` (production build), `lint` (run ESLint), `typecheck` (run TypeScript compiler check), and `test` (run Vitest in single-execution mode).
2. THE Backend `package.json` SHALL include scripts for `dev` (start development server with hot reload), `build` (compile TypeScript), `lint` (run ESLint), `typecheck` (run TypeScript compiler check), and `test` (run Vitest in single-execution mode).
3. WHEN the `typecheck` script is run, THE System SHALL complete with zero TypeScript compiler errors.
4. WHEN the `lint` script is run, THE System SHALL complete with zero ESLint errors.
5. WHEN the `test` script is run, THE System SHALL complete with zero test failures and zero test errors.

---

### Requirement 28: Seed Data and Demo Readiness

**User Story:** As a reviewer, I want the application to display meaningful data on first launch, so that I can evaluate the full UI without manually creating tasks.

#### Acceptance Criteria

1. WHEN the Backend starts with seed data enabled, THE Repository SHALL load at least five Seed Tasks covering: at minimum one Task per status value (pending, in_progress, completed), one Task per priority value (low, medium, high), at least one Task with a past `dueDate`, at least one with a future `dueDate`, and at least one with a null `dueDate`.
2. THE Seed Data SHALL be defined in a dedicated module separate from the Repository.
3. IF the seed data configuration flag is disabled, THEN THE Repository SHALL initialize the Store with an empty Task list.
4. THE System README SHALL include a demo checklist covering: creating a new Task, editing an existing Task, deleting a Task with confirmation, filtering by status and priority, searching by title and description, and toggling between the list view and the Kanban board.
5. THE System README SHALL describe the expected visible UI elements that confirm each feature in the demo checklist is functioning correctly.
