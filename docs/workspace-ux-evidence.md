# COS-WORKSPACE-UX-001 evidence

2026-10-17. Scope: local repository only; fictional component fixtures and mocked server actions,
plus injected fetch stubs. These are offline wiring tests, not live authentication or persistence.
The supplied parent baseline was 67 tests / 14 files. Existing source and security tests were preserved.

## Vertical RED/GREEN observations

Each implementation row below was introduced as one test, run to observe RED, followed by
minimal implementation and a focused GREEN run before the next behavior test.
Command: `npm test -- app/workspace/WorkspaceApplications.test.tsx --maxWorkers=2`.

| Behavior | Actual RED | Actual GREEN |
| --- | --- | --- |
| Composed company/role/notes case-insensitive search, stage, matching/total, reset | Missing searchbox | 1/1 |
| Initial empty vs no matches | Missing no-match message | 2/2 |
| Create/update URL/date input types | Missing type=url | 3/3 |
| Delete confirmation, Cancel/Escape/focus, action FormData and sibling forms | Delete called before confirmation | 4/4 |
| Create/update/delete pending and live result roles | Create button not disabled | 5/5 |

Command: `npm test -- scripts/backend-check.test.ts --maxWorkers=2`.

| Behavior | Actual RED | Actual GREEN |
| --- | --- | --- |
| Missing/invalid config: names only and zero fetch | Module absent (suite could not load) | 1/1 |
| Anonymous denial: exact read-only endpoints, public apikey only | Expected exit 0, received 1 | 2/2 |
| Anonymous HTTP 200: review-needed, redaction | Expected nonzero, received 0 | 3/3 |
| Health HTTP failure: stop and fixed redacted diagnostic | Expected nonzero, received 0 | 4/4 |
| Network failure: fixed redacted diagnostic | Raw injected exception rejected | 5/5 |
| Timeout: bounded even for nonsettling fetch, abort signal | Missing signal (undefined) | 6/6 |

An additional configuration regression matrix passed immediately (7/7 backend tests); no new
implementation was required. It covers rejected credentials/path/query/hash/foreign or insecure
origins, recognizable secret/service-role keys, and accepted loopback HTTP with anonymous 401.
It was not a RED/GREEN implementation cycle.

A first typecheck found a fetch-mock inference error in the timeout test; typing the mock as
`typeof fetch` and inspecting its optional request signal fixed it. No production typing relaxation.

## Final checks

- `npm test -- --maxWorkers=2`: PASS, 79 tests / 16 files (including all original 67).
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run build`: attempted; FAIL due to sandbox restriction in Turbopack CSS processing:
  `[project]/app/globals.css.css [app-client] (css)` → `creating new process` →
  `binding to a port` → `Operation not permitted (os error 1)`.
  No sandbox/configuration weakening or alternate build was attempted. Parent must rerun outside.
- After the final filter-control styling adjustment, tests/lint/typecheck were rerun (results below).

## Limits and invariants

No live backend diagnostic, authentication, network/backend integration, remote migration,
deployment, authorization restart, dependency installation, or git commit/push/merge occurred.
No credential or `.env.local` contents were read. The optional backend CLI was not executed.
Supabase configuration is unverified; organization read previously worked but project-list scope
returned 403 (supplied context, not retried here).

The backend check uses only GET, rejects redirects, has a default 5-second bound per request
(capped at 10 seconds for injected timeout values), sends only the public API key and no bearer,
and does not read or print provider bodies. Anonymous 200 is review-needed even for empty data.
401/403 alone cannot prove schema presence or RLS correctness. Every result states:
**Schema/owner isolation/persistence NOT VERIFIED without authenticated integration tests.**

Auth/owner/origin action implementations, SQL policies, fictional demo, and original tests are unchanged.
Native dialog semantics are tested with the existing jsdom dialog shim; no real-browser or assistive
technology session was performed. Native browser focus trapping relies on `showModal()`.

Final post-styling rerun: `npm test -- --maxWorkers=2` PASS (79/79, 16/16 files),
`npm run lint` PASS, `npm run typecheck` PASS. Build restriction above remains unresolved.
