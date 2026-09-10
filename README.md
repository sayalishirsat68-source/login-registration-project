# Hope Hand NGO Portal

## Overview

Multi-page NGO portal with public campaign, project, media, contact, volunteer, donation, registration, and login workflows. The Express backend now uses SQLite persistence, secure server sessions, role-protected administration APIs, validation, rate limiting, security headers, and audit logs.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The development seed administrator is `admin@ngo.org` with password `admin123`; set `ADMIN_PASSWORD` before any non-development deployment.

## Verification

```bash
npm run build
npm test
npm audit --omit=dev
```

`npm test` runs route and API smoke checks. Runtime data is stored in `data/ngo.sqlite`, which is intentionally ignored by Git.

## Configuration

Copy `.env.example` to `.env` for local overrides. Production must provide `SESSION_SECRET` and `ADMIN_PASSWORD`; never commit `.env` or real credentials.

## Vercel deployment

The repository includes `vercel.json` so Vercel deploys the Express entry point instead of expecting a static `public` output directory. Configure these environment variables in the Vercel project settings:

```text
NODE_ENV=production
SESSION_SECRET=<long-random-secret>
ADMIN_PASSWORD=<strong-admin-password>
```

SQLite data on serverless hosting is not durable across deployments or instance changes. Use a managed database before production traffic, even though SQLite remains suitable for local development.

## Project context

- [decisions.md](decisions.md): technical and product decisions.
- [rules.md](rules.md): rules for AI-assisted changes.
- [memory.md](memory.md): long-term architecture and business context.
- [phases.md](phases.md): delivery phases and current status.
- [changelog.md](changelog.md): chronological project history.