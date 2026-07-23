# CineVote

CineVote is a mobile-first movie-polling and screening-ticket application for
college events. Students can browse candidate movies, submit one vote per
trusted device, view live results, and generate a QR-coded pass after ticketing
opens. Organizers manage the poll, schedule, venue, ticket allocation, exports,
and basic abuse monitoring from a password-protected admin dashboard.

## Main features

- Movie catalogue with detail views and vote confirmation
- Student onboarding with name, year, and department
- Time-controlled poll opening and closing
- One-vote-per-device enforcement
- Hashed request signals and vote-attempt rate limiting
- Live vote results
- Admin dashboard for poll and ticket controls
- CSV exports for voting and ticket data
- Winning-movie selection
- Capacity-limited ticket generation with QR codes
- Configurable screening date and venue

## Technology

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Supabase/PostgreSQL
- Zod validation
- `qrcode.react` for screening passes

Node.js `20.9.0` or newer is required by the installed Next.js version.

## Application routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page and poll status |
| `/movies` | Movie catalogue and voting flow |
| `/live` | Live poll results |
| `/tickets` | Ticket status and ticket generation |
| `/admin/login` | Organizer login |
| `/admin` | Organizer dashboard |

The route handlers under `src/app/api` provide poll status, voting, results,
ticketing, admin controls, and CSV exports.

## Local setup

1. Fork or clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create the local environment file from the committed template:

   ```bash
   cp .env.example .env.local
   ```

4. Fill in `.env.local` using credentials for the intended Supabase project.
5. Initialize the database as described in [Database setup](#database-setup).
6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000).

Do not commit `.env.local`. It is intentionally ignored by Git.

## Environment variables

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL used by the server client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous key reserved for browser-side Supabase access; the current server routes do not use it |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Privileged server credential used by all database route handlers |
| `ADMIN_PASSWORD` | Secret | Password for `/admin/login` |
| `ADMIN_COOKIE_SECRET` | Secret | HMAC key used to sign admin-session cookies |
| `DEVICE_COOKIE_SECRET` | Secret | HMAC key used to sign trusted-device cookies |
| `NEXT_PUBLIC_SITE_URL` | Public | Canonical deployed URL used when validating vote-request origins |

Generate independent, high-entropy values for the cookie secrets. For example:

```bash
openssl rand -hex 32
```

Use a different value for `ADMIN_COOKIE_SECRET` and `DEVICE_COOKIE_SECRET`.
Changing `ADMIN_COOKIE_SECRET` invalidates active admin sessions. The production
values must be configured in the hosting provider as well as in local
development.

`SUPABASE_SERVICE_ROLE_KEY` bypasses normal Supabase row-level restrictions.
Never expose it in client-side code, screenshots, issue comments, commits, or
pull requests.

## Database setup

The canonical database definition is [`supabase/schema.sql`](supabase/schema.sql).
It creates and seeds:

- `movies`
- `voters`
- `votes`
- `vote_attempts`
- `poll_settings`
- `ticket_settings`
- `tickets`

For a new Supabase project:

1. Create the project.
2. Open the Supabase SQL Editor.
3. Run the complete contents of `supabase/schema.sql`.
4. Confirm that the `main` rows exist in `poll_settings` and
   `ticket_settings`.
5. Add the project URL and service-role key to `.env.local`.

The files named `supabase/add-*.sql` are incremental migrations retained for
older deployments. A fresh database should use `schema.sql`; do not run both
the full schema and every incremental migration unless a specific migration is
needed for an existing database.

The initial movie records are also represented in `src/data/movies.ts`.
`src/lib/supabase/movies.ts` can seed missing movie rows from that list.

## Admin operation

Visit `/admin/login` and authenticate with `ADMIN_PASSWORD`. The dashboard
allows an organizer to:

- Open or close voting
- Configure poll start and close times
- Set the event status, screening date, and venue
- Review vote totals and basic abuse indicators
- Export voting data
- Configure ticket capacity and booking dates
- Open or close ticket generation
- Export generated tickets

Admin sessions use an HTTP-only, same-site cookie. Keep both the admin password
and signing secret out of the repository.

When rotating admin access:

