# Online Order System

Prescription-based online ordering MVP built as a pnpm workspace with a React web app and a NestJS API.

## Current MVP Status

- Customer login, prescription upload, preview, and confirmation are implemented.
- Admin review queue, submission detail, approve/reject actions, and manual delivery progression are implemented.
- Customer tracking, rejection visibility, resubmission, and workflow history are implemented.
- Auth uses JWT session cookies with RBAC, and file access enforces customer ownership server-side.
- Phase 1 persistence stays replaceable through an in-memory workflow store and local file-storage adapter.

## Workspace Layout

- `apps/web`: React + Vite customer/admin UI
- `apps/api`: NestJS API and workflow domain
- `packages/types`: shared workflow types and API contracts
- `packages/ui`: reserved for future shared React components
- `packages/utils`: reserved for future shared utilities
- `packages/config`: shared TypeScript, ESLint, and Prettier config

## Root Commands

- `corepack pnpm dev`
- `corepack pnpm build`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm format:check`

## Docs

- [docs/requirements-spec.md](docs/requirements-spec.md)
- [docs/architecture-notes.md](docs/architecture-notes.md)
- [docs/prescription-order-mvp-architecture.md](docs/prescription-order-mvp-architecture.md)
- [docs/prescription-order-mvp-stories.md](docs/prescription-order-mvp-stories.md)
- [docs/runbook.md](docs/runbook.md)
