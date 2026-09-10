# Changelog

All notable project changes are recorded here in reverse chronological order. Dates use `YYYY-MM-DD`.

## [Unreleased] - 2026-09-10

### Added

- Added `phases.md` with ordered development phases, deliverables, dependencies, and exit criteria.
- Added SQLite persistence, database schema initialization, seed data, and audit logging.
- Added server-side SQLite sessions, admin authorization, logout invalidation, API hardening, health checks, and smoke tests.
- Added project update and delete endpoints and volunteer status updates.
- Added local environment configuration for database, sessions, admin credentials, CORS, proxy, and request limits.
- Added `vercel.json` to deploy the Express server without requiring a `public` output directory.
- Added versioned SQLite migrations, migration status reporting, backup/restore scripts, and rollback documentation.

### Changed

- Added a shared frontend API adapter for configurable backend origins and credentialed session requests.
- Added explicit frontend-origin CORS methods and configurable SameSite/secure session cookies.
- Replaced duplicated inline route guards with reusable authentication and role middleware.
- Corrected phase status claims to reflect the remaining runtime and separated-deployment verification.
- Linked the detailed phase plan from `memory.md`.
- Updated phase statuses to reflect the completed authentication, hardening, and donation verification implementations.
- Documented Vercel environment variables and the SQLite serverless persistence limitation.
- Marked Phase 2 complete after migration and backup/restore verification.
- Marked Phase 3 and Phase 4 as complete in the delivery roadmap.
- Marked Phase 5 complete after adding verified donation status handling and receipt generation.
- Marked Phase 6 and Phase 7 complete after admin workflow and operational checks were documented and verified.

### Fixed

- Fixed numeric donation validation and same-origin CORS handling.

### Removed

- Nothing removed.

## [1.0.0] - 2026-09-10

Initial documented project baseline and persistent AI context.

### Added

- Added `decisions.md` to record technical and product decisions.
- Added `rules.md` with coding, structure, UI/UX, Git, security, and compatibility rules for AI-assisted development.
- Added `memory.md` with the current architecture, features, API inventory, mock schema, business logic, issues, and roadmap.
- Added this chronological changelog.
- Documented the existing NGO portal API and multi-page frontend.

### Changed

- No application behavior changed. This release documents the existing `1.0.0` application state.

### Fixed

- No application bug fixes were included in this documentation-only change.

### Removed

- Nothing removed.

## Changelog entry template

Use this template for future entries:

```markdown
## [x.y.z] - YYYY-MM-DD

### Added

- New feature or file.

### Changed

- Existing behavior or configuration that changed.

### Fixed

- Bug or regression resolved.

### Removed

- Removed feature, endpoint, dependency, or file, if applicable.
```