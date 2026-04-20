# Prescription Order MVP Docs

This folder contains the MVP documentation pack for the prescription upload and approval workflow.

## Current Status

The monorepo scaffold is in place and validated:

- `apps/web` contains the React + Vite customer/admin UI shell
- `apps/api` contains the NestJS API shell and workflow modules
- `packages/types` contains shared DTOs, enums, and workflow helpers
- `packages/ui` and `packages/utils` are reserved for shared code
- `packages/config` contains shared TypeScript, ESLint, and Prettier config

Validation commands currently work:

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm format:check`
- `corepack pnpm validate`
- `corepack pnpm fix`

Local dev endpoints:

- Web app: `http://localhost:5173`
- API: `http://localhost:3000`
- Main customer upload route: `http://localhost:5173/customer/upload`
- Admin review route: `http://localhost:5173/admin/reviews`

## Documents

- [requirements-spec.md](requirements-spec.md): source of truth for business requirements, workflow, and acceptance criteria
- [architecture-notes.md](architecture-notes.md): implementation guidance for the workspace layout, backend workflow, and shared contracts
- [prescription-order-mvp-architecture.md](prescription-order-mvp-architecture.md): target architecture summary, tech stack, and implementation status
- [prescription-order-mvp-stories.md](prescription-order-mvp-stories.md): story map with estimates, dependencies, completed items, and remaining work
- [runbook.md](runbook.md): local setup, validation commands, dev URLs, and common fix notes

## Scope

The MVP covers:

- customer prescription upload with preview
- admin review and approval/rejection
- resubmission after rejection
- order status tracking
- a storage-agnostic data layer that can support PostgreSQL or MongoDB

The MVP does not include:

- payments
- delivery carrier integration
- notifications
- advanced reporting or analytics
