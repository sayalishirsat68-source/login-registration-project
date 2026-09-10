# Changelog

All notable project changes are recorded here in reverse chronological order. Dates use `YYYY-MM-DD`.

## [Unreleased] - 2026-09-10

### Added

- Added `phases.md` with ordered development phases, deliverables, dependencies, and exit criteria.
- Added SQLite persistence, database schema initialization, seed data, and audit logging.
- Added server-side SQLite sessions, admin authorization, logout invalidation, API hardening, health checks, and smoke tests.
- Added project update and delete endpoints and volunteer status updates.
- Added local environment configuration for database, sessions, admin credentials, CORS, proxy, and request limits.

### Changed

- Linked the detailed phase plan from `memory.md`.
- Updated phase statuses to reflect verified implementation and remaining external blockers.

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