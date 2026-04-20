# Online Order System Agent Guide

## Project Context

This repository documents the MVP for a prescription-based online order system.
The product supports:

- customer prescription upload with preview
- admin review and approval/rejection
- rejection reason capture and resubmission
- order tracking with workflow history

The current architecture direction is:

- frontend: React + Vite + TypeScript
- backend: NestJS + TypeScript
- API style: REST
- auth: JWT in HttpOnly cookies with role-based access
- persistence: mock/in-memory in Phase 1, PostgreSQL in Phase 2

Core rule:

- business workflow must stay inside backend domain/service logic
- storage, persistence, and file handling must be behind interfaces

## Canonical Docs

- `docs/requirements-spec.md` - source of truth for scope and acceptance criteria
- `docs/architecture-notes.md` - implementation guidance for the modular monolith
- `docs/prescription-order-mvp-architecture.md` - target architecture summary
- `docs/runbook.md` - local validation and operational checks
- `docs/prescription-order-mvp-stories.md` - story map with estimates and parallel work plan

## Working Rules

- Keep the MVP lightweight and avoid premature microservices.
- Do not trust client-supplied status values.
- Enforce workflow transitions server-side.
- Keep file contents out of the database; store only references and metadata.
- Preserve history for review actions and resubmissions.

## Multi-Agent Workflow

Use disjoint ownership when multiple agents are working:

- one agent owns frontend stories and UI flows
- one agent owns backend domain and API contracts
- one agent owns persistence and adapter work
- one agent owns test automation and verification

Coordination rules:

- announce any shared contract change before editing it
- do not overwrite another agent's files or revert their changes
- prefer contract-first changes when frontend and backend work in parallel
- keep changes small and confined to the assigned file area

Suggested handoff sequence:

1. define domain contracts and story boundaries
2. split frontend and backend implementation by module ownership
3. add tests alongside the feature area they verify
4. integrate through shared schemas and repository interfaces

## Quality Expectations

- write clear, maintainable code and documentation
- add tests for domain rules, API behavior, and browser flows
- keep the first implementation path mock-backed and replaceable
- document any assumptions that affect workflow or persistence

## Validation Expectations

Every task must include validation appropriate to the changed area.

Default policy:

- code, config, test, persistence, frontend, backend, or shared-contract changes must run full workspace validation before handoff
- docs-only changes must run `corepack pnpm format:check`
- do not mark a task complete without reporting which validation commands were run
- if any validation is skipped, call it out explicitly in the handoff with the reason
- if a command fails because of known repo-wide drift, report that clearly and distinguish it from regressions introduced by the current task

Required final validation by task type:

- frontend task: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build`, `corepack pnpm format:check`
- backend task: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build`, `corepack pnpm format:check`
- shared contracts or cross-cutting task: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build`, `corepack pnpm format:check`
- persistence or adapter task: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build`, `corepack pnpm format:check`
- test-only task that changes repo code or automated tests: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build`, `corepack pnpm format:check`
- docs-only task: `corepack pnpm format:check`

Iteration guidance:

- package-local commands in `apps/web` or `apps/api` may be used during iteration for faster feedback
- final handoff validation must use the root workspace commands so all agents report results consistently
