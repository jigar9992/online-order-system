# MVP Story Map for Frontend and Backend

## Summary

This document breaks the prescription order MVP into frontend, backend, and cross-cutting testing stories. It is optimized for implementation planning and uses **story points** for effort sizing.

The plan assumes:

- Phase 1 uses mock/in-memory persistence
- Phase 2 introduces PostgreSQL behind the same repository contracts
- REST APIs, JWT auth, and role-based access are in scope
- payments, delivery integration, OCR, and notifications remain out of scope

## Current Status

### Completed

- workspace scaffold for `apps/web`, `apps/api`, `packages/types`, `packages/ui`, `packages/utils`, and `packages/config`
- shared lint, format, typecheck, validate, and fix commands
- backend domain/service shell for auth, submissions, reviews, tracking, and files
- frontend route shell for customer and admin flows
- shared workflow types and helpers
- real login/session handling with role-aware routing, backend guards, and RBAC enforcement

### Remaining

- file upload and preview integration with the API
- API-backed customer tracking and admin queue screens
- persistence adapter for PostgreSQL
- automated integration and browser coverage
- final cleanup of any placeholder test scripts once real tests are added

### Validation Notes

- Auth validation is functionally green: focused frontend and backend auth tests passed.
- `corepack pnpm validate` currently fails at `format:check` because of repo-wide formatting drift, not because of auth behavior.

## Story Map

### Frontend Stories

| ID   | Story                                     | Acceptance Criteria                                                                   | Points | Depends On       | Parallel | Status  |
| ---- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -----: | ---------------- | -------- | ------- |
| FE-1 | App shell and routing                     | Protected routes, role-aware navigation, auth bootstrap, shared layout are in place.  |      3 | None             | Yes      | Done    |
| FE-2 | Customer login                            | Customer can log in, session state is handled, and invalid credentials show errors.   |      3 | FE-1, BE-2       | Yes      | Done    |
| FE-3 | Prescription upload with preview          | Customer can choose an image/PDF, preview it, see validation messages, and submit it. |      5 | FE-1, BE-3, BE-7 | Yes      | Planned |
| FE-4 | Submission confirmation and tracking view | Customer sees the reference ID, current order status, and latest review history.      |      3 | FE-1, BE-6       | Yes      | Planned |
| FE-5 | Admin review queue                        | Admin can see pending submissions, apply basic filtering, and open submission detail. |      5 | FE-1, BE-4       | Yes      | Planned |
| FE-6 | Admin decision actions                    | Admin can approve or reject a submission and enter a rejection reason when rejecting. |      5 | FE-5, BE-4       | Yes      | Planned |
| FE-7 | Resubmission flow                         | Customer can resubmit after rejection and keep the previous history visible.          |      5 | FE-4, BE-5       | Yes      | Planned |

### Backend Stories

| ID   | Story                                 | Acceptance Criteria                                                                                 | Points | Depends On       | Parallel        | Status  |
| ---- | ------------------------------------- | --------------------------------------------------------------------------------------------------- | -----: | ---------------- | --------------- | ------- |
| BE-1 | Domain model and repository ports     | Entities, workflow states, repository interfaces, and transition rules are defined.                 |      5 | None             | Yes             | Done    |
| BE-2 | Authentication and RBAC               | Login/session flow, customer/admin guards, and current-user context work end to end.                |      5 | BE-1             | Yes             | Done    |
| BE-3 | Submission create and file validation | Multipart upload works, file type/size validation is enforced, and pending submissions are created. |      8 | BE-1, BE-2, BE-7 | Yes             | Planned |
| BE-4 | Review workflow                       | Pending reviews can be listed, approved, or rejected, and rejection reason is required.             |      5 | BE-1, BE-2       | Yes             | Planned |
| BE-5 | Resubmission workflow                 | Resubmission is allowed only after rejection and creates a new cycle under the same order.          |      5 | BE-4             | Yes             | Planned |
| BE-6 | Tracking and history read model       | Current status, latest outcome, and review/status history can be fetched.                           |      5 | BE-1             | Yes             | Planned |
| BE-7 | File storage adapter                  | Mock/local storage works in Phase 1 and the storage interface is ready for future object storage.   |      5 | BE-1             | Yes             | Planned |
| BE-8 | Persistence adapter for Phase 2       | PostgreSQL mappings exist for users, orders, submissions, and history.                              |      8 | BE-1, BE-6, BE-7 | No, later phase | Later   |

