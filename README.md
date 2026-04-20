# Online Order System

Monorepo scaffold for the prescription order MVP.

## Workspace Layout

- `apps/web`: React + Vite customer/admin UI
- `apps/api`: NestJS API and workflow domain
- `packages/types`: shared request/response types and workflow literals
- `packages/ui`: shared React components
- `packages/utils`: shared utilities
- `packages/config`: shared TypeScript presets for the workspace

## Root Commands

- `pnpm dev`
- `pnpm build`
- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`

Turbo fans those commands out across every workspace package that defines the matching script.
