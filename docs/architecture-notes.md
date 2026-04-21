# Prescription Order MVP Architecture Notes

## 1. Architecture Intent

Design the MVP as a thin UI over a domain service layer, with persistence and file storage isolated behind interfaces so the implementation can later run on PostgreSQL without rewriting workflow logic.

## 2. Current Workspace Layout

The repo is organized as a single pnpm workspace:

- `apps/web` for the React + Vite UI
- `apps/api` for the NestJS API
- `packages/types` for shared DTOs, enums, and workflow helpers
- `packages/ui` for future shared React components
- `packages/utils` for future shared utilities
- `packages/config` for shared TypeScript, ESLint, and Prettier presets

This layout matches the current implementation and keeps frontend and backend in one repo while still separating ownership.

## 3. Frontend Structure

### Customer screens

- login
- prescription upload with preview
- submission confirmation
- order tracking with mixed submission and order history
- resubmission after rejection

### Admin screens

- review queue
- submission detail and preview
- approve/reject action panel
- in-place delivery action for approved orders

## 4. Backend Structure

### Service boundaries

- authentication and user context
- prescription submission service
- admin review and delivery service
- order tracking service
- file upload and retrieval service

### API behavior

- create prescription submission
- fetch submission detail plus current order state
- list pending admin reviews
- approve submission
- reject submission with reason
- create resubmission after rejection
- mark approved orders as delivered
- fetch customer tracking summaries and history

### Workflow enforcement

- enforce transitions in the service layer
- prevent direct status writes from the client
- record submission events and order milestones

## 5. Persistence Design

### Domain-first model

Keep a canonical domain model with entities for:

- user
- order
- prescription submission
- workflow history

### Adapter pattern

Use replaceable interfaces for:

- workflow state persistence
- file storage

This keeps the same application logic usable with in-memory Phase 1 storage and a future PostgreSQL adapter.

### Data storage guidance

- store file metadata in workflow records
- store file content in an object-storage-compatible layer
- keep only references and metadata in domain records

## 6. Data Considerations

### History model

- submission review actions stay tied to a `submissionId`
- order milestones such as `delivered` are recorded separately with `scope: "order"`
- tracking should present both kinds of events without overloading submission status history

### PostgreSQL direction

- users, orders, submissions, and history map cleanly to normalized tables
- history records should preserve event scope, actor, timestamps, and optional submission linkage

## 7. File Handling

- accept image and PDF files only
- validate size and MIME type before persistence
- generate a server-side reference for each uploaded file
- keep preview support on the frontend using the selected local file and authorized backend file URLs

## 8. Security and Controls

- require authentication for customer upload and tracking
- restrict admin routes to verified admin users
- enforce customer ownership for tracking, resubmission, and file access
- validate all workflow transitions server-side
- avoid trusting client-supplied status values

## 9. Completed and Remaining

### Completed

- shared workflow contracts, including typed history events for submission and order scopes
- real authentication with HttpOnly JWT cookies and RBAC
- customer upload with validation, preview, confirmation, and local file persistence
- admin review queue and submission detail with approve/reject actions
- customer tracking with workflow history and resubmission
- manual delivery progression from `approved` to `delivered`
- ownership-protected tracking and file access
- frontend and backend automated tests for the implemented workflows

### Remaining

- PostgreSQL persistence adapter for Phase 2
- broader E2E/browser coverage for customer and admin journeys
- optional future shared UI and utility package extraction

## 10. Notes for Future Expansion

- payments can be added as a separate order lifecycle step
- delivery integration can replace the manual delivery update later
- notifications can react to workflow events without changing the core domain model
