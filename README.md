# CareerOS demo

CareerOS opens on an astral job encounter desk: seven authored fictional technology roles,
with Heroes, Side quests, and Final bosses as game categories, not hiring assessments.
Fynn’s Information Science background and user-confirmed AWS Certified Developer Associate
and Security+ guide the explanatory dossier; no additional experience is assumed.

- `/` and `/quest`: swipe, use arrow keys, or use Previous/Next to explore a bounded deck.
  Filter encounters, switch mission/dossier content, edit the session player name, and recruit
  roles to a clickable party roster. Recruiting only saves a possibility within this session.
- `/tracker`: the preserved classic fictional application tracker.
- `/login` and `/workspace`: the separate secured workspace, with the existing backend caveats below.

The public demo is memory-only: refresh clears party/name changes. No cookies, browser storage,
real openings, applications, XP, salaries, or recruitment probabilities are created by Quest mode.
All illustrations are original inline SVG; no remote assets or font services are used.
See [quest deck evidence](docs/quest-deck-evidence.md) for validation and browser-QA limits.

## Requirements

- Node.js (LTS recommended) and npm.
- No credentials, environment variables, or paid services are required.

## Setup

```bash
npm ci
npm run dev
```

Open http://localhost:3000.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # run production build
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run test       # Vitest
```

## Classic tracker behavior (`/tracker`)

- All application records, follow-ups, and stage events are stored in component state only.
- Refreshing the page resets every change to the shipped fictional demo data.
- The public demo uses no localStorage, sessionStorage, cookies, authentication, database, or external APIs.
- A persistent notice states: "Demo only. Fictional data. Changes are not saved. No authentication."
- Validation, deletion confirmation, empty states, stage and search filters are included.

## Applied vs. submitted vs. verified

- `applied` stage and applied dates are user-recorded and unverified.
- No employer receipt, response, or interview conversion is inferred.
- Summary counts are current stage snapshots, not conversion rates.

## Architecture

See `docs/architecture.md`.

## Limitations

- Data is not persisted; refresh resets changes.
- The public demo has no authentication, ownership, or privacy protection.
- Fictional seed data only.
- Browser local calendar date drives overdue follow-up calculations.
- The separate workspace requires configured Supabase authentication, RLS, and authenticated integration verification before private use.

## Secure workspace

The app includes a Supabase-backed private workspace at `/login` and `/workspace`.
Running it requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
Without them, the workspace shows an explicit not-configured state and no authenticated session is assumed.

The public demos at `/`, `/quest`, and `/tracker` remain credential-free and independent.

## Local verification vs. live Supabase

Locally verified:
- application SQL schema/policy tests using `@electric-sql/pglite`,
- config, guard, validation, unit, lint, typecheck, and build.

Still pending (not run here):
- live Supabase email/password sign-in or sign-up,
- hosted email confirmation,
- hosted OAuth,
- production cookie refresh over a deployed host,
- live owner-isolation enforcement against a Supabase project.
No remote CI run has been verified.

## CI

A GitHub Actions workflow is configured to run `npm ci`, `npm run test`, `npm run lint`, `npm run typecheck`, and `npm run build` without credentials. The workflow has not been run or verified on a remote runner yet.

## Workspace UX and offline status

`/workspace` supports composed company/role/notes search and stage filters, matching/total counts,
reset, distinct empty states, URL/date controls, accessible action feedback, pending submit
protection, and native deletion confirmation. Component tests use explicitly fictional props
and mocked server actions: **offline wiring, not live authentication or persistence**.
Existing server auth, owner, and origin guards remain in place; there is no fake backend fallback.
See [workspace UX evidence](docs/workspace-ux-evidence.md) for actual checks and limits.

`npm run backend:check` is an optional read-only Node diagnostic. It can load ignored
`.env.local` through Node's `--env-file-if-exists` flag; use a Node version supporting that flag.
It validates `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` before any
request. It performs bounded GETs to health and an anonymous applications query with the public
API key only, without a bearer/session, and never prints provider bodies or configuration values.
Anonymous 200 (including `[]`) requires review. 401/403 cannot prove schema presence or RLS correctness.
Exit 0 means only health HTTP success plus anonymous denial; **schema/owner isolation/persistence
remain NOT VERIFIED without authenticated integration tests**. The command was not run against
an environment during this task; unit tests stub fetch and use no network.

## Minimal hosted handoff (pending)

1. Open the exact **Career OS** free organization in Supabase; inspect and select the intended
   project. Organization read access previously worked; project listing returned scope 403.
   No project or hosted backend was configured or verified in this task.
2. Configure the selected project's URL and publishable key in ignored local `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). Never use a secret/service-role key.
3. Review `supabase/migrations/` and, with authorization, apply the migration to that exact target.
   No remote migration was performed here.
4. Configure the auth callback `http://127.0.0.1:3100/auth/callback` and run the local app on port 3100
   (`npm run dev -- --hostname 127.0.0.1 --port 3100`). Then perform authenticated integration
   tests for login, persistence, and two-user owner isolation.

This is not deployed and is not live-Supabase verified. No remote authorization was restarted.

## Local application preparation (`/prepare`)

COS-RESUME-PREP-001 adds a tab-local Configure/Inspect workbench and offline Python 3.9+
DOCX import/check plus deterministic source-content recommendations. Only explicitly allowlisted,
currently Red Finder-tagged original files are accepted. Generated private JSON must remain outside
the repository; browser import uses FileReader/state and clears on refresh/reset.

```sh
npm run resumes:import -- --allowlist /PRIVATE/resume-allowlist.json --jobs /PRIVATE/Candidates.json --out /PRIVATE/session.resume-bundle.json
npm run resumes:check -- --allowlist /PRIVATE/resume-allowlist.json --bundle /PRIVATE/session.resume-bundle.json
npm run resumes:recommend -- --bundle /PRIVATE/session.resume-bundle.json --allowlist /PRIVATE/resume-allowlist.json --out /PRIVATE/session.resume-recommendations.json
npm run resumes:test
```

Paths are placeholders. macOS `xattr` is required for live source checks; unavailable metadata fails
closed on every OS. The browser cannot read live Finder tags: rerun the local check before external
use. No extension or ATS is connected, and no forms are filled, files uploaded, or applications
submitted. No real profile ships on the public route. See [usage and schema](docs/resume-prep.md)
and [actual test evidence and remaining verification](docs/resume-prep-evidence.md).
