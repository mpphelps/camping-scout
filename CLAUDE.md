# CampingScout — CLAUDE.md

## Project Overview
Campsite reservation finder for California state parks (ReserveCalifornia). Users sign in, define campground/date-pattern watches, and get notified when matching sites open. Template: the Bookshelf project (`../Bookshelf`) — same stack, same conventions.

## Tech Stack
- **Framework:** React Router v7 with React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4, shadcn-style components in `packages/ui`
- **ORM:** Prisma v7 with PostgreSQL 17 (Docker), `@prisma/adapter-pg` driver adapter
- **Monorepo:** Turborepo with npm workspaces
- **Testing:** Playwright (e2e)

## Monorepo Structure
- `apps/web` — React Router app (frontend + server routes)
- `packages/database` — Prisma schema, migrations, and client singleton
- `packages/scanner` — ReserveCalifornia API client + availability scan CLI (future notification-service core; see `packages/scanner/API.md`)
- `packages/ui` — Shared React components
- `packages/eslint-config` — Shared ESLint configs
- `packages/typescript-config` — Shared TS configs

## Backend Architecture (Strict)
All features must follow three layers:
1. **Route layer** (`app/routes/`) — Thin. Parse request/form data, call a service, return response. No business logic. No Prisma calls.
2. **Service layer** (`app/services/`) — Business logic, validation, orchestration. Receives plain data, calls repositories, throws domain errors.
3. **Repository layer** (`app/repositories/`) — Prisma queries only. One per entity. No business logic. Returns Prisma types or null.

## Key Commands
```bash
# Root
npm run dev              # Start all apps via Turbo
npm run build            # Build all apps/packages

# Docker
docker compose up -d     # Start Postgres (dev on 5434, test on 5435)
docker compose down      # Stop Postgres

# Database (from packages/database)
npx prisma migrate dev --name <name>   # Create + apply migration
npx prisma migrate deploy              # Apply pending migrations (prod)
npx prisma generate                    # Regenerate client from schema
npx prisma migrate dev --create-only   # Generate SQL without applying (for review)
```

## Environment
- Single `.env` in `packages/database/` — contains `DATABASE_URL`, `SESSION_SECRET`, `AUTH0_*`
- `apps/web/vite.config.ts` has `envDir` pointing to `../../packages/database`
- Database: `postgresql://camping_scout:camping_scout@localhost:5434/camping_scout`
- Test database: port 5435, `camping_scout_test` — configured via `.env.test`

## Data Model
- **User** — id, email (unique), firstName, lastName, timestamps. Synced from Auth0 on first login.
- (Coming: Watch — a campground + date-pattern subscription; notification delivery records.)

## Migration Policy
- Always inspect generated SQL before applying (`--create-only`)
- Consider impact on existing data before running migrations
- Use expand/contract pattern for structural changes
- Backfill data in migration SQL when adding required columns

## Authentication & Authorization
- **Auth provider:** Auth0 (OAuth 2.0 Authorization Code flow with PKCE)
- **Session:** JWT stored in encrypted HTTP-only session cookie (server-side)
- **JWT validation:** Signature verified against Auth0 JWKS on each request
- **Permissions:** Embedded in JWT claims, checked in the service layer
- **User sync:** On first login, Auth0 profile is used to create a local User record
- **E2E bypass:** `E2E_AUTH_BYPASS=1` enables `/auth/test-login` (404 in production)

## Testing
- **E2E (Playwright):** `apps/web/e2e/`, runs against `camping_scout_test` DB on port 5435, app on port 5174
- `globalSetup` runs `prisma migrate deploy`; `cleanDb` fixture truncates tables between tests
- Suite-level auth via `test.use({ user: ... })` + `page` fixture override

## Agents
- **e2e-test-runner** — Use this agent for all Playwright work: creating tests, running tests, debugging failures.

## Conventions
- Route files use React Router v7 typed conventions (`Route.LoaderArgs`, `Route.ComponentProps`)
- Database package imported as `@camping-scout/database`
- Prisma client uses `@prisma/adapter-pg` driver adapter (required in Prisma v7)
- Authorization checks live in the service layer, never in routes or repositories
- ReserveCalifornia API calls must be polite: resolve base URL from `reservecalifornia.com/config.json`, delay between requests (see `packages/scanner`)
