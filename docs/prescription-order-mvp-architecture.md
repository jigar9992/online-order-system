# Prescription Order MVP Architecture

## Summary

Build a production-ready MVP as a **modular monolith** with a clearly separated **frontend**, **backend API**, **file storage**, and **persistence adapter layer**. The core rule is that business workflow lives in the backend domain/service layer, while storage and database choices remain replaceable.

Recommended stack:

- **Workspace:** pnpm + Turborepo scaffold, with workspace commands now using Corepack-backed pnpm recursion in this environment
- **Frontend:** React + Vite + TypeScript in `apps/web`
- **Backend:** NestJS + TypeScript in `apps/api`
- **Shared types:** `packages/types`
- **Shared UI:** `packages/ui` reserved for future shared components
- **Shared utilities:** `packages/utils` reserved for common helpers
- **Shared config:** `packages/config`
- **Phase 1 persistence:** in-memory/mock repositories
- **Phase 2 persistence:** PostgreSQL with the same repository contracts
- **API style:** REST
- **Auth:** JWT-based auth with HttpOnly cookies and role-based access control

## High-Level Architecture

```text
[ Browser ]
   |
   | HTTPS
   v
[ Frontend: React SPA ]
   |  - customer upload/tracking
   |  - admin review console
   |
   v
[ Backend API: NestJS Modular Monolith ]
   |-- Auth Module
   |-- Submission Module
   |-- Review Module
   |-- Tracking Module
   |-- File Module
   |
   +--> [ Current Phase 1 Ports ]
   |       - WorkflowStore
   |       - FileStoragePort
   |
   +--> [ Planned Phase 2 Refinement ]
   |       - split WorkflowStore into narrower repository ports if needed
   |       - keep storage/file handling behind interfaces
   |
   +--> [ Storage Port ]
           - Local/mock file store in Phase 1
           - S3-compatible object storage in production
   |
   v
[ Persistence ]
  - Phase 1: In-memory workflow state + local file storage
  - Phase 2: PostgreSQL workflow adapter
```

## Current Status

Completed in the repo today:

- workspace structure and package boundaries are in place
- shared workflow contract package is implemented
- backend workflow store and module wiring are implemented in-memory
- backend auth, session cookies, and RBAC enforcement are working
- customer multipart upload, file validation, and local file persistence are working
- backend review queue, approve/reject actions, file serving, and tracking summary endpoints exist
- frontend customer/admin route shell is implemented
- frontend upload screen is wired to the live API with local preview and submission confirmation
- lint, typecheck, test, validate, and fix commands are available

Remaining before MVP completion:

- admin review queue and decision flows wired to live API data
- tracking page data loading, history rendering, and resubmission UX
- customer ownership enforcement for tracking, resubmission, and file access
- resubmission hardening so replacement uploads persist file bytes through the storage adapter
- workflow-focused tests for review, resubmission, tracking, and adapter behavior
- PostgreSQL adapter and associated tests

## Detailed Tech Stack With Justification

### Frontend framework

- **React + Vite + TypeScript**
- Why this choice:
  - fastest path for a clean MVP
  - easy to build separate customer/admin screens
  - strong ecosystem for file upload, routing, form handling, and data fetching
  - low operational overhead compared with a full meta-framework
- Suggested frontend libraries:
  - React Router for routing
  - TanStack Query for API state
  - Zod for client-side validation
  - a lightweight UI kit or custom design system for rapid delivery

### Backend framework

- **NestJS + TypeScript**
- Why this choice:
  - naturally supports a modular monolith
  - clean separation of controllers, services, and adapters
  - strong validation, DI, guards, and testing support
  - good fit for workflow enforcement and role-based access
- Core backend pattern:
  - controllers for HTTP
  - services for business rules
  - repositories/storage through interfaces
  - guards/interceptors for auth and logging

### Database choice

- **Phase 1:** mock/in-memory repository layer
- **Phase 2:** PostgreSQL
- Why:
  - Phase 1 stays fast and cheap for product validation
  - PostgreSQL is the best default for the first real database because the workflow is transactional and audit-friendly
  - the same business boundary can later support different persistence implementations without changing service logic
- File contents should not go into the database; store only file metadata and references. Use object storage or local filesystem for the actual PDF/image payloads.

### API structure

- **REST**
- Why:
  - simplest for MVP
  - easy to document and test
  - maps well to customer/admin workflow operations
  - no need for GraphQL complexity here

### Auth mechanism

- **JWT access token in HttpOnly cookie**
- Add **role-based authorization** for `customer` and `admin`
- Why:
  - secure for browser apps
  - avoids exposing tokens to JavaScript
  - straightforward to implement in a modular monolith
  - fits the current requirement for authenticated customers and internal admin users