1. Change `ADMIN_PASSWORD`.
2. Rotate `ADMIN_COOKIE_SECRET` to invalidate every existing session.
3. Update both local and hosted environment settings.
4. Restart the local server or redeploy production.

## Voting and ticket security

The application combines browser storage, a signed trusted-device cookie,
database uniqueness constraints, hashed IP/user-agent signals, and recent
attempt counts. The current vote limits are:

- 20 attempts per hashed IP address within 10 minutes
- 5 attempts per trusted device within 10 minutes
- One accepted vote per device ID

These controls discourage casual duplicate voting but are not a substitute for
institutional authentication when identity-grade guarantees are required.

Ticket generation is tied to the trusted device and voter record. Capacity,
booking dates, poll completion, and the ticketing live switch are checked on
the server.

## Movie and poster assets

The poll movie list lives in `src/data/movies.ts`, with matching seed data in
`supabase/schema.sql`. Keep the IDs synchronized when changing the candidates.
Movie poster paths should resolve from `public/movies`.

Source artwork for the animated intro is stored in `posters`. To rebuild the
optimized intro assets and regenerate `src/data/introPosters.ts`, run:

```bash
npm run prepare:intro-posters
```

The preparation script replaces the generated `public/intro-posters` directory,
so review its output before committing asset changes.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Create and type-check a production build |
| `npm run start` | Serve the completed production build |
| `npm run prepare:intro-posters` | Optimize and regenerate intro poster assets |

There is currently no dedicated automated test suite in the repository.
Before opening a pull request, run:

```bash
npm run lint
npm run build
```

Then manually verify voting, duplicate-vote rejection, admin login/logout, poll
controls, live results, ticket controls, ticket generation, and CSV exports
against a non-production Supabase project.

## Deployment

The application can be deployed to any Node.js host that supports Next.js. For
Vercel:

1. Import the GitHub repository.
2. Configure every required environment variable for the correct environment.
3. Run `supabase/schema.sql` against the production Supabase project.
4. Deploy the `main` branch.
5. Verify `/`, `/movies`, `/live`, `/tickets`, and `/admin/login`.

Environment-variable changes require a new deployment. Never copy production
secrets into preview deployments unless they are intentionally permitted to
access production data.

## Contribution and handoff workflow

Use a fork and pull request for external contributions:

1. Fork the repository.
2. Create a branch from the latest `main`.
3. Copy `.env.example` to `.env.local` and use development credentials.
4. Make focused changes without committing secrets or generated local files.
5. Run lint, build, and the relevant manual checks.
6. Open a pull request describing the change, database impact, test evidence,
   screenshots where useful, and any new environment variables.

Before merging, review changes to API routes, SQL, authentication, cookie
handling, and environment-variable usage especially carefully.

## Project structure

```text
src/app/                 Pages and API route handlers
src/components/          Feature and shared UI components
src/data/                Static movie and intro-poster data
src/lib/                 Auth, device, Supabase, voting, and ticket helpers
src/types/               Shared TypeScript types
supabase/                Canonical schema and incremental SQL migrations
scripts/                 Asset-preparation scripts
posters/                 Source intro-poster artwork
public/                  Static web assets
docs/stitch-ui/          Original visual references and design notes
```

## Secret-handoff checklist

- Share `.env.local` through a password manager or encrypted channel, not Git.
- Prefer separate development and production Supabase projects.
- Rotate `ADMIN_PASSWORD`, `ADMIN_COOKIE_SECRET`, and `DEVICE_COOKIE_SECRET`
  when project ownership changes.
- Revoke or rotate the Supabase service-role key if it was exposed.
- Transfer access to GitHub, Supabase, the hosting provider, and the domain.
- Record the production URL, deployment owner, database owner, and rollback
  procedure in the private handoff notes.
- Add the pending external test report and unresolved findings before the final
  takeover.

## Current limitations

- Admin authentication uses one shared password rather than individual accounts.
- The application does not currently include an automated test suite.
- Voting is device-based and does not provide verified student identity.
- Movie metadata is duplicated between TypeScript seed data and SQL seed data.
- Operational credentials and provider ownership must be transferred outside
  the repository.
