# MVP Story Map for Frontend and Backend

## Summary

This document tracks the current MVP story completion state across frontend, backend, and testing work.

The repo now has the core Phase 1 workflow implemented end to end:

- customer login, upload, confirmation, tracking, and resubmission
- admin review queue, submission detail, approve/reject, and delivery update
- ownership-aware file access and tracking
- unit and integration coverage for the core workflow

## Current Status

### Completed

- workspace scaffold for `apps/web`, `apps/api`, `packages/types`, `packages/ui`, `packages/utils`, and `packages/config`
- shared lint, format, typecheck, test, build, and fix commands
- shared workflow types, status helpers, upload constraints, and scoped history events
- real login/session handling with role-aware routing, backend guards, and RBAC enforcement
- customer multipart upload API with MIME/size validation and local file persistence
- Phase 1 file storage abstraction with local-disk adapter and in-memory workflow store
- frontend customer upload, tracking, and resubmission flows
- frontend admin review queue and review detail decision flows
- backend review, tracking, file access, and delivery APIs
- workflow-focused unit and integration coverage for review, resubmission, tracking, ownership, and delivery

### Remaining

- `QA-3` Playwright customer journey
- `QA-4` Playwright admin journey
- `BE-8` PostgreSQL persistence adapter for Phase 2
- optional cleanup of placeholder shared-package scripts when those packages gain real responsibilities

## Story Map

### Frontend Stories

| ID   | Story                                     | Acceptance Criteria                                                                     | Points | Depends On       | Parallel | Status |
| ---- | ----------------------------------------- | --------------------------------------------------------------------------------------- | -----: | ---------------- | -------- | ------ |
| FE-1 | App shell and routing                     | Protected routes, role-aware navigation, auth bootstrap, shared layout are in place.    |      3 | None             | Yes      | Done   |
| FE-2 | Customer login                            | Customer can log in, session state is handled, and invalid credentials show errors.     |      3 | FE-1, BE-2       | Yes      | Done   |
| FE-3 | Prescription upload with preview          | Customer can choose an image/PDF, preview it, see validation messages, and submit it.   |      5 | FE-1, BE-3, BE-7 | Yes      | Done   |
| FE-4 | Submission confirmation and tracking view | Customer sees the reference ID, current order status, and latest review history.        |      3 | FE-1, BE-6       | Yes      | Done   |
| FE-5 | Admin review queue                        | Admin can see pending submissions, apply filtering, and open submission detail.         |      5 | FE-1, BE-4       | Yes      | Done   |
| FE-6 | Admin decision actions                    | Admin can approve or reject a submission and enter a rejection reason when rejecting.   |      5 | FE-5, BE-4       | Yes      | Done   |
| FE-7 | Resubmission flow                         | Customer can resubmit after rejection and keep the previous history visible.            |      5 | FE-4, BE-5       | Yes      | Done   |
| FE-8 | Delivery status visibility                | Admin can mark approved orders delivered and customers can see the delivered milestone. |      3 | FE-6, BE-6       | Yes      | Done   |

### Backend Stories

| ID   | Story                                 | Acceptance Criteria                                                                                 | Points | Depends On       | Parallel        | Status |
| ---- | ------------------------------------- | --------------------------------------------------------------------------------------------------- | -----: | ---------------- | --------------- | ------ |
| BE-1 | Domain model and repository ports     | Entities, workflow states, repository interfaces, and transition rules are defined.                 |      5 | None             | Yes             | Done   |
| BE-2 | Authentication and RBAC               | Login/session flow, customer/admin guards, and current-user context work end to end.                |      5 | BE-1             | Yes             | Done   |
| BE-3 | Submission create and file validation | Multipart upload works, file type/size validation is enforced, and pending submissions are created. |      8 | BE-1, BE-2, BE-7 | Yes             | Done   |
| BE-4 | Review workflow                       | Pending reviews can be listed, approved, or rejected, and rejection reason is required.             |      5 | BE-1, BE-2       | Yes             | Done   |
| BE-5 | Resubmission workflow                 | Resubmission is allowed only after rejection and creates a new cycle under the same order.          |      5 | BE-4             | Yes             | Done   |
| BE-6 | Tracking and history read model       | Current status, latest outcome, and workflow history can be fetched.                                |      5 | BE-1             | Yes             | Done   |
| BE-7 | File storage adapter                  | Mock/local storage works in Phase 1 and the storage interface is ready for future object storage.   |      5 | BE-1             | Yes             | Done   |
| BE-8 | Delivery progression                  | Approved orders can be marked delivered and delivery appears as an order-level history event.       |      3 | BE-4, BE-6       | Yes             | Done   |
| BE-9 | Persistence adapter for Phase 2       | PostgreSQL mappings exist for users, orders, submissions, and history.                              |      8 | BE-1, BE-6, BE-7 | No, later phase | Later  |

### Cross-Cutting Testing Stories

| ID   | Story                                | Acceptance Criteria                                                                                           | Points | Depends On                                     | Parallel    | Status  |
| ---- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- | -----: | ---------------------------------------------- | ----------- | ------- |
| QA-1 | Unit tests for domain/workflow rules | Tests cover valid transitions, invalid transitions, rejection reason rules, resubmission, and delivery logic. |      5 | BE-1                                           | Yes         | Done    |
| QA-2 | API integration tests                | API tests cover upload, review, resubmission, tracking, ownership, and delivery endpoints.                    |      5 | BE-2, BE-3, BE-4, BE-5, BE-6, BE-8             | Yes         | Done    |
| QA-3 | Playwright customer journey          | E2E coverage exists for login, upload, confirmation, tracking, and resubmission after rejection.              |      5 | FE-2, FE-3, FE-4, FE-7, BE-2, BE-3, BE-5, BE-6 | Yes         | Planned |
| QA-4 | Playwright admin journey             | E2E coverage exists for admin login, review queue, preview, approve, reject, and mark delivered.              |      5 | FE-5, FE-6, FE-8, BE-2, BE-4, BE-8             | Yes         | Planned |
| QA-5 | Contract and adapter tests           | Adapter and contract tests verify that mock and real persistence behave consistently.                         |      3 | BE-1, BE-7, BE-9                               | Later phase | Later   |

## Recommended Next Work

1. Add browser E2E coverage for the customer journey.
2. Add browser E2E coverage for the admin journey.
3. Start the PostgreSQL adapter behind the existing workflow/file boundaries.
4. Replace placeholder shared-package scripts when those packages begin carrying real logic.

## Notes

- Story points are relative estimates for planning, not calendar time.
- Phase 1 remains intentionally mock-backed for workflow state, with local file storage for uploaded payloads.
- PostgreSQL should be introduced through adapters without changing service-layer workflow rules.
