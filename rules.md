# Project Rules for AI Coding Assistants

These rules apply to every change unless the user explicitly overrides them.

## Core behavior

- Preserve existing functionality, routes, forms, and public URLs unless a breaking change is requested.
- Make the smallest focused change that solves the request.
- Inspect nearby code and reuse existing patterns before introducing abstractions or dependencies.
- Do not claim a feature is complete unless it is implemented and verified.
- Update `memory.md`, `decisions.md`, and `changelog.md` when a change alters project behavior, architecture, or roadmap.

## Coding standards

- Use CommonJS in Node files, matching the current server (`require` and `module.exports` where applicable).
- Use 2 spaces for JavaScript indentation and semicolons, consistent with the existing code.
- Prefer clear descriptive names; use `camelCase` for JavaScript variables and functions.
- Validate required input at API boundaries, trim user text, normalize emails to lowercase, and return useful HTTP status codes.
- Never return `password_hash` or other secrets in API responses.
- Keep comments short and explain non-obvious intent only.
- Avoid unnecessary dependencies, broad refactors, and unrelated formatting changes.
- Run the relevant validation after editing: at minimum `npm run build`; for server changes also start the server and exercise the affected endpoint when practical.

## Folder and file structure

- Keep the current root-level static pages in place unless a migration is explicitly requested.
- Keep shared browser behavior in `app.js` and shared styles in `style.css`.
- Keep backend routes and server setup in `server.js` until a modularization decision is recorded.
- Keep project context files at the repository root: `decisions.md`, `rules.md`, `memory.md`, and `changelog.md`.
- Do not commit generated output, local environment files, credentials, or temporary editor files.

## Naming conventions

- Use lowercase kebab-case for new standalone documentation files and URL paths where compatible with existing aliases.
- Use `camelCase` for JavaScript properties and functions; preserve existing API field names when extending an endpoint.
- Use `UPPER_SNAKE_CASE` for constants only when the value is truly constant and the local code style supports it.
- Prefer descriptive resource names such as `volunteers`, `inquiries`, and `projects`.
- Do not rename existing files such as `compaign.html` without updating all aliases and links.

## UI and UX consistency

- Reuse the shared navigation, `style.css`, typography, spacing, colors, buttons, toast notifications, and form behavior.
- Keep layouts responsive for mobile and desktop; do not introduce horizontal overflow.
- Use clear labels, visible validation feedback, keyboard-accessible controls, meaningful link text, and sufficient color contrast.
- Keep success, error, and informational messages consistent with the existing `showToast` pattern.
- Preserve the NGO's trustworthy, accessible, community-focused tone. Avoid deceptive donation claims or unexplained destructive actions.
- Use existing page structure before adding new navigation or a new visual language.

## Git and changelog rules

- Do not create commits or branches unless the user explicitly asks.
- Commits, when requested, should be small, focused, and written in imperative form, for example `Add donation validation`.
- Do not mix feature work with unrelated cleanup.
- Before a requested commit, inspect the diff and run the relevant checks.
- Record user-visible or architectural changes in `changelog.md` with the date and version.

## Security and environment variables

- Never commit passwords, API keys, tokens, private certificates, or real personal data.
- Keep local secrets in `.env`; `.env` files are ignored by git. Update `.env.example` with placeholder names when new configuration is needed.
- Read configuration from environment variables rather than hardcoding deployment-specific values.
- Never use the seeded demo password or in-memory authentication model in production.
- Add authentication and authorization checks before exposing administrative reads or writes in production.
- Add rate limiting, secure session handling, security headers, CORS policy, input validation, and persistent audit logging before public deployment.
- Treat all client-side localStorage values as untrusted. Never use them as proof of authorization.
- Do not log passwords, tokens, or sensitive personal information.

## Compatibility and testing

- Do not break existing functionality unless requested by the user.
- Preserve response shapes and status codes for existing consumers unless a versioned API change is agreed.
- Test login, registration, volunteer, contact, donation, content, media, and project flows after changes that touch their shared code.
- Verify both success and validation/error paths for changed APIs.
