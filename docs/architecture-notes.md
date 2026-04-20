# Prescription Order MVP Architecture Notes

## 1. Architecture Intent

Design the MVP as a thin UI over a domain service layer, with persistence and file storage isolated behind interfaces so the implementation can later run on PostgreSQL or MongoDB without rewriting workflow logic.

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
- order tracking
- rejected submission details with resubmission action

### Admin screens

- review queue
- submission detail and preview
- approve/reject action panel
- review history view

## 4. Backend Structure

### Recommended service boundaries

- authentication and user context
- prescription submission service
- admin review service
- order tracking service
- file upload service

### API behavior

- create prescription submission
- fetch submission and order status
- list pending admin reviews
- approve submission
- reject submission with reason
- create resubmission after rejection

### Workflow enforcement

- enforce transitions in the service layer
- prevent direct status writes from the client
- record each review event and status change

## 5. Persistence Design

### Domain-first model

Keep a canonical domain model with entities for:

- user
- order
- prescription submission
- review decision
- status history

### Adapter pattern

Use repository interfaces such as:

- user repository
- order repository
- prescription repository
- audit/status history repository

This lets the same application logic work with relational or document storage.

### Data storage guidance

- store file metadata in the primary database
- store file content in an object-storage-compatible layer
- keep only references and metadata in the domain records

## 6. Data Considerations

### PostgreSQL mapping

- users, orders, submissions, and history can map to normalized tables
- foreign keys can enforce relationships

### MongoDB mapping

- order and submission history can be embedded or linked by identifiers
- repositories should hide document shape differences from services

## 7. File Handling

- accept image and PDF files only
- validate size and MIME type before persistence
- generate a server-side reference for each uploaded file
- keep preview support on the frontend using the selected local file and/or stored file URL

## 8. Security and Controls

- require authentication for customer upload and tracking
- restrict admin routes to verified admin users
- validate all workflow transitions server-side
- avoid trusting client-supplied status values

## 9. Suggested Implementation Order

1. define domain entities and repository interfaces
2. implement upload and preview flow
3. implement admin review workflow
4. implement resubmission flow
5. implement tracking view and history
6. wire storage and database adapters

## 10. Notes for Future Expansion

- payments can be added as a separate order lifecycle step
- delivery integration can consume approved orders later
- notifications can be attached to status-change events without changing the core model

## 11. Completed and Remaining

### Completed

- workspace scaffold for `web`, `api`, `types`, `ui`, `utils`, and `config`
- shared TypeScript, ESLint, and Prettier configuration
- shared type package for workflow contracts
- in-memory backend workflow store and service modules
- frontend route shell for customer and admin flows
- repository validation commands for lint, typecheck, test, and format

### Remaining

- real authentication with HttpOnly JWT cookies
- backend guards and role enforcement
- API integration with actual file upload endpoints
- persistent storage adapter for PostgreSQL
- shared UI package implementation
- shared utility helpers
- integration and E2E tests
