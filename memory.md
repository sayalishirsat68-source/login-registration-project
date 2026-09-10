# Long-Term Project Memory

## Project overview

`login-registration-project` is a multi-page NGO foundation portal. It presents campaigns, projects, media, donations, contact information, volunteer registration, user registration, and login. It also includes lightweight content-management operations for administrators, although authorization is not yet enforced server-side.

## Tech stack

| Area | Current implementation |
| --- | --- |
| Runtime | Node.js |
| Backend | Express `5.2.1` |
| Persistence | SQLite via `better-sqlite3` |
| Password hashing | `bcryptjs` `3.0.3` |
| Sessions | HTTP-only cookies with a SQLite-backed Express session store |
| Security | `helmet`, `express-rate-limit`, environment-based configuration |
| Frontend | Static HTML, CSS, and browser JavaScript |
| Client state | `localStorage` key `ngo_user` |
| Data persistence | SQLite database at `data/ngo.sqlite` |
| Default port | `3000`, configurable through `PORT` in `.env.example` |
| Package scripts | `npm run dev`, `npm start`, `npm run build` |

## Features completed

- [x] Multi-page NGO website with home, about, campaigns, contact, donation, features, join, media, projects, blog, login, and registration pages.
- [x] Express static file serving and readable route aliases.
- [x] User registration with duplicate-email validation and bcrypt password hashing.
- [x] User login with sanitized user response and client-side navigation state.
- [x] Logout and shared navigation authentication display in `app.js`.
- [x] Volunteer applications and contact inquiries.
- [x] Donation capture and aggregate donation totals.
- [x] Public statistics endpoint.
- [x] In-memory CRUD for about-page values, programs, and team members.
- [x] Media reads and management for press releases, coverage, and gallery images.
- [x] Project listing and project creation.
- [x] Persistent SQLite storage with seeded development records and database constraints.
- [x] Server-side sessions, admin role enforcement, logout invalidation, and audit logs.
- [x] Request body limits, rate limiting, security headers, health check, and environment configuration.
- [x] Project update and delete operations.
- [x] API smoke tests for routes, public APIs, submissions, authentication, authorization, and validation.
- [x] Toast notifications and responsive shared styling patterns.

## Pending features and production gaps

- [ ] Add an explicit versioned migration and rollback workflow for SQLite schema changes.
- [ ] Remove the development fallback administrator and move bootstrap credentials to a secure deployment setup process.
- [ ] Add donation payment processing, verification, refunds, and real tax-receipt generation.
- [ ] Add request validation schemas, rate limiting, CSRF protection where applicable, security headers, and structured logging.
- [ ] Add automated unit, API, accessibility, and end-to-end tests.
- [ ] Add pagination, filtering, audit history, and moderation workflows for admin data.
- [ ] Add production deployment configuration, monitoring, backups, and privacy/compliance documentation.

## API endpoints

All API routes are relative to the running server, normally `http://localhost:3000`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/register` | Register a user |
| `POST` | `/api/login` | Authenticate a user |
| `GET` | `/api/users` | List sanitized users |
| `GET`, `POST` | `/api/volunteers` | List or create volunteer applications |
| `GET`, `POST` | `/api/contact` | List or create contact inquiries |
| `GET`, `POST` | `/api/donations` | List donations or record a donation |
| `GET` | `/api/stats` | Return portal impact statistics |
| `GET` | `/api/about` | Read dynamic about content |
| `PUT` | `/api/about/story` | Update the about story |
| `POST`, `PUT`, `DELETE` | `/api/about/values` and `/api/about/values/:id` | Manage core values |
| `POST`, `PUT`, `DELETE` | `/api/about/programs` and `/api/about/programs/:id` | Manage programs |
| `POST`, `PUT`, `DELETE` | `/api/about/team` and `/api/about/team/:id` | Manage team members |
| `GET` | `/api/media` | Read media data |
| `POST`, `DELETE` | `/api/media/press` and `/api/media/press/:id` | Manage press releases |
| `POST`, `DELETE` | `/api/media/coverage` and `/api/media/coverage/:id` | Manage media coverage |
| `POST`, `DELETE` | `/api/media/gallery` and `/api/media/gallery/:id` | Manage gallery image URLs |
| `GET`, `POST` | `/api/projects` | List or create projects |

## Database schema summary

There is no database yet. The current mock schema is represented by these in-memory collections:

| Collection | Important fields |
| --- | --- |
| `users` | `user_id`, `full_name`, `email`, `password_hash`, `role`, `status`, `created_at` |
| `volunteers` | `id`, `full_name`, `email`, `phone`, `message`, `status`, `created_at` |
| `inquiries` | `id`, `name`, `email`, `phone`, `subject`, `message`, `created_at` |
| `donations` | `id`, `donor_name`, `donor_email`, `amount`, `cause`, `created_at` |
| `aboutContent.values` | `id`, `name`, `description` |
| `aboutContent.programs` | `id`, `name`, `description` |
| `aboutContent.team` | `id`, `name`, `designation`, `bio` |
| `mediaData.pressReleases` | `id`, `title`, `date`, `description` |
| `mediaData.mediaCoverage` | `id`, `title`, `url` |
| `mediaData.galleryImages` | `id`, `url` |
| `projectsData` | `id`, `title`, `description`, `status`, `startDate`, `endDate`, `location`, `imageUrl` |

## Important business logic

- Emails are trimmed and compared case-insensitively; stored user and contact emails are lowercase.
- User passwords are stored as bcrypt hashes, never as plaintext.
- The seeded demo user is `admin@ngo.org`; its current demo password is defined in `server.js` and must not be used in production.
- Donation amounts must parse to a positive number. Donation totals are calculated from the current in-memory collection.
- New volunteer applications start with `Pending Review` status.
- New projects default to `Ongoing` status and a Pune location when values are omitted.
- Public stats include seeded display figures as well as live counts and donation totals.
- `app.js` uses `ngo_user` in localStorage only to update the visible navigation and logout state.

## Known issues

- Restarting the server loses all registrations, submissions, content edits, and donations made during runtime.
- Administrative endpoints now require an Admin session; the client-side localStorage identity remains display-only.
- The server binds to `0.0.0.0` and contains a demo credential, so it is not ready for public deployment.
- The client-side localStorage identity can be forged and must never authorize an operation.
- There is no payment gateway; donation creation records `mock_paid` development data and does not process money.
- Input validation is basic and there is no centralized schema validation or abuse protection.
- There are no automated tests in the current package scripts.
- Pagination, search, export, and full moderation workflows are not yet implemented.
- Several filenames contain spaces, and the campaign filename is misspelled as `compaign.html`; aliases preserve compatibility.

## Future roadmap

1. Establish a persistent relational database and migration strategy.
2. Add secure authentication, sessions, role-based access control, and admin audit logs.
3. Harden API validation and deployment security.
4. Integrate a verified payment provider and compliant receipts.
5. Add automated test coverage and CI checks.
6. Improve admin workflows with moderation, search, pagination, and reporting.
7. Deploy with monitoring, backups, privacy controls, and operational documentation.

The detailed execution plan is maintained in `phases.md`. Phase 1, Prototype Stabilization, is currently in progress; all later phases are planned.
