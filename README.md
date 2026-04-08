# pendingsystem

## Overview
`pendingsystem` is a private Next.js 15 workflow application for managing pending automotive parts across five operational stages: Orders, Main Sheet, Call List, Booking, and Archive.

The current implementation uses:

- Better Auth for admin-only sign-in
- Supabase for operational data, reminders, attachments, and report settings
- React Query for server-state fetching and optimistic mutations
- Zustand for persisted UI preferences, notifications, layouts, and draft-session recovery
- AG Grid for the main desktop workspaces

## Quick Start
1. Install dependencies.

   ```bash
   npm install
   ```

2. Copy the environment template.

   ```bash
   cp .env.example .env.local
   ```

3. Fill in the minimum variables needed to boot the app:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL`
   - `BETTER_AUTH_URL`
   - `BETTER_AUTH_SECRET`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`

4. Add optional variables as needed:

   - `NEXT_PUBLIC_SETTINGS_PASSWORD` for the client-side settings lock
   - `NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET` to override the default `attachments` bucket
   - `SUPABASE_SERVICE_ROLE_KEY` for `/api/storage-stats` and the backup script
   - `GITHUB_PAT`, `GITHUB_OWNER`, `GITHUB_REPO` for the manual backup trigger
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` for backup-report emails
   - `AUTH_ADMIN_*` values if you want to seed the first admin account

5. Start the development server.

   ```bash
   npm run dev
   ```

6. Optionally seed the first admin user after your Better Auth tables exist.

   ```bash
   npm run auth:seed-admin
   ```

Then open `http://localhost:3000`. Unauthenticated users are redirected to `/login`, and authenticated users land on `/dashboard`.

## Development Commands
```bash
npm run dev                     # Next.js dev server
npm run build                   # Production build
npm run start                   # Start the production server
npm run lint                    # Biome check
npm run lint:fix                # Biome check with writes
npm run lint:fix:staged         # Fix staged files
npm run lint:fix:staged:unsafe  # Unsafe Biome fixes for staged files
npm run type-check              # TypeScript (no emit)
npm run test                    # Vitest run
npm run test:watch              # Vitest watch mode
npm run test:ui                 # Vitest UI
npm run docs                    # Print the main doc entrypoints
npm run docs:serve              # Serve docs from the repo root on port 8080
npm run docs:validate           # Validate top-level docs
npm run docs:extract            # Extract JSDoc-derived documentation data
npm run auth:seed-admin         # Create the initial admin user
npm run commit                  # Run the helper commit script
```

There is currently no `e2e` or Playwright script in `package.json`; the committed automated test surface is Vitest-based.

## Project Structure
```text
src/
  app/                Next.js routes, layouts, metadata routes, and API handlers
  components/         Shared UI plus feature-specific React components
  hooks/              Query hooks and UI hooks
  lib/                Auth, Supabase, printing, exports, and shared helpers
  schemas/            Zod schemas for forms and normalized rows
  services/           Supabase-facing service layer
  store/              Zustand store and slices
  test/               Vitest suites and test helpers
docs/                 Protected feature references and design notes
scripts/              Backup, seed, docs, and helper scripts
supabase/migrations/  Database migrations
public/               Static assets
```

## Workflow Snapshot
1. `orders` - Intake, draft capture, attachments, logistics export, and commit preparation.
2. `main` - Active processing workspace with a local edit lock and reorder/archive actions.
3. `call` - Contact queue for arrived parts and booking handoff.
4. `booking` - Appointment scheduling and rebooking.
5. `archive` - Historical records and reorder recovery.

## Documentation
- [`FEATURES.md`](FEATURES.md) - Product behavior and current workflow rules
- [`ENGINEERING.md`](ENGINEERING.md) - Architecture, services, state, operations, and troubleshooting
- [`docs/attachment-system-reference.md`](docs/attachment-system-reference.md) - Stable attachment behavior reference
- [`docs/order-form-reference.md`](docs/order-form-reference.md) - Stable order form behavior reference
- [`docs/reminder-system-reference.md`](docs/reminder-system-reference.md) - Stable reminder behavior reference

Files under `docs/` are treated as protected reference material. Update them intentionally and explicitly rather than as part of routine wording cleanup.

## Contributing
- Follow the implementation guidance in [`ENGINEERING.md`](ENGINEERING.md).
- Keep [`README.md`](README.md), [`FEATURES.md`](FEATURES.md), and [`ENGINEERING.md`](ENGINEERING.md) aligned with the code whenever behavior changes.
- Run the normal quality gates before opening a PR:

  ```bash
  npm run lint
  npm run type-check
  npm run test
  npm run build
  npm run docs:validate
  ```

Husky is configured so `git commit` runs Biome against staged files and retries with `--unsafe` if the safe pass still fails.