### Cross-Cutting Testing Stories

| ID   | Story                                | Acceptance Criteria                                                                                 | Points | Depends On                                     | Parallel    | Status  |
| ---- | ------------------------------------ | --------------------------------------------------------------------------------------------------- | -----: | ---------------------------------------------- | ----------- | ------- |
| QA-1 | Unit tests for domain/workflow rules | Tests cover valid transitions, invalid transitions, rejection reason rules, and resubmission logic. |      5 | BE-1                                           | Yes         | Planned |
| QA-2 | API integration tests                | API tests cover upload, review, resubmission, and tracking endpoints with workflow enforcement.     |      5 | BE-2, BE-3, BE-4, BE-5, BE-6                   | Yes         | Planned |
| QA-3 | Playwright customer journey          | E2E coverage exists for login, upload, confirmation, tracking, and resubmission after rejection.    |      5 | FE-2, FE-3, FE-4, FE-7, BE-2, BE-3, BE-5, BE-6 | Yes         | Planned |
| QA-4 | Playwright admin journey             | E2E coverage exists for admin login, review queue, preview, approve, and reject with reason.        |      5 | FE-5, FE-6, BE-2, BE-4                         | Yes         | Planned |
| QA-5 | Contract and adapter tests           | Adapter and contract tests verify that mock and real persistence behave consistently.               |      3 | BE-1, BE-7, BE-8                               | Later phase | Later   |

## Parallel Work Plan

### Phase 1: Can Start In Parallel

- FE-1 App shell and routing
- BE-1 Domain model and repository ports
- QA-1 Unit tests for domain/workflow rules

### Phase 1: After Auth Contract Is Set

- FE-2 Customer login
- BE-2 Authentication and RBAC
- QA-2 API integration tests

### Phase 1: After Upload Contract Is Set

- FE-3 Prescription upload with preview
- BE-3 Submission create and file validation
- BE-7 File storage adapter

### Phase 1: After Review Contract Is Set

- FE-5 Admin review queue
- FE-6 Admin decision actions
- BE-4 Review workflow
- QA-4 Playwright admin journey

### Phase 1: After Tracking Contract Is Set

- FE-4 Submission confirmation and tracking view
- FE-7 Resubmission flow
- BE-5 Resubmission workflow
- BE-6 Tracking and history read model
- QA-3 Playwright customer journey

### Phase 2: Later Work

- BE-8 Persistence adapter for Phase 2
- QA-5 Contract and adapter tests

## Recommended Implementation Sequence

1. Build BE-1 and QA-1 together so domain rules are locked early.
2. Add BE-2 and FE-2 to establish authentication and role-aware UI.
3. Implement BE-3, BE-7, and FE-3 for the upload path.
4. Implement BE-4, FE-5, and FE-6 for admin review.
5. Implement BE-5, BE-6, FE-4, and FE-7 for tracking and resubmission.
6. Add Playwright coverage for customer and admin workflows.
7. Add BE-8 and adapter tests when Phase 2 persistence begins.

## Effort Summary

| Area                         | Stories      | Total Points |
| ---------------------------- | ------------ | -----------: |
| Frontend                     | FE-1 to FE-7 |           29 |
| Backend                      | BE-1 to BE-8 |           46 |
| Testing                      | QA-1 to QA-5 |           23 |
| Total Phase 1 Planning Scope |              |           98 |

## Notes

- Story points are relative estimates for planning, not calendar time.
- Phase 1 should stay mock-backed so the team can validate workflow behavior quickly.
- PostgreSQL should be introduced through adapters without changing service-layer logic.
- File contents should remain in storage, while the database stores metadata and references only.
