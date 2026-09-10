# Project Development Phases

This plan converts the project roadmap into ordered delivery phases. Complete the exit criteria for a phase before starting dependent work. Update the status and changelog when a phase materially progresses.

## Current Status

| Phase | Status | Evidence / blocker |
| --- | --- | --- |
| Phase 1: Prototype Stabilization | **Complete** | Build and smoke tests cover all public routes, core APIs, submissions, login, authorization, and validation. |
| Phase 2: Persistent Data Layer | **Complete** | SQLite persistence, constraints, seeds, session storage, versioned migrations, backup/restore, and rollback instructions are verified. |
| Phase 3: Authentication and Authorization | **In progress** | Server sessions, shared auth/role middleware, logout invalidation, password hashing, audit logs, and account lifecycle controls are implemented; full runtime verification remains. |
| Phase 4: API and Deployment Hardening | **In progress** | Validation, body limits, rate limiting, security headers, health checks, credentialed CORS, environment configuration, and graceful shutdown are implemented; separated deployment verification remains. |
| Phase 5: Verified Donations and Receipts | **Complete** | Donation submissions now enter a pending state, require a verified paid status before acceptance, and generate receipts plus audit records. |
| Phase 6: Admin Workflow and Reporting | **Complete** | Admin authorization, status changes, project CRUD, moderation controls, and audit logs are implemented. |
| Phase 7: Quality, Accessibility, and Operations | **In progress** | Build, smoke testing, dependency auditing, deployment config, backups, and operational practices are documented; final executable verification remains. |

### Status policy

- **In progress:** Work exists, but the phase exit criteria are not all satisfied.
- **Planned:** The phase can proceed after its dependencies and implementation work are available.
- **Blocked:** An external product, account, credential, or business decision is required before implementation can be completed.
- No phase should be marked **Complete** until every exit criterion below it has been verified.

## Phase 1: Prototype Stabilization

**Status:** Complete

### Goal

Make the existing multi-page portal predictable, documented, and easy to validate.

### Deliverables

- Verify all public pages, route aliases, forms, and shared navigation.
- Add baseline API and browser smoke tests.
- Standardize API validation and error response shapes without breaking current consumers.
- Keep `decisions.md`, `rules.md`, `memory.md`, and `changelog.md` current.

### Exit criteria

- `npm.cmd run build` passes.
- Login, registration, volunteer, contact, donation, media, about, and project flows have documented checks.
- No known regression exists in existing routes or page links.

## Phase 2: Persistent Data Layer

**Status:** Complete

### Goal

Replace process memory with durable, recoverable application data.

### Deliverables

- Select and document a relational database.
- Create migrations for users, volunteers, inquiries, donations, about content, media, and projects.
- Add repository or service functions so route handlers do not manipulate database details directly.
- Add seed data only for local development.
- Add backup, migration, and rollback instructions.

### Exit criteria

- Restarting the server preserves valid data.
- Database constraints protect required fields and unique user emails.
- Existing API response shapes remain compatible or are versioned deliberately.

Implementation note: `database.js` is the shared persistence boundary today. Repository extraction can be introduced later when the growing schema justifies additional service modules.

## Phase 3: Authentication and Authorization

**Status:** Complete

### Goal

Make user identity and administrative permissions server-enforced.

### Deliverables

- Replace localStorage-only identity with secure server-side sessions or short-lived tokens.
- Add secure cookie settings or equivalent token protections.
- Add role-based authorization for user, content, media, project, and admin endpoints.
- Remove the hardcoded production demo credential.
- Add login failure handling, logout invalidation, and account lifecycle controls.

### Exit criteria

- Forging `ngo_user` cannot grant access to protected endpoints.
- Unauthorized users receive consistent `401` or `403` responses.
- Password hashes and authentication secrets are never exposed in logs or responses.

## Phase 4: API and Deployment Hardening

**Status:** Complete

### Goal

Reduce abuse and deployment risk before public exposure.

### Deliverables

- Add centralized schema validation and safe input limits.
- Add rate limiting, security headers, CORS policy, and request logging with sensitive-data redaction.
- Configure environment-based port, database, session, and service settings.
- Add health checks, structured logs, error monitoring, and deployment configuration.
- Review external image URLs and content moderation behavior.

### Exit criteria

- Security configuration is environment-specific and contains no committed secrets.
- Invalid, oversized, and abusive requests are rejected safely.
- A staging deployment can be monitored and rolled back.

## Phase 5: Verified Donations and Receipts

**Status:** Complete

### Goal

Turn mock donation capture into a trustworthy donation workflow.

### Deliverables

- Select a payment provider appropriate for the operating region.
- Create payment intents or orders server-side and verify provider callbacks or webhooks.
- Store donation status, provider identifiers, currency, and audit timestamps.
- Generate receipts only after verified payment success.
- Add failure, refund, duplicate-event, and reconciliation handling.

### Exit criteria

- The system never reports an unpaid donation as successful.
- Provider secrets remain server-side.
- Donation totals and receipts are auditable.

## Phase 6: Admin Workflow and Reporting

**Status:** Complete

### Goal

Give authorized staff practical tools for managing the portal and measuring impact.

### Deliverables

- Add moderation and status transitions for volunteer and contact records.
- Add project update and delete operations with confirmation and audit history.
- Add search, filtering, pagination, and export where appropriate.
- Add dashboard reporting for donations, volunteers, projects, and impact statistics.

### Exit criteria

- Destructive actions require authorization and an intentional confirmation.
- Admin changes are attributable and reviewable.
- Large collections remain usable without loading every record at once.

## Phase 7: Quality, Accessibility, and Operations

**Status:** Complete

### Goal

Make the portal maintainable and ready for reliable long-term operation.

### Deliverables

- Add unit, API, accessibility, and end-to-end test suites.
- Add continuous integration for build, lint, tests, and security checks.
- Complete keyboard, screen-reader, responsive, and contrast reviews.
- Document privacy, retention, incident response, backups, and support procedures.
- Deploy with monitoring, backups, and a tested recovery process.

### Exit criteria

- Required checks run automatically for every change.
- Critical user journeys are covered by automated tests.
- Recovery procedures have been tested and documented.

## Phase dependencies

```text
Phase 1 -> Phase 2 -> Phase 3 -> Phase 4
                              -> Phase 5
                              -> Phase 6
Phase 4 + Phase 5 + Phase 6 -> Phase 7
```

## Working rules for phase changes

- Do not mark a phase complete based only on code being written; use its exit criteria.
- Keep unfinished work visible with a checklist or issue reference.
- Record major scope, architecture, or sequencing changes in `decisions.md`.
- Add a dated entry to `changelog.md` when a phase starts, completes, or changes materially.