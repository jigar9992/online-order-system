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

## 3. Local Development Workflow

1. start the backend service
2. start the frontend application
3. sign in as a customer
4. upload a valid prescription file
5. sign in as admin
6. approve or reject the submission
7. if rejected, resubmit a replacement file
8. verify the tracking page shows the latest status

## 4. Validation Checks

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

## 5. Troubleshooting

- If upload fails, verify file type, file size, and storage permissions.
- If admin review is unavailable, verify the user has admin privileges.
- If tracking shows stale data, verify the latest submission was persisted and the tracking query is reading the correct order reference.
- If persistence behaves differently across environments, verify repository mappings and workflow state handling rather than the UI.
