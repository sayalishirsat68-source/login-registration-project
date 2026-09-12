# Hope Hand NGO Portal

## Overview

Multi-page NGO portal with public campaign, project, media, contact, volunteer, donation, registration, and login workflows. The Express backend now uses SQLite persistence, secure server sessions, role-protected administration APIs, validation, rate limiting, security headers, and audit logs.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The development seed administrator is `admin@ngo.org` with password `admin123`; set `ADMIN_PASSWORD` before any non-development deployment.

The application uses secure server-side sessions rather than JWT for the existing architecture. The backend writes a session cookie with `httpOnly`, `sameSite`, and optional `secure` settings, and the frontend keeps the authenticated user in local storage only as UI state while the server remains the source of truth.

The current application serves the static frontend and API from one Express process. To deploy them separately, serve the static pages from `frontend/`, set `window.NGO_API_URL` (or `window.VITE_API_URL`) before loading `app.js`, and configure the backend `FRONTEND_URL` to the frontend origin. All API requests then use credentialed HTTP-only session cookies.

For a separated local deployment:

1. Run the backend with `npm run dev`.
2. Serve the `frontend/` directory with any static server on `http://localhost:5173`.
3. Set `window.NGO_API_URL` or `window.VITE_API_URL` to `http://localhost:3000` in the frontend host configuration.
4. Set backend `FRONTEND_URL=http://localhost:5173`.

## Verification

```bash
npm run build
npm test
npm audit --omit=dev
npm run db:migrate
```

`npm test` runs route and API smoke checks. Runtime data is stored in `data/ngo.sqlite`, which is intentionally ignored by Git.

## Database operations

```bash
npm run db:migrate
npm run db:backup -- ./data/backups/ngo.sqlite
npm run db:restore -- ./data/backups/ngo.sqlite
```

Migrations are applied in numeric order from `migrations/` and recorded in `schema_migrations`. Before a production migration, create a backup. To roll back, stop the application, restore the last known-good backup, run `npm run db:migrate`, and verify `npm test` before restarting the service. Do not manually edit the SQLite file while the server is running.

## Configuration

Copy `.env.example` to `.env` for local overrides. Production must provide `SESSION_SECRET` and `ADMIN_PASSWORD`; never commit `.env` or real credentials.

Required environment variables:

```text
PORT=3000
NODE_ENV=development
DATA_DIR=./backend/data
DB_PATH=./backend/data/ngo.sqlite
SESSION_SECRET=replace-with-a-long-random-secret
ADMIN_PASSWORD=replace-with-a-strong-admin-password
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000
COOKIE_SAME_SITE=lax
COOKIE_SECURE=false
```

`FRONTEND_URL` controls credentialed CORS. `COOKIE_SAME_SITE` and `COOKIE_SECURE` control the session cookie; use `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true` when the separately deployed frontend and backend are cross-site and served over HTTPS.

## Authentication architecture

Frontend pages call the authentication API. The backend session middleware loads the authenticated user, `authMiddleware` rejects missing or inactive sessions, `roleMiddleware` enforces administrator permissions, and controllers validate input before database operations. Passwords are stored only as bcrypt hashes, and `/api/auth/me` returns safe user fields only.

Flow:

```text
Frontend page
  ↓
Authentication API (`/api/login`, `/api/register`, `/api/logout`, `/api/auth/me`)
  ↓
Express backend
  ↓
Session-based auth middleware
  ↓
Role middleware (admin-only routes)
  ↓
SQLite user table
```

## Vercel deployment

Vercel serves the static files from `frontend/`. Deploy the repository as a Vercel project without a build command. The frontend automatically sends API requests to the Render service at `https://login-registration-project.onrender.com`; change `NGO_API_URL` in `frontend/app.js` if the Render service gets a different name.

The backend must be deployed separately to Render. SQLite data on serverless hosting is not durable across deployments or instance changes, so use the Render service for the backend and move to a managed database before production traffic.

## Render deployment

This repository currently uses the root-level Express entry point. In Render, set:

```text
Build Command: npm install
Start Command: npm start
Health Check Path: /healthz
```

Do not use `node backend/server.js` unless the repository has actually been migrated to that directory layout. The included `render.yaml` contains the same settings. Configure `NODE_ENV`, `SESSION_SECRET`, `ADMIN_PASSWORD`, and `FRONTEND_URL` as Render environment variables.

## Project context

- [decisions.md](decisions.md): technical and product decisions.
- [rules.md](rules.md): rules for AI-assisted changes.
- [memory.md](memory.md): long-term architecture and business context.
- [phases.md](phases.md): delivery phases and current status.
- [changelog.md](changelog.md): chronological project history.