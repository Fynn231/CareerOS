# COS-RESUME-PREP-001 evidence

## Current parent verification — October 19, 2026

This supersedes the worker-only checkpoint below. Parent ran the real authorized seven-source Red allowlist through import/check/recommendation export and exercised the current production build in an isolated Chrome profile. Original DOCX bytes and raw Finder tags were rechecked unchanged. Outputs remain private/off-repository (mode 0600); no cloud profile, employer upload or submission was performed.

- **24 Python tests PASS**; **104 JavaScript/TypeScript tests across 22 files PASS**; lint, typecheck and production build PASS.
- Actual intake: **7 source documents, 358 nonempty body paragraphs, 141 exact-text claim groups, 11 populated contact/education candidate fields**, retaining source references and qualifiers. This is not structured employment-history autofill or independent factual attestation.
- **12 researched job records** imported and ranked; source compensation amounts/units, requisition IDs, future starts, application status and research date are retained. These are research snapshots, not a fresh live-availability check.
- Production browser checks: all 12 IDs selectable, shared matcher agrees, filtering clears stale selections, manual override, complete source inspection, refresh/reset clearing, restored import focus, malformed-file recovery, desktop styles, 390×667 mobile width, Quest navigation and signed-out workspace redirect. **No browser network requests during private import/selection/review; no captured browser runtime/console errors.** Screenshots use fictional data only. The Node test-fixture loader emits a harmless module-type warning; this is separate from browser console errors.
- Targeted source/build scan found no exact actual email/phone values in 483 scanned files (dependencies/Git/env files and oversized files excluded); this is a scoped check, not a general DLP/security certification.

### Independent review repairs and observed failures

1. Unlabelled/tab-indented contact and education layouts, summary/headline detection, LinkedIn URL spelling, missing compensation fields: realistic fictional regressions observed failing, then passing; actual source fields rechecked.
2. A hidden filtered-out job retained its recommendation/override: regression observed failing, then passing.
3. Collapsing import controls exposed a reset-focus failure in real Chrome; deferred focus until after render, reran browser GREEN.
4. Sentence-ending periods reduced technical coverage to zero: regression observed failing, then passing while preserving C++, C#, .NET and Node.js.
5. Orphaned Word headers contaminated facts: regression observed failing, then passing by following active document references/relationships. Test fixtures now correctly reference their intended headers/footers.
6. In-memory ranked input was not bound to checked disk input: differing-valid-bundle regression failed before the repair; Node now compares the snapshot and pins both checks/export to its SHA-256. A real synthetic CLI round-trip tests good and bad digests.
7. A source substring `SQL` was accepted as an email: rejected by an observed RED/GREEN format regression. This does not establish complete semantic validation of other free-text fields.
8. More than 10,000 claim references produced a consumer-incompatible bundle: observed RED/GREEN; source/field provenance limits now enforced at production.

### Current trust boundary and remaining work

Browser imports remain user-supplied, source-linked **review candidates**. Browser validation is not full re-extraction, a signature, identity verification, or current Finder access; free-text field meaning still needs human confirmation and stronger shared derivation before unattended form filling. The CLI regenerates and compares source-derived fields against live approved originals before export. There is **no ATS adapter, original-file attachment, submission, authenticated resume storage or generic employment autofill** in this slice. Hosted login/CRUD/two-user acceptance and legacy-key owner review are separate outstanding gates. No deployment or Git push.

## Historical worker-only checkpoint — October 18, 2026

Date: 2026-10-18. Scope: fictional fixtures only; original project work preserved. No actual resumes, allowlist, vault, private profile directories, environment/auth files, browser session, live backend/network, upload, deployment, commit, or production build was accessed/run for this implementation. All Python fixture files were created under the explicitly supplied `TMPDIR`, using `TemporaryDirectory(dir=os.environ['TMPDIR'])`; no default-temp fallback or build copy was used.

## Recorded RED → GREEN

Commands below were actually run, including the failures. Initial module-absent failures demonstrate test-first entry points; the later hardening failures exercised implemented behavior directly.

| Slice | RED observed | GREEN observed |
| --- | --- | --- |
| Python source import/evidence/private output | `PYTHONPATH=scripts python3 -m unittest discover -s scripts/resume_prep -p 'test_*.py'`: import error, missing `core` | Same command: 6 tests passed after importer implementation |
| Content matching and bundle validation | `npm test -- --maxWorkers=2 lib/resume-prep/matching.test.ts`: missing `matching.mjs` | Same command: 3 tests passed |
| Source-rechecking recommendation CLI | `npm test -- --maxWorkers=2 scripts/resume-recommend.test.ts`: missing `resume-recommend.mjs` | Same test: 2 passed after implementation and moving the Node CLI test to its Node environment |
| Tab-local workbench | `npm test -- --maxWorkers=2 app/prepare/PrepareWorkbench.test.tsx`: missing component | Same command: 2 passed after implementing the component, correcting JSX syntax, and correcting a test query for repeated provenance |
| DOCX authenticity, parent permissions, source/profile mismatch | `npm run resumes:test`: 2 failures (generic XML accepted as DOCX; newly created intermediate parent mode 0755) and 1 error (missing profile recheck function) | 12 Python tests passed after real content-type/root checks, private intermediate parents, and evidence/profile regeneration checks |
| Duplicate JSON keys and exact degree extraction | `npm run resumes:test`: 2 failures (duplicate keys accepted, explicit recognized degree absent) | 15 Python tests passed after fixes |
| Complete paragraph claim coverage | `npm test -- --maxWorkers=2 lib/resume-prep/matching.test.ts`: omitted claim accepted | 4 matcher tests passed after complete/exact/unique source coverage and part/section validation |
| Exact GPA precision | `npm run resumes:test`: 3.7059 / 4.0000 was truncated to 3.705 | 16 Python tests passed after exact numeric-segment extraction and range/approximation rejection |
| Dedicated VC fallback | Matcher test returned a specialist recommendation for a generic investment headline | 5 matcher tests passed after requiring explicit venture/VC headline evidence |
| Bounded interoperable JSON | Python test accepted nonfinite numeric input | 17 Python tests passed after finite-number, nesting/node, duplicate/dangerous-key validation |

The first lint pass reported two unused-argument warnings; these were removed. The first typecheck found three subprocess-stub signature errors; explicit CLI declaration types corrected those. Added UI tests also verify oversize rejection, Inspect, and inert hostile text. No test results are represented as live ATS evidence.

## Final requested checks

| Command | Actual result |
| --- | --- |
| `npm run resumes:test` | PASS, 17 Python tests |
| `npm test -- --maxWorkers=2` | PASS, 99 tests / 22 files (original 89 tests / 19 files retained) |
| `npm run lint` | PASS, no warnings/errors |
| `npm run typecheck` | PASS |
| Production build | Not run; parent-owned |

Expected Python negative cases print fixed validation errors without resume contents. Unsafe ZIP cases independently exercise traversal, XML declarations/UTF-16/depth, encryption, invalid ZIP bytes, and expansion limits.

Python coverage: per-file tag name/suffix handling, subprocess hex decoding/unavailability, wrong/missing metadata, hashes/counts/basenames, missing/duplicate/symlink/unreadable sources, document authenticity, malformed/unsafe ZIP/XML and expansion limits, table/header/footer/tab/break/hyperlink evidence, GPA precision without truncation, exact claim deduplication and conflict provenance, unchanged original bytes, public job mapping/units, conservative explicit education fields, source/profile mismatch, all-source pre-write recheck, no write on failure, resolved repository/symlink boundaries, exclusive creation, and file/parent permissions.

A fictional end-to-end subprocess test also runs import → source/bundle check → recommendation export, checks mode 0600 and preserved qualifiers, changes the synthetic original, and confirms the next export is blocked. This uses a fake `xattr` executable injected into that child process’s PATH under the approved fixture directory; it never queries actual Finder metadata.

JavaScript coverage: content-based rankings despite misleading filenames, repeated-term resistance, ties/no coverage, specialist fallback, policy/conflict review, malformed/hostile/stale bundles, complete paragraph evidence coverage, source-check/export subprocess contracts, tab-local import/filter/job selection/recommendation/manual override/reset, empty/error/conflict/manual-blank states, oversized input, inert text rendering, and no fetch/WebSocket activity. All fixture names, domains, document contents and job metadata added for this feature are fictional. UI tests use jsdom, not an actual browser or ATS.

## Changed paths

- `scripts/resume_prep/{__init__,core,test_core}.py`, `scripts/resume-prep.py`, `scripts/resume-output.py`: stdlib import/check/private-output foundation and tests.
- `scripts/resume-recommend.{mjs,d.mts,test.ts}`: offline recommendation CLI and subprocess contract tests.
- `lib/resume-prep/{matching.mjs,matching.d.mts,matching.test.ts,test-fixture.ts}`: shared browser-safe validation/matching and fictional fixtures.
- `app/prepare/{page.tsx,PrepareWorkbench.tsx,PrepareWorkbench.test.tsx,prepare.module.css}`: local review workbench.
- `components/quest/QuestDeck.tsx`, `app/tracker/page.tsx`: Application prep links.
- `package.json`, `.gitignore`, `README.md`, `docs/resume-prep.md`, this evidence file: commands, generated-file protections, usage/schema/limits.

## Remaining verification

Parent-owned: actual authorized Red-file import/check, actual macOS metadata and private output permissions, real-job recommendation review, independent browser/mobile/keyboard visual QA, and production build. Browser state cannot check current Finder tags or prove a bundle's authenticity. Explicit local source/profile rechecks are necessary before external use. No ATS form filling, original-file attachment, upload, employer policy determination, submission, persistence, employment inference, or universal coverage is implemented or claimed.
