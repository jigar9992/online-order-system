# Prescription Order MVP Runbook

## 1. Purpose

Provide the local setup, validation, and workflow checks for the current MVP.

## 2. Environment Setup

- ensure the application can read configuration for:
  - `PRESCRIPTION_FILE_STORAGE_DIR` if you want to override the default local upload directory
  - `AUTH_JWT_SECRET` for signing HttpOnly auth cookies
  - optional `AUTH_COOKIE_SECURE=true` outside local development
  - optional `API_PORT` to override the local API port; default is `3002`
  - optional `WEB_ORIGIN` to override allowed browser origins for direct API calls; defaults cover local Vite ports `5173`-`5175`
  - optional `VITE_API_BASE_URL` when the frontend should call a fully qualified API URL instead of the local dev proxy
  - optional `VITE_API_PROXY_TARGET` if the Vite dev server should proxy `/api` to a different backend URL
- Phase 1 does not require a database connection or schema bootstrap; workflow state is stored in memory by default
- confirm the upload directory is writable
- install dependencies with `corepack pnpm install`

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
- API: `http://localhost:3002`
- Customer upload page: `http://localhost:5173/customer/upload`
- Customer tracking page: `http://localhost:5173/customer/tracking`
- Admin review queue: `http://localhost:5173/admin/reviews`
- API auth check: `http://localhost:3002/api/auth/me`
- Frontend API base URL defaults to same-origin `/api` in dev and is proxied to `http://localhost:3002`; override with `VITE_API_BASE_URL` if needed

## 5. Getting Started

1. install dependencies with `corepack pnpm install`
2. start the workspace with `corepack pnpm dev`
3. build all workspace packages with `corepack pnpm build`
4. run the full validation set before handoff:
   - `corepack pnpm lint`
   - `corepack pnpm typecheck`
   - `corepack pnpm test`
   - `corepack pnpm build`
   - `corepack pnpm format:check`

## 6. Local Development Workflow

1. start the backend service
2. start the frontend application
3. sign in as a customer
   - seeded user: `customer@example.com` / `password`
4. upload a valid prescription file
5. copy the returned order reference from the confirmation panel
6. sign in as admin
   - seeded user: `admin@example.com` / `password`
7. review the submission and approve or reject it
8. if rejected, sign back in as the customer and resubmit from tracking
9. if approved, sign back in as admin and mark the order delivered
10. confirm the customer tracking page shows the final delivered milestone

## 7. Validation Checks

### Upload checks

- valid image and PDF uploads succeed
- unsupported file types fail with a clear validation message
- large or malformed files are rejected

### Workflow checks

- new uploads start in `pending`
- admin can approve or reject only pending submissions
- rejected items require and expose a rejection reason
- resubmission is allowed only after rejection
- only approved orders can be marked delivered
- tracking history preserves both submission review events and order milestones
- tracking, resubmission, and file access enforce customer ownership server-side

### Persistence checks

- upload bytes are stored outside the workflow state store and can be fetched through the file endpoint
- submission history remains available after resubmission
- delivery updates remain visible through order history
- PostgreSQL remains a later-phase adapter behind the same workflow boundary

## 8. Common Fixes / Issues Resolved

- Root commands use `corepack pnpm` recursion instead of `turbo run` for stability in this Windows shell.
- Vite’s config loading on Windows previously triggered `spawn EPERM`; the repo now builds with the stable default setup.
- ESLint ignores generated build output.
- The shared `types` package owns the workflow DTOs and helpers directly.
- Shared packages still contain placeholder scripts where functionality has not been implemented yet; feature coverage currently lives in `apps/web` and `apps/api`.

## 9. Troubleshooting

- If upload fails, verify file type, file size, and storage permissions.
- If admin review is unavailable, verify the user has admin privileges.
- If delivery cannot be triggered, verify the latest review outcome is `approved`.
- If tracking shows stale data, verify the order reference and the latest workflow event persisted in the store.
- If file preview fails after resubmission, verify the file-storage path and file-access authorization rather than the UI first.
- If login calls return HTML or unexpected CORS errors, verify another local app is not occupying the API target port and confirm the Vite proxy is pointing to the correct backend URL.
