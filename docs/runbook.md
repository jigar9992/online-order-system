# Prescription Order MVP Runbook

## 1. Purpose

Provide the basic operational checks for local development and MVP validation.

## 2. Environment Setup

- ensure the application can read configuration for:
  - database connection
  - file storage location or object storage endpoint
  - admin credentials or role configuration
- create the required database schema or collections through the app bootstrap/migration step
- confirm the upload directory or object-storage target is writable
- install dependencies with `corepack pnpm install`
- if `pnpm` is not available in PATH, use `corepack pnpm` directly

## 3. Workspace Commands

- `corepack pnpm dev`
- `corepack pnpm build`
- `corepack pnpm lint`
- `corepack pnpm lint:fix`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm format:check`
- `corepack pnpm format`
- `corepack pnpm validate`
- `corepack pnpm fix`

## 4. Dev URLs

When `corepack pnpm dev` is running:

- Web app: `http://localhost:5173`
- API: `http://localhost:3000`
- Customer upload page: `http://localhost:5173/customer/upload`
- Customer tracking page: `http://localhost:5173/customer/tracking`
- Admin review queue: `http://localhost:5173/admin/reviews`
- API health/bootstrap check: `http://localhost:3000/api/auth/me`

## 5. Getting Started

1. install dependencies with `corepack pnpm install`
2. start the workspace with `corepack pnpm dev`
3. build all workspace packages with `corepack pnpm build`
4. run `corepack pnpm validate` before committing changes
5. use `corepack pnpm fix` to auto-format and auto-fix lint issues

## 6. Local Development Workflow

1. start the backend service
2. start the frontend application
3. sign in as a customer
4. upload a valid prescription file
5. sign in as admin
6. approve or reject the submission
7. if rejected, resubmit a replacement file
8. verify the tracking page shows the latest status

## 7. Validation Checks

### Upload checks

- valid image and PDF uploads succeed
- unsupported file types fail with a clear validation message
- large or malformed files are rejected

### Workflow checks

- new uploads start in `pending`
- admin can approve or reject only pending items
- rejected items expose a rejection reason
- resubmission reopens the workflow as `pending`
- approved orders can progress to `delivered`

### Persistence checks

- submission history remains available after resubmission
- status history is preserved
- switching between PostgreSQL and MongoDB adapters does not change workflow behavior

## 8. Common Fixes / Issues Resolved

- Turbo could not resolve the pnpm binary in this shell, so root commands now use `corepack pnpm` recursion instead of `turbo run`.
- `pnpm` was not exposed in PATH initially; Corepack was used to install and run pnpm consistently.
- Vite's config loading on Windows triggered `spawn EPERM` while bundling the config file; the web app now builds with the default Vite config.
- ESLint was scanning generated `dist` output until the shared ignore list was expanded to exclude build artifacts.
- Recursive pnpm forwarding of `--fix` caused argument parsing problems; package-local `lint:fix` scripts now call ESLint directly.
- The shared `types` package now owns the workflow DTOs and helpers directly instead of proxying through the older contracts folder.

## 9. Troubleshooting

- If upload fails, verify file type, file size, and storage permissions.
- If admin review is unavailable, verify the user has admin privileges.
- If tracking shows stale data, verify the latest submission was persisted and the tracking query is reading the correct order reference.
- If persistence behaves differently across environments, verify repository mappings and workflow state handling rather than the UI.
