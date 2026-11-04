# AGENTS.md

Agenda web for a dental clinic (two dentists, Marie and Yani). UI and data are in Spanish. Stack: React 19 + Vite SPA in `src/`, one Express server in `server.ts`, Postgres via Drizzle, Supabase Auth.

## Commands

- Use **npm**. `package-lock.json` is what Render installs (`npm ci`). `bun.lock` also exists but is not used by deploy.
- Install: `CYPRESS_INSTALL_BINARY=0 npm ci` (same flag as `render.yaml`; Cypress is only used for local tests).
- `npm run dev`: runs `server.ts` on port 3000 (or `PORT`). Vite runs as middleware in that process, so there is no separate frontend dev server.
- `npm run lint`: this is only `tsc --noEmit`. There is no ESLint or Prettier.
- `npm test`: Vitest, unit tests only, `src/**/*.test.ts`, node environment.
  - Single file: `npx vitest run src/utils/time.test.ts`
  - Do not change `--pool=forks --maxWorkers=1`.
- `npm run build`: `vite build`, then esbuild bundles `server.ts` to `dist/server.cjs`.
- `npm start`: runs `dist/server.cjs` with `NODE_ENV=production`. It serves `dist/` and needs a build first.
- Verification order: `lint` → `test` → `build`. All three passed on the current tree.
- E2E:
  - First time: `npx playwright install chromium`.
  - `npm run test:e2e` starts `PORT=3001 npm run dev` itself (Playwright config).
  - `PLAYWRIGHT_BASE_URL=<url> npm run test:e2e` targets an external server and skips the test that creates patients.
  - E2E logs in as `e2e@consultorio.test` / `admin123`. This is a real Supabase Auth user. The email must be listed in `CONSULTORIO_EMAIL`, and `.env.local` needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
  - E2E creates real rows (patients, appointments) in whatever `DATABASE_URL` is set. Point `.env.local` at a dev database before running it locally.
- `cypress/`, `e2e/selenium/`, and `e2e/katalon/` mirror the same flows. They are not wired into CI. Playwright is the suite that `npm` scripts maintain.

## Architecture

- `server.ts` is the whole backend: REST routes under `/api/*`, session auth, SSE at `/api/sync/events`, Postgres persistence, public patient confirmation links, and the Gemini assistant (`/api/assistant/chat`).
- `server.ts` imports shared logic from `src/utils/appointmentConflicts.ts`. Server-side overlap checks use the same code as the client and its tests. Changing that file changes both.
- Data flow:
  - Postgres is the source of truth when `DATABASE_URL` (or `POSTGRES_URL`) is set. The server loads it at startup and keeps an in-memory `sharedAgendaStore` that it broadcasts over SSE.
  - Without a database, data lives only in memory and in `agenda_storage.json` in the repo root (gitignored).
  - Two write paths exist: whole-list `POST /api/sync/agenda` (used by `CalendarView` and `storage.ts`) and per-record `/api/contacts`, `/api/appointments`. The per-record routes are the ones the server comments mark as safe for multi-device use.
- Domain values: `dentist` is `'Marie' | 'Yani' | 'Ambas'`. Dates are `YYYY-MM-DD` strings and times are `HH:mm` strings. A missing dentist counts as Yani for existing appointments and as Marie for new ones (see `dentistsConflict`).

## Auth and env

- Login: Supabase Auth in the browser, then `POST /api/auth/session` checks the token with Supabase and requires a confirmed email in `CONSULTORIO_EMAIL`. That sets an HMAC-signed HttpOnly cookie (`agenda_session`). Every data route uses `requireSession`.
- `DEMO_MODE=true` skips login. Set it only in the public demo copy, never in the clinic's instance.
- Without `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `CONSULTORIO_EMAIL`, `/api/auth/session` returns 503. For local login without Supabase, set `DEMO_MODE=true`.
- `SESSION_SECRET` also signs the public WhatsApp links (`/api/public/appointment/:token`). Changing it invalidates all sessions and all links already sent to patients.
- In production (`NODE_ENV=production`), the server exits unless `SESSION_SECRET` has at least 32 characters and Supabase auth is configured. Cookies get the `Secure` flag, so login over plain `http://` will not persist in production mode. Test production behavior on HTTPS.
- Secrets go in `.env.local` (gitignored). `.env.example` lists the variables. `server.ts` and `src/db/index.ts` both load dotenv, so `.env.local` is read.

## Database

- There is no `drizzle/` migrations folder. The schema is `src/db/schema.ts`. Apply changes with `npm run db:push` (root `drizzle.config.ts`, which reads `DATABASE_URL`).
- Do not use `src/db/drizzle.config.ts`. It is a legacy Cloud SQL config that needs `SQL_*` variables.
- `server.ts` `ensureTablesExist()` also creates tables with raw SQL at startup. It uses `TIMESTAMP` for `created_at`, while `schema.ts` and `supabase/schema.sql` use `TEXT`. Keep these consistent when you change a table.
- `supabase/schema.sql` is the one-time Supabase setup. It enables RLS with no policies and revokes access from `anon` and `authenticated`. The tables hold health data (Ley 25.326), so keep RLS enabled. `sql/init.sql` is a plain-Postgres version.

## Deploy

- Render (`render.yaml`): Blueprint with auto-deploy on every push to `main`. Build: `npm ci --include=dev && npm run build`. Start: `npm start`. Health check: `/api/health`.
- Git workflow: work on a feature branch and open a PR. Do not push to `main`, because that deploys to production.
- Setup and config guides are in `DEPLOY.md` (Spanish) and `TESTING.md` (Spanish).
