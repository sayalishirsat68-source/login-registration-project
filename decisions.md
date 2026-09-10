# Technical and Product Decisions

This file records decisions that materially affect the project. New decisions should be added in reverse chronological order and should explain the tradeoff, not only the outcome.

## Use a single Express server for the portal

- **Date:** 2026-09-10
- **Context/problem:** The project contains multiple static HTML pages and needs a small backend for authentication, forms, content, and statistics.
- **Decision taken:** Use Node.js with Express as the single application server. Serve the static site from the project root and expose JSON APIs under `/api`.
- **Reasoning:** This keeps local development simple and matches the current project structure. It avoids introducing a frontend build system or a second server for a relatively small portal.
- **Alternatives considered:** A separate SPA frontend, a server-rendered framework, or a serverless API.
- **Impact on project:** Pages can be opened through one server at `http://localhost:3000`, shared browser code can call relative `/api` paths, and future deployment must support Node.js.

## Keep the current frontend as static HTML, CSS, and JavaScript

- **Date:** 2026-09-10
- **Context/problem:** The site already has separate HTML pages for public information, campaigns, donations, media, projects, login, and registration.
- **Decision taken:** Preserve the multi-page static frontend and use `app.js` for shared browser behavior.
- **Reasoning:** This minimizes migration risk and keeps existing URLs and page-level workflows intact.
- **Alternatives considered:** Migrating to React, Vue, or a single-page application.
- **Impact on project:** New features should fit existing pages and shared styles unless a deliberate architecture change is recorded here.

## Use bcryptjs for password hashing

- **Date:** 2026-09-10
- **Context/problem:** Registration and login require password handling without storing plaintext passwords.
- **Decision taken:** Hash passwords with `bcryptjs` using 10 salt rounds and compare hashes during login.
- **Reasoning:** It is already installed, simple to use in the current CommonJS server, and provides an appropriate password-hashing primitive for this prototype.
- **Alternatives considered:** Plaintext storage, Node's built-in crypto APIs, or a hosted identity provider.
- **Impact on project:** Password hashes must never be returned by an API. Before production, credentials and sessions still need stronger operational controls, persistent storage, rate limiting, and secret management.

## Use in-memory stores for the current prototype

- **Date:** 2026-09-10
- **Context/problem:** The project needs working demonstrations of users, volunteers, inquiries, donations, content, media, and projects without a database setup.
- **Decision taken:** Keep the stores as arrays and objects in `server.js` for now.
- **Reasoning:** It makes the demo self-contained and fast to run.
- **Alternatives considered:** SQLite, PostgreSQL, MongoDB, or a managed database.
- **Impact on project:** Data is lost whenever the process restarts, concurrent access is not durable, and the seeded demo administrator is not production-safe. A database migration is required before real use.

## Use SQLite for local and initial production persistence

- **Date:** 2026-09-10
- **Context/problem:** The prototype needed durable records without adding a remote database dependency during development.
- **Decision taken:** Use `better-sqlite3` with a local SQLite file, foreign keys, WAL mode, schema initialization, seed data, and a SQLite-backed session store.
- **Reasoning:** SQLite is transactional, portable, easy to back up, and appropriate for the current single-service portal. It can later be replaced behind the database boundary if scale requires it.
- **Alternatives considered:** PostgreSQL, MySQL, JSON files, or a managed database.
- **Impact on project:** Runtime data now survives restarts and database constraints protect core records. Production still needs a tested backup strategy and a deliberate migration process.

## Protect administration with server-side sessions and roles

- **Date:** 2026-09-10
- **Context/problem:** The previous localStorage identity could be forged and admin endpoints were publicly writable.
- **Decision taken:** Use HTTP-only same-site session cookies, persist sessions in SQLite, and require the `Admin` role for administrative reads and writes. Public registration cannot create an Admin account.
- **Reasoning:** Authorization must be enforced by the server; browser state is only a display aid.
- **Alternatives considered:** Trusting localStorage, client-only route guards, or introducing a hosted identity provider.
- **Impact on project:** Admin pages require a valid server session, all privileged mutations are auditable, and the existing frontend can continue using same-origin fetch calls.

## Keep donations in explicit development/mock mode

- **Date:** 2026-09-10
- **Context/problem:** No payment provider, merchant account, webhook secret, or regulatory requirements were supplied.
- **Decision taken:** Store donation records with `mock_paid` status and clearly state that no payment was processed.
- **Reasoning:** It prevents the application from falsely claiming to process real money while preserving the donation workflow for development.
- **Alternatives considered:** Fabricating a provider integration or silently treating form submission as a real payment.
- **Impact on project:** Phase 5 remains blocked until a payment provider and business requirements are supplied.

## Use browser localStorage for the current login display state

- **Date:** 2026-09-10
- **Context/problem:** The static pages need to show the current user and provide logout behavior after login.
- **Decision taken:** Store the sanitized logged-in user object under `ngo_user` in browser `localStorage` and synchronize navigation through `app.js`.
- **Reasoning:** It works across the existing multi-page frontend without adding session infrastructure.
- **Alternatives considered:** HTTP-only cookie sessions, token-based authentication, or a hosted identity provider.
- **Impact on project:** This is only a client-side display state and is not authorization. Server-side authentication and authorization must be added before protected administration features are exposed.

## Preserve compatibility aliases for page routes

- **Date:** 2026-09-10
- **Context/problem:** Existing filenames include spaces and the campaign page is named `compaign.html`.
- **Decision taken:** Keep route aliases such as `/about`, `/campaign`, `/contact`, and `/join` mapped to the existing HTML files.
- **Reasoning:** Aliases provide readable URLs while preserving existing files and links.
- **Alternatives considered:** Renaming files immediately or requiring direct `.html` URLs.
- **Impact on project:** Route aliases are part of the public interface. Any rename must update aliases, links, and documentation together.

## Prefer existing visual language over page-specific redesigns

- **Date:** 2026-09-10
- **Context/problem:** The portal is a public-facing NGO site with many related workflows.
- **Decision taken:** Reuse `style.css`, shared navigation, existing page patterns, and consistent messaging when adding UI.
- **Reasoning:** Consistency improves trust and reduces maintenance across the multi-page site.
- **Alternatives considered:** Independent styling for every page or a full design-system rewrite.
- **Impact on project:** New UI should be additive and responsive, and should not break existing navigation, forms, or accessibility expectations.
