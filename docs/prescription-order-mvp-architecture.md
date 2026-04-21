# Prescription Order MVP Architecture

## Summary

Build the MVP as a modular monolith with a React frontend, a NestJS backend, replaceable persistence and file-storage boundaries, and server-side workflow enforcement from upload through delivery.

Recommended stack:

- **Workspace:** pnpm workspace with Corepack-backed root commands
- **Frontend:** React + Vite + TypeScript in `apps/web`
- **Backend:** NestJS + TypeScript in `apps/api`
- **Shared types:** `packages/types`
- **Shared config:** `packages/config`
- **Phase 1 persistence:** in-memory workflow store + local file storage
- **Phase 2 persistence:** PostgreSQL behind the same contracts
- **API style:** REST
- **Auth:** JWT in HttpOnly cookies with role-based access control

## High-Level Architecture

```text
[ Browser ]
   |
   v
[ React SPA ]
   |-- customer upload, tracking, resubmission
   |-- admin review, decisioning, delivery update
   |
   v
[ NestJS Modular Monolith ]
   |-- Auth Module
   |-- Submissions Module
   |-- Reviews Module
   |-- Tracking Module
   |-- Files Module
   |
   +--> WorkflowStore
   +--> FileStoragePort
   |
   v
[ Phase 1 Persistence ]
   |-- in-memory workflow state
   |-- local file storage
```

## Current Status

Implemented in the repo:

- workspace structure and shared package boundaries
- shared workflow types, including scoped history events
- backend auth, session cookies, and RBAC enforcement
- customer upload with MIME/size validation and local file storage
- admin review queue, submission detail, approve/reject actions, and manual delivery endpoint
- customer tracking, history rendering, ownership checks, and resubmission
- file serving with admin access and customer ownership enforcement
- frontend coverage for auth, upload, review detail, queue, and tracking
- backend coverage for auth, workflow rules, files, tracking, submissions, and integration flows

Remaining after this Phase 1 pass:

- Playwright or equivalent browser E2E coverage for full customer and admin journeys
- PostgreSQL persistence adapter and adapter-level tests for Phase 2
- optional cleanup of placeholder shared-package scripts once those packages gain real functionality

## API Endpoint Examples

### Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Customer submission and tracking

- `POST /api/customer/submissions`
- `GET /api/customer/orders/:orderId`
- `POST /api/customer/orders/:orderId/resubmit`

### Admin review and delivery

- `GET /api/admin/reviews?status=pending`
- `GET /api/admin/submissions/:submissionId`
  - returns `submission` plus the current `order` summary
- `POST /api/admin/reviews/:submissionId/approve`
- `POST /api/admin/reviews/:submissionId/reject`
- `POST /api/admin/orders/:orderId/deliver`

### File access

- `GET /api/files/:fileId`
  - gated by auth and ownership/role checks

## Workflow and History Model

- Submission events use `scope: "submission"` and include `pending`, `approved`, or `rejected`.
- Order milestones use `scope: "order"` and currently include `delivered`.
- `latestDecision` remains the latest review outcome rather than the latest overall history event.
- The client renders history as a mixed timeline but cannot author or override workflow state.

## Notes on Validation and Tooling

- Root validation uses `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build`, and `corepack pnpm format:check`.
- Root fix uses `corepack pnpm fix`.
- The root scripts use sequential Corepack-backed pnpm recursion for stability in this Windows shell.
- Some shared packages still have placeholder build/test scripts because they are reserved for later work, but the app packages carry the meaningful current feature coverage.

## Assumptions

- The product is a web app, not a native mobile app.
- Manual delivery updates are acceptable for Phase 1.
- PostgreSQL remains the first real persistence target after the mock-backed MVP.
