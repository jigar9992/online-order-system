# Prescription Order MVP Runbook

## 1. Purpose

Provide the basic operational checks for local development and MVP validation.

## 2. Environment Setup

- ensure the application can read configuration for:
  - `PRESCRIPTION_FILE_STORAGE_DIR` if you want to override the default local upload directory
  - `AUTH_JWT_SECRET` for signing HttpOnly auth cookies
  - optional `AUTH_COOKIE_SECURE=true` outside local development
- Phase 1 does not require a database connection or schema bootstrap; workflow state is stored in memory by default
- confirm the upload directory is writable
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
- Frontend API base URL defaults to `http://localhost:3000/api`; override with `VITE_API_BASE_URL` if needed

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
   - phase 1 seeded user: `customer@example.com` / `password`
4. upload a valid prescription file
5. sign in as admin
   - phase 1 seeded user: `admin@example.com` / `password`
6. approve or reject the submission
7. verify the API reflects the review outcome and history
8. treat resubmission and tracking UI checks as in-progress work until the placeholder screens are replaced with live API wiring

## 7. Validation Checks

### Upload checks

- valid image and PDF uploads succeed
- unsupported file types fail with a clear validation message
- large or malformed files are rejected

### Workflow checks

- new uploads start in `pending`
- admin can approve or reject only pending items
- rejected items expose a rejection reason
- resubmission is intended to reopen the workflow as `pending`, but the replacement-file path still needs end-to-end hardening
- tracking, resubmission, and file access must enforce customer ownership server-side

### Persistence checks

- initial upload bytes are stored outside the workflow state store and can be fetched back through the file endpoint
- submission history remains available after resubmission
- status history is preserved
- PostgreSQL remains a later-phase adapter behind the same business workflow boundary

## 8. Common Fixes / Issues Resolved

- Turbo could not resolve the pnpm binary in this shell, so root commands now use `corepack pnpm` recursion instead of `turbo run`.
- `pnpm` was not exposed in PATH initially; Corepack was used to install and run pnpm consistently.
- Vite's config loading on Windows triggered `spawn EPERM` while bundling the config file; the web app now builds with the default Vite config.
- ESLint was scanning generated `dist` output until the shared ignore list was expanded to exclude build artifacts.
- Recursive pnpm forwarding of `--fix` caused argument parsing problems; package-local `lint:fix` scripts now call ESLint directly.
- The shared `types` package now owns the workflow DTOs and helpers directly instead of proxying through the older contracts folder.
- `corepack pnpm test` is currently green, but some shared packages still use placeholder test scripts, so a green workspace run is not full feature coverage.

## 9. Troubleshooting

- If upload fails, verify file type, file size, and storage permissions.
- If admin review is unavailable, verify the user has admin privileges.
- If tracking shows stale data, verify the latest submission was persisted and the tracking query is reading the correct order reference.
- If resubmission appears to succeed but the replacement file cannot be previewed later, verify the file-storage path and resubmission persistence flow rather than the UI first.
- If persistence behaves differently across environments, verify repository mappings and workflow state handling rather than the UI.
