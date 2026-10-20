# CareerOS architecture (COS-ARCH-001)

Source: attached `careeros-architecture-2026-10-15.md`.

## Milestone 1: local demo

Credential-free demo built with Next.js App Router, TypeScript, and Tailwind.

- Fictional demo data explicitly labeled.
- Create, edit, delete, and stage filtering.
- Client-side in-memory state only; refreshing resets all changes.
- Persistent notice: "Demo only. Fictional data. Changes are not saved. No authentication."
- Accessible forms, keyboard navigation, validation feedback, empty states, and deletion confirmation.

No login screens, simulated authenticated identities, Supabase clients, database writes, or privacy-protection claims. Application contents are not logged.

## Implementation boundaries

- `app/`: page composition, layout, and route-level UI.
- `components/`: tracker, filters, forms, dialogs, and demo notice.
- `domain/`: TypeScript models, validation, stage transitions, and analytics (React- and storage-independent).
- `demo/`: explicitly fictional fixtures.
- `state/`: client-side reducer managing applications and related records.

Domain logic is independent of React and storage. Stable IDs and injectable time support deterministic tests. State is scoped to the browser component tree; no server module globals hold user data.

## Domain model

Stages: `saved`, `applied`, `screening`, `interview`, `offer`, `rejected`, `withdrawn`. Corrections and backward movement are allowed; each actual stage change is recorded. Initial stage assignment is not treated as a transition.

Entities implemented for the demo:

- Applications: id, company, role, optional posting URL, stage, applied date, notes, timestamps.
- Follow-ups: id, application id, due date, optional completion timestamp, notes.
- Stage events: id, application id, previous/new stage, occurrence time, recording time.

Future entities (recruiters, resume versions, junction tables) are documented but not implemented in this demo.

Validation covers required text, length limits, stage values, dates, and HTTP(S) URLs. Invalid mutations are rejected without partially changing state. Notes are rendered as plain text.

## Analytics

Analytics state their definitions and use available evidence only:

- current stage counts,
- recorded applications by date,
- overdue follow-ups.

No missing stage history, employer response times, interview conversion, outcomes, or submitted-vs-verified ratios are inferred from current stage. Fictional metrics and undefined denominators are labeled as undefined.

## Later private Supabase phase

Persistence behind a small storage boundary, once credentials and authentication exist:

- `owner_id` on every private table.
- RLS owner-scoped policies for reads, inserts, updates, deletes, including existing-row and new-row checks.
- Same-owner relationships enforced via database constraints, including junction tables.
- Server-side verification using the supported Supabase SSR flow; never authorize from client state or an unverified session alone.
- Fail closed on verification failure/unavailability; authorize every server mutation independently.
- Keep personalized responses out of shared caches.
- Browser-safe publishable key with RLS; never expose service-role credentials.

Before private use, test anonymous denial, cross-owner access, forged ownership, relationship injection, expired sessions, and verification failures.

## Threats and tradeoffs

In-memory state keeps milestone 1 credential-free and avoids storing personal data, but loses changes on refresh and provides no authentication or durability. Strictly a demo.

Future risks: broken ownership checks, cross-user relationships, stale auth, cached private responses, injected content, exposed secrets, sensitive logs. Mitigate with RLS, constraints, verified server authorization, cache isolation, safe rendering, secret separation, and minimal logging.

AI review is secondary and disabled by default; require explicit consent per submission, show exact content and recipient, allow redaction, explain retention.

## Acceptance

- Domain and reducer tests cover validation, CRUD, filtering, stage-event creation, and analytics edge cases.
- Lint, TypeScript checking, tests, and production build pass.
- CI runs checks without credentials.
- README covers setup, fictional data, refresh reset, limitations, architecture, and future auth requirements.
- `.env.example` contains only commented future public Supabase placeholders.

Architecture approval remains pending human walkthrough (COS-ARCH-001).