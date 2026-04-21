# Prescription Order MVP Requirements Specification

## 1. Purpose

Define the minimum viable product for a prescription-based online order flow where a customer uploads a prescription, an admin verifies it, the order can be manually marked delivered, and the customer can track the full workflow.

This document is the source of truth for MVP scope and acceptance criteria.

## 2. Business Goal

Enable a controlled prescription approval process that reduces manual handling errors and makes order processing traceable from upload through delivery.

## 3. Users and Roles

### Customer

- authenticated user who uploads a prescription, tracks the order, and resubmits after rejection

### Admin

- internal user who reviews prescription submissions, approves or rejects them, and manually marks approved orders as delivered

## 4. MVP Scope

### In scope

- authenticated customer upload flow
- image and PDF prescription uploads
- preview before submission
- admin verification and decisioning
- rejection reason capture
- resubmission after rejection
- order status tracking with workflow history
- manual delivery update after approval
- status workflow enforcement
- database-agnostic persistence contract

### Out of scope

- payments
- delivery partner integrations
- automated notifications
- prescription OCR or AI validation
- advanced reporting

## 5. Core Workflow

### 5.1 Upload

1. Customer signs in.
2. Customer uploads a prescription file.
3. System validates file type and size.
4. System stores the file and creates a submission with status `pending`.
5. Customer sees confirmation and a reference/order identifier.

### 5.2 Admin Review

1. Admin opens the approval queue.
2. Admin views file preview and submission details.
3. Admin approves or rejects the submission.
4. If rejected, admin records a rejection reason.

### 5.3 Resubmission

1. Customer views a rejected submission.
2. Customer uploads a replacement prescription.
3. System records the new file as a new submission under the same order context.
4. Workflow returns to `pending`.

### 5.4 Delivery Update

1. Admin opens an approved order from the submission detail view.
2. Admin marks the order as delivered.
3. System records an order-level history event and updates the order status to `delivered`.

### 5.5 Order Tracking

1. Customer opens the tracking page.
2. System shows current order status and latest review outcome.
3. System shows submission events and order milestones in workflow history.
4. Status updates continue until the order reaches `delivered`.

## 6. Status Model

### Submission status

- `pending`
- `approved`
- `rejected`

### Order status

- `pending`
- `approved`
- `delivered`

### Rules

- a new upload starts in `pending`
- only admins can move a submission from `pending` to `approved` or `rejected`
- resubmission is allowed only after rejection
- each resubmission creates a new review cycle
- once approved, only admins can move the order to `delivered`
- order history must preserve both review events and delivery milestones

## 7. Functional Requirements

### FR-1 Customer upload

- The system must allow an authenticated customer to upload a prescription image or PDF.
- The UI must provide a preview of the selected file before submission.
- The system must reject unsupported file types.

### FR-2 Submission persistence

- The system must persist the uploaded file metadata and submission record.
- The system must keep the workflow state associated with the submission.

### FR-3 Admin verification

- The system must provide an admin review queue.
- The system must allow an admin to approve or reject a pending submission.
- The system must capture a rejection reason when rejected.

### FR-4 Resubmission

- The system must allow a customer to resubmit only after rejection.
- The system must preserve submission history across resubmissions.

### FR-5 Order tracking

- The system must allow a customer to view current order status.
- The system must show the latest review decision and workflow history.

### FR-6 Delivery progression

- The system must allow only admins to mark approved orders as delivered.
- The system must reject delivery updates for orders that are not in `approved`.

### FR-7 Status workflow

- The system must enforce allowed transitions.
- The system must prevent direct transitions that bypass admin review.

### FR-8 Data portability

- The system must keep business logic independent of the underlying database engine.
- The data model must be representable in both PostgreSQL and MongoDB.

## 8. Non-Functional Requirements

- The system should handle common image and PDF uploads reliably.
- The system should preserve an audit trail of review actions and delivery changes.
- The system should be structured so a database adapter can be replaced without changing the workflow rules.
- The system should expose clear validation and error messages for failed uploads, review actions, and delivery updates.

## 9. Acceptance Criteria

### AC-1 Upload

- Given a signed-in customer, when they upload a valid prescription file, then the system creates a pending submission and returns a reference.

### AC-2 Invalid upload

- Given a signed-in customer, when they upload an unsupported file type, then the system rejects the upload with a validation message.

### AC-3 Admin approval

- Given a pending submission, when an admin approves it, then the system marks the submission approved and the order eligible for delivery progression.

### AC-4 Admin rejection

- Given a pending submission, when an admin rejects it, then the system stores the rejection reason and marks the submission rejected.

### AC-5 Resubmission

- Given a rejected submission, when the customer uploads a new prescription, then the system starts a new pending review cycle and preserves the prior submission history.

### AC-6 Tracking

- Given an order, when the customer opens tracking, then the system displays the current status, latest review outcome, and workflow history.

### AC-7 Delivery

- Given an approved order, when an admin marks it delivered, then the system updates the order status to `delivered` and records the delivery milestone in history.

### AC-8 Data abstraction

- Given a different persistence adapter, when the workflow runs, then the business behavior remains the same.

## 10. Open Questions

- Whether customers can create multiple active orders in parallel in the first release.
