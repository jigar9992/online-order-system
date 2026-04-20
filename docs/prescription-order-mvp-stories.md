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
- shared workflow types, status helpers, and upload constraints
- real login/session handling with role-aware routing, backend guards, and RBAC enforcement
- customer multipart upload API with MIME/size validation and local file persistence
- Phase 1 file storage abstraction with local-disk adapter and in-memory workflow store
- frontend customer upload page with local preview, API submit, and success confirmation
- backend review list/approve/reject endpoints and tracking summary endpoint

### Remaining

- API-backed customer tracking screen and resubmission UX
- API-backed admin queue and decision screens
- resubmission hardening so replacement uploads reuse multipart validation and file storage
- customer ownership enforcement for tracking, resubmission, and file access
- workflow-focused automated tests for review, resubmission, tracking, and history
- persistence adapter for PostgreSQL
- final cleanup of placeholder package-level test scripts once real coverage exists there

### Validation Notes

- `corepack pnpm test` is green across the workspace. Current meaningful coverage includes frontend auth/upload component tests plus backend auth/upload integration tests.
- `corepack pnpm validate` currently fails at `format:check` because of repo-wide formatting drift, not because of the MVP flows covered by tests.

## Story Map

### Frontend Stories

| ID   | Story                                     | Acceptance Criteria                                                                   | Points | Depends On       | Parallel | Status  |
| ---- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -----: | ---------------- | -------- | ------- |
| FE-1 | App shell and routing                     | Protected routes, role-aware navigation, auth bootstrap, shared layout are in place.  |      3 | None             | Yes      | Done    |
| FE-2 | Customer login                            | Customer can log in, session state is handled, and invalid credentials show errors.   |      3 | FE-1, BE-2       | Yes      | Done    |
| FE-3 | Prescription upload with preview          | Customer can choose an image/PDF, preview it, see validation messages, and submit it. |      5 | FE-1, BE-3, BE-7 | Yes      | Done    |
| FE-4 | Submission confirmation and tracking view | Customer sees the reference ID, current order status, and latest review history.      |      3 | FE-1, BE-6       | Yes      | Partial |
| FE-5 | Admin review queue                        | Admin can see pending submissions, apply basic filtering, and open submission detail. |      5 | FE-1, BE-4       | Yes      | Partial |
| FE-6 | Admin decision actions                    | Admin can approve or reject a submission and enter a rejection reason when rejecting. |      5 | FE-5, BE-4       | Yes      | Partial |
| FE-7 | Resubmission flow                         | Customer can resubmit after rejection and keep the previous history visible.          |      5 | FE-4, BE-5       | Yes      | Planned |

### Backend Stories

| ID   | Story                                 | Acceptance Criteria                                                                                 | Points | Depends On       | Parallel        | Status  |
| ---- | ------------------------------------- | --------------------------------------------------------------------------------------------------- | -----: | ---------------- | --------------- | ------- |
| BE-1 | Domain model and repository ports     | Entities, workflow states, repository interfaces, and transition rules are defined.                 |      5 | None             | Yes             | Done    |
| BE-2 | Authentication and RBAC               | Login/session flow, customer/admin guards, and current-user context work end to end.                |      5 | BE-1             | Yes             | Done    |
| BE-3 | Submission create and file validation | Multipart upload works, file type/size validation is enforced, and pending submissions are created. |      8 | BE-1, BE-2, BE-7 | Yes             | Done    |
| BE-4 | Review workflow                       | Pending reviews can be listed, approved, or rejected, and rejection reason is required.             |      5 | BE-1, BE-2       | Yes             | Done    |
| BE-5 | Resubmission workflow                 | Resubmission is allowed only after rejection and creates a new cycle under the same order.          |      5 | BE-4             | Yes             | Partial |
| BE-6 | Tracking and history read model       | Current status, latest outcome, and review/status history can be fetched.                           |      5 | BE-1             | Yes             | Partial |
| BE-7 | File storage adapter                  | Mock/local storage works in Phase 1 and the storage interface is ready for future object storage.   |      5 | BE-1             | Yes             | Done    |
| BE-8 | Persistence adapter for Phase 2       | PostgreSQL mappings exist for users, orders, submissions, and history.                              |      8 | BE-1, BE-6, BE-7 | No, later phase | Later   |

### Cross-Cutting Testing Stories

