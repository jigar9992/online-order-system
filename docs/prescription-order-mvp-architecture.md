# Prescription Order MVP Architecture

## Summary
Build a production-ready MVP as a **modular monolith** with a clearly separated **frontend**, **backend API**, **file storage**, and **persistence adapter layer**. The core rule is that business workflow lives in the backend domain/service layer, while storage and database choices remain replaceable.

Recommended stack:
- **Frontend:** React + Vite + TypeScript
- **Backend:** NestJS + TypeScript
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
   |-- File Metadata Module
   |
   +--> [ Repository Ports ]
   |       - UserRepository
   |       - OrderRepository
   |       - SubmissionRepository
   |       - ReviewHistoryRepository
   |
   +--> [ Storage Port ]
           - Local/mock file store in Phase 1
           - S3-compatible object storage in production
           - PostgreSQL adapter in Phase 2
   |
   v
[ Database ]
   - Phase 1: Mock/In-memory
   - Phase 2: PostgreSQL
```

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
  - the same repository contracts can later support MongoDB if needed without changing business logic
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
  - gated by authorization
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
  /frontend
    /src
      /pages
      /components
      /features
      /api
      /auth
      /routes
  /backend
    /src
      /modules
        /auth
        /submissions
        /reviews
        /tracking
        /files
      /domain
      /ports
      /adapters
      /common
      /config
      /main.ts
/packages
  /shared
    /types
    /schemas
    /constants
/docs
```

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
- optionally add a MongoDB adapter later if product requirements shift
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
