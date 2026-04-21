# Prescription Order MVP Docs

This folder contains the current documentation set for the prescription upload, review, delivery, and tracking MVP.

## Current Status

- The customer flow covers login, upload with preview, confirmation, tracking, and resubmission after rejection.
- The admin flow covers login, pending review queue, submission detail with preview, approve/reject actions, and manual delivery updates.
- Workflow history now records both submission events and order milestones, so delivered status appears cleanly in tracking.
- File bytes stay behind the file-storage adapter, and file reads enforce role and ownership checks server-side.
- The repo’s main remaining work is Phase 2 PostgreSQL persistence plus broader E2E coverage.

## Validation

The workspace is expected to validate through:

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm format:check`

## Local Dev URLs

- Web app: `http://localhost:5173`
- API: `http://localhost:3002`
- Customer upload route: `http://localhost:5173/customer/upload`
- Customer tracking route: `http://localhost:5173/customer/tracking`
- Admin review route: `http://localhost:5173/admin/reviews`

## Documents

- [requirements-spec.md](requirements-spec.md): source of truth for workflow requirements and acceptance criteria
- [architecture-notes.md](architecture-notes.md): implementation guidance and current architecture shape
- [prescription-order-mvp-architecture.md](prescription-order-mvp-architecture.md): architecture summary, endpoint map, and implementation status
- [prescription-order-mvp-stories.md](prescription-order-mvp-stories.md): story map, completion status, and remaining follow-up work
- [runbook.md](runbook.md): setup, validation commands, local flows, and troubleshooting notes
