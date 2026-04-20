# Prescription Order MVP Architecture Notes

## 1. Architecture Intent

Design the MVP as a thin UI over a domain service layer, with persistence and file storage isolated behind interfaces so the implementation can later run on PostgreSQL or MongoDB without rewriting workflow logic.

## 2. Frontend Structure

### Customer screens

- login
- prescription upload with preview
- submission confirmation
- order tracking
- rejected submission details with resubmission action

### Admin screens

- review queue
- submission detail and preview
- approve/reject action panel
- review history view

## 3. Backend Structure

### Recommended service boundaries

- authentication and user context
- prescription submission service
- admin review service
- order tracking service
- file upload service

### API behavior

- create prescription submission
- fetch submission and order status
- list pending admin reviews
- approve submission
- reject submission with reason
- create resubmission after rejection

### Workflow enforcement

- enforce transitions in the service layer
- prevent direct status writes from the client
- record each review event and status change

## 4. Persistence Design

### Domain-first model

Keep a canonical domain model with entities for:

- user
- order
- prescription submission
- review decision
- status history

### Adapter pattern

Use repository interfaces such as:

- user repository
- order repository
- prescription repository
- audit/status history repository

This lets the same application logic work with relational or document storage.

### Data storage guidance

- store file metadata in the primary database
- store file content in an object-storage-compatible layer
- keep only references and metadata in the domain records

## 5. Data Considerations

### PostgreSQL mapping

- users, orders, submissions, and history can map to normalized tables
- foreign keys can enforce relationships

### MongoDB mapping

- order and submission history can be embedded or linked by identifiers
- repositories should hide document shape differences from services

## 6. File Handling

- accept image and PDF files only
- validate size and MIME type before persistence
- generate a server-side reference for each uploaded file
- keep preview support on the frontend using the selected local file and/or stored file URL

## 7. Security and Controls

- require authentication for customer upload and tracking
- restrict admin routes to verified admin users
- validate all workflow transitions server-side
- avoid trusting client-supplied status values

## 8. Suggested Implementation Order

1. define domain entities and repository interfaces
2. implement upload and preview flow
3. implement admin review workflow
4. implement resubmission flow
5. implement tracking view and history
6. wire storage and database adapters

## 9. Notes for Future Expansion

- payments can be added as a separate order lifecycle step
- delivery integration can consume approved orders later
- notifications can be attached to status-change events without changing the core model