## Component Breakdown

### Frontend

- Customer login screen
- Prescription upload screen with file preview
- Submission confirmation screen with reference ID
- Order tracking screen
- Rejected submission detail screen with resubmission action
- Admin login screen
- Admin review queue
- Admin submission detail page with preview and approve/reject controls
- Admin review history view

### Backend modules

- **Auth Module**
  - login
  - current user context
  - role checks
- **Submission Module**
  - create prescription submission
  - validate file type and size
  - create pending workflow state
- **Review Module**
  - list pending items
  - approve or reject submissions
  - capture rejection reason
- **Tracking Module**
  - return order status
  - return latest decision and history
- **File Module**
  - persist file metadata
  - store/retrieve file references
  - abstract storage backend
- **Audit/History Module**
  - status transitions
  - review events
  - traceability across resubmissions

### Domain rules to enforce server-side

- only authenticated customers can submit and track
- only admins can review submissions
- only `pending` submissions can be approved or rejected
- resubmission is allowed only after rejection
- status changes must be recorded as events/history
- client must never be allowed to write status directly

## API Endpoint Examples

### Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Customer submission and tracking

- `POST /api/customer/submissions`
  - multipart upload for image/PDF
  - creates a new submission in `pending`
- `GET /api/customer/orders/:orderId`
  - returns current order status, latest review outcome, and history
- `POST /api/customer/orders/:orderId/resubmit`
  - allowed only after rejection
  - creates a new pending submission under the same order

### Admin review

- `GET /api/admin/reviews?status=pending`
  - review queue
- `GET /api/admin/submissions/:submissionId`
  - submission detail and file metadata
- `POST /api/admin/submissions/:submissionId/approve`
- `POST /api/admin/submissions/:submissionId/reject`
  - body includes `reason`

### File access

- `GET /api/files/:fileId`
  - gated by authorization and should enforce ownership/role checks server-side
  - returns secure preview/download reference

## Basic Database Schema

### `users`

- `id`
- `email`
- `password_hash`
- `role` (`customer` | `admin`)
- `created_at`
- `updated_at`

### `orders`

- `id`
- `customer_id`
- `current_status` (`pending` | `approved` | `delivered`)
- `created_at`
- `updated_at`

### `prescription_submissions`

- `id`
- `order_id`
- `uploaded_by`
- `file_name`
- `file_type`
- `file_size`
- `file_storage_key`
- `status` (`pending` | `approved` | `rejected`)
- `rejection_reason`
- `created_at`
- `reviewed_at`

### `review_actions`

- `id`
- `submission_id`
- `reviewed_by`
- `action` (`approved` | `rejected`)
- `reason`
- `created_at`

### `status_history`

- `id`
- `order_id`
- `submission_id`
- `from_status`
- `to_status`
- `actor_id`
- `event_type`
- `created_at`

## Folder Structure

```text
/apps
  /web
    /src
  /api
    /src
/packages
  /types
  /ui
  /utils
  /config
```

## Notes on Validation and Tooling

- Root validation uses `corepack pnpm validate`
- Root fix uses `corepack pnpm fix`
- ESLint and Prettier live at the repo root with shared config under `packages/config`
- The workspace is intentionally organized for future Turbo use, but the current root scripts use sequential Corepack pnpm recursion for stability in this Windows shell
- `corepack pnpm test` is currently green; `corepack pnpm validate` still stops at `format:check` because of repo-wide formatting drift

## Deployment Architecture

### MVP deployment shape

- **Frontend:** static hosting or CDN-backed deployment
- **Backend:** single containerized API service
- **Database:** PostgreSQL in phase 2
- **File storage:** S3-compatible object storage in production
- **Dev phase 1:** local app + mock repository + local file storage

### Operational notes

- one backend deployable keeps costs low
- frontend and backend can scale independently later
- use environment variables for DB, auth secret, and storage credentials
- add structured logs and request IDs from day one

## Future Scalability Plan

- replace mock repository with PostgreSQL adapter without changing domain services
- move file storage to S3-compatible storage if not already there
- add notifications as an event consumer, not inside the core workflow
- add queue-based processing only if uploads, OCR, or notifications become heavy
- split the backend into services only when real scale or organizational boundaries justify it
- add read replicas or caching only after observing performance bottlenecks

## Assumptions

- The product is a web app, not mobile-first native.
- The first real database should be **PostgreSQL**, with the app still keeping a database-agnostic repository layer.
- Phase 1 is intentionally mock-backed so the workflow can be built and validated before committing to a persistent database.
- Delivery updates remain manual for now, consistent with the current MVP scope.
- The architecture should favor low cost and fast delivery over premature microservices.