| ID   | Story                                | Acceptance Criteria                                                                                 | Points | Depends On                                     | Parallel    | Status  |
| ---- | ------------------------------------ | --------------------------------------------------------------------------------------------------- | -----: | ---------------------------------------------- | ----------- | ------- |
| QA-1 | Unit tests for domain/workflow rules | Tests cover valid transitions, invalid transitions, rejection reason rules, and resubmission logic. |      5 | BE-1                                           | Yes         | Planned |
| QA-2 | API integration tests                | API tests cover upload, review, resubmission, and tracking endpoints with workflow enforcement.     |      5 | BE-2, BE-3, BE-4, BE-5, BE-6                   | Yes         | Partial |
| QA-3 | Playwright customer journey          | E2E coverage exists for login, upload, confirmation, tracking, and resubmission after rejection.    |      5 | FE-2, FE-3, FE-4, FE-7, BE-2, BE-3, BE-5, BE-6 | Yes         | Planned |
| QA-4 | Playwright admin journey             | E2E coverage exists for admin login, review queue, preview, approve, and reject with reason.        |      5 | FE-5, FE-6, BE-2, BE-4                         | Yes         | Planned |
| QA-5 | Contract and adapter tests           | Adapter and contract tests verify that mock and real persistence behave consistently.               |      3 | BE-1, BE-7, BE-8                               | Later phase | Later   |

## Next Story Recommendation

### Priority Slice

These are the next stories that best fit the current repo state and the AGENTS.md ownership model:

1. `BE-5` Resubmission workflow hardening
2. `BE-6` Tracking and history read model hardening
3. `FE-5` Admin review queue API wiring
4. `FE-6` Admin decision actions
5. `QA-1` Unit tests for workflow rules
6. `QA-2` Expand API integration coverage for review, resubmission, and tracking

### Why This Slice Is Next

- `BE-3`, `BE-4`, and `BE-7` are already in place, so the biggest Phase 1 backend gaps are safe resubmission and customer-safe tracking rather than first-time upload.
- `FE-5` and `FE-6` already have route and screen scaffolding, making them the fastest path to replacing placeholders with live admin workflow behavior.
- `FE-4` depends on the same tracking contract, so hardening `BE-6` now unblocks both customer tracking and later resubmission UI work.
- `QA-1` and `QA-2` should move with the backend slice so workflow rules are locked before PostgreSQL work starts.

### Multi-Agent Handoff Plan

1. Backend domain/API owner
   - Own `BE-5` and `BE-6`
   - Announce any shared contract change before editing `packages/types` or request/response shapes
   - Keep ownership in `apps/api/src/modules/submissions`, `apps/api/src/modules/tracking`, `apps/api/src/modules/files`, and related ports/adapters
2. Frontend owner
   - Own `FE-5` and `FE-6`
   - Stay within `apps/web/src/features/admin-review` until the backend contracts are stable
   - Reuse existing auth/session flow and keep status rendering driven by backend responses rather than client-authored workflow state
3. Persistence/adapter owner
   - Support the backend lane if `BE-5` or `BE-6` need adapter changes
   - Keep ownership in `apps/api/src/adapters` and `apps/api/src/ports`
   - Document any Phase 2 contract adjustments needed before `BE-8`
4. Test owner
   - Add `QA-1` and expand `QA-2` alongside the backend changes they verify
   - Avoid broad browser work until admin and tracking screens stop using placeholders

### Contract-First Notes

- If resubmission changes from metadata-only payloads to multipart upload, announce that contract first and update both the story plan and consuming screens together.
- Tracking and file access must enforce customer ownership server-side; do not rely on hidden routes or client-side checks.
- Keep file bytes behind `FileStoragePort` and workflow state behind backend services and ports; do not push workflow logic into the web app.

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
- QA-2 API integration tests
- QA-4 Playwright admin journey

### Phase 1: After Tracking Contract Is Set

- FE-4 Submission confirmation and tracking view
- FE-7 Resubmission flow
- BE-5 Resubmission workflow
- BE-6 Tracking and history read model
- QA-1 Unit tests for domain/workflow rules
- QA-2 API integration tests
- QA-3 Playwright customer journey

### Phase 2: Later Work

- BE-8 Persistence adapter for Phase 2
- QA-5 Contract and adapter tests

## Recommended Implementation Sequence

1. Lock the next contract slice around `BE-5` and `BE-6`, especially multipart resubmission and customer ownership enforcement.
2. Add `QA-1` and expand `QA-2` while the workflow changes are still fresh.
3. Wire `FE-5` and `FE-6` to the live review APIs once the review and resubmission contracts are stable.
4. Finish `FE-4` and then `FE-7` on top of the hardened tracking contract.
5. Add Playwright coverage for customer and admin workflows after the placeholder screens are replaced.
6. Add `BE-8` and `QA-5` when Phase 2 persistence begins.

## Effort Summary

| Area                         | Stories      | Total Points |
| ---------------------------- | ------------ | -----------: |
| Frontend                     | FE-1 to FE-7 |           29 |
| Backend                      | BE-1 to BE-8 |           46 |
| Testing                      | QA-1 to QA-5 |           23 |
| Total Phase 1 Planning Scope |              |           98 |

## Notes

- Story points are relative estimates for planning, not calendar time.
- Phase 1 should stay mock-backed for workflow state, with local file storage for uploaded payloads, so the team can validate behavior quickly.
- PostgreSQL should be introduced through adapters without changing service-layer logic.
- File contents should remain in storage, while the database stores metadata and references only.
- Before customer tracking and file preview are treated as production-ready, Phase 1 still needs ownership enforcement and resubmitted-file persistence.
