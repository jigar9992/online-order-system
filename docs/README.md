# Prescription Order MVP Docs

This folder contains the MVP documentation pack for the prescription upload and approval workflow.

## Documents

- [requirements-spec.md](requirements-spec.md): source of truth for business requirements, workflow, and acceptance criteria
- [architecture-notes.md](architecture-notes.md): implementation guidance for frontend, backend, persistence, and file handling
- [prescription-order-mvp-architecture.md](prescription-order-mvp-architecture.md): target architecture summary and implementation assumptions
- [prescription-order-mvp-stories.md](prescription-order-mvp-stories.md): story map with estimates, dependencies, and parallel work plan
- [runbook.md](runbook.md): local setup and operational checks for development and validation

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
