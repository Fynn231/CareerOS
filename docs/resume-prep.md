# COS-RESUME-PREP-001: local application preparation

`/prepare` is an empty, browser-local Configure/Inspect workbench. Select an explicitly generated private JSON bundle to review sourced facts, original resume variants, public job metadata, recommendations, alternatives, conflicts, and all paragraph evidence. Quest and the classic tracker link to it. `/workspace` authentication is unchanged.

**Local preparation only — no forms filled, files uploaded, or applications submitted.** Browser extension and ATS connections are not connected. There is no universal autofill, generic employment autofill, generated narrative answer, or hiring/eligibility probability. Recommendations never change application status.

## Local commands

Requirements: Python 3.9+ standard library, the project's existing Node runtime, and macOS `xattr` with readable per-file Finder metadata. No Python packages, credentials, services, or network access are needed. Other operating systems fail closed when current Finder metadata cannot be read; there is no metadata bypass flag.

Use absolute paths in an owner-private directory **outside this repository**, including its `public` tree. Commands exclusively create the output and never overwrite existing files. Newly created parent directories use mode 0700; the final parent must be private even when it already exists. Output files use mode 0600. Symlink-resolved output boundaries are checked. Use a new output filename after re-importing.

```sh
npm run resumes:import -- \
  --allowlist /PRIVATE/resume-allowlist.json \
  --jobs /PRIVATE/Candidates.json \
  --out /PRIVATE/session.resume-bundle.json

# Revalidate originals without printing document contents.
npm run resumes:check -- --allowlist /PRIVATE/resume-allowlist.json

# Also check that the bundle's source evidence and profile still match originals.
npm run resumes:check -- \
  --allowlist /PRIVATE/resume-allowlist.json \
  --bundle /PRIVATE/session.resume-bundle.json

npm run resumes:recommend -- \
  --bundle /PRIVATE/session.resume-bundle.json \
  --allowlist /PRIVATE/resume-allowlist.json \
  --out /PRIVATE/session.resume-recommendations.json
```

`/PRIVATE` is a placeholder, not a directory created by these instructions. The importer never discovers or expands sources: only the explicit allowlist records are considered. It checks all sources again before writing. The recommendation CLI uses the same browser-safe matcher and calls Python with subprocess argument arrays, first to validate sources/profile before ranking and again before private export. A missing, changed, untagged, or mismatched source blocks the operation. Console output is limited to counts/output location or fixed errors. Originals and their tags are read only.

The browser cannot inspect current Finder tags. The bundle's timestamp, raw tag strings, filenames, and SHA-256 values are **snapshots**, not live verification. Rerun `resumes:check` with `--bundle` before any external use. Reset and refresh discard tab state. Re-import a fresh bundle if sources change. This slice does not select a local original through a file upload control or attach anything to an employer site.

The recommendation CLI compares the ranked memory snapshot with the disk bundle and pins both Python checks to its raw-byte SHA-256. Exports include `bundleSha256`; changing the input between read/check/export blocks the operation. The private writer also checks job/resume identities. This binds a local export to checked input; it is not a signature or independent factual attestation.

## Input schemas

Allowlist JSON:

```json
{
  "verified_count": 1,
  "records": [{
    "resume_id": "fictional_variant",
    "filename": "fictional.docx",
    "path": "/PRIVATE/fictional.docx",
    "sha256": "<64 hexadecimal characters>",
    "format": "docx"
  }]
}
```

IDs must be unique ASCII letters/digits/underscores/hyphens (1–80 characters); paths must be unique absolute paths, with matching basenames and `.docx` suffixes. Sources must be regular readable files, with no symlinks in their paths, matching SHA-256, and real DOCX document content types. Count must exactly equal the nonempty records list (maximum 100 sources).

Finder tags are read per file through `xattr -px com.apple.metadata:_kMDItemUserTags`, decoded with `bytes.fromhex`, then parsed with `plistlib`. A tag's **name before its first newline** must equal Red, case-insensitively. The raw suffix is preserved. Numeric color indexes, filenames, Blue tags, and ancestor tags are never substitutes. Missing, malformed, or unavailable metadata fails closed.

Jobs use the parent Candidates shape: `{ "records": [...] }`, with an optional `manifest.verified_on` research date. Each supplied job needs a unique string `candidate_id` and a string `title`. Public fields include title/track/employer/source_url, education/experience/requirements/gaps, deadlines/start dates and notes, classification, AI-use notes, exact compensation and its units/notes (`pay_exact`, `pay_unit`, `pay_notes` and alternate salary keys), ATS/requisition IDs, weekly hours, original application status and submission-ready flag. A supplied research date is retained as `research_snapshot_on`; it is not a live availability check. Private evidence paths and extra notes are omitted. Requirements may be a string or structured object. No job discovery or URL fetching occurs; earlier qualification notes may predate resume ingestion and need review.

## Bundle schema v1

- `schemaVersion: 1`, `verifiedAt`: local source-check timestamp.
- `resumes[]`: `id`, `basename`, `sha256`, raw `finderTags`, complete `paragraphs`, `sourceText`, and exact source text for a detected short role headline and explicit summary paragraph. Undetected headline/summary values are empty. Detection is conservative and still needs human review.
- Each paragraph has `part`, zero-based `index`, `section` (body/header/footer), and exact extracted `text`. Tables, tabs, line breaks, and HTTP/HTTPS/mailto hyperlink targets are preserved as text. Hyperlink targets are never fetched or rendered as active links.

Only document-referenced header/footer parts are considered; orphaned ZIP members and obsolete section-change references do not contribute profile facts. Conditional Word rendering and unusual specialist headline layouts still need manual inspection.
- `claims[]`: identical text is grouped exactly, with references to every contributing paragraph; different claims are never semantically merged. Every source reference includes `resumeId`, `part`, zero-based `paragraph`, and `section`.
- `fields`: fullName, email, phone, location, linkedin, school, degree, major, minor, graduation, gpa. Each contains `value`, `status`, and `candidates[{value,sources}]`. One exact value is supported; differing exact values produce `needs-review` and a blank selected value; absent values are `unknown` and blank.
- `jobs[]`: mapped public job records, keeping supplied IDs and units.

Field extraction favors explicit labels, a conservative leading contact block, education-section school/date lines, exact degree names, and recognizable email/phone/LinkedIn/GPA text. Leading Word tabs are retained in evidence but ignored for classification. A short person-like contact-block name is a review candidate, not identity verification. School/date inference is restricted to education, excluding scholar/program/department labels and later employment. Minor/major labels can occur after pipes or tabs; a degree's explicitly stated major is retained. LinkedIn uses the common literal domain/path shared by displayed and linked URL spellings, retaining provenance without false scheme/WWW conflicts. Other conflicting values remain blank. Ambiguous names/dates can still be unknown; review candidates before external use. GPA is copied exactly, never rounded. No first/last split, experience-duration sum, work authorization, sponsorship, demographic/disability inference, salary expectation, attestation, or skill-mastery assessment is produced. Raw source evidence remains available for manual employment review; projects are not converted into employer records, and modeled/projected/approximate qualifiers are retained.

ZIP/XML parsing never extracts arbitrary paths. It rejects traversal, duplicate entries, symlink members, encrypted files, invalid CRC/XML, declarations/entities, unsupported document types, excessive XML depth/element counts, and suspicious expansion ratios. Limits include 20 MiB per compressed source/member, 32 MiB total expanded ZIP, 512 entries, 10,000 paragraphs and 1,000,000 source-text characters per resume, 30,000 claims, 2,000 jobs, and 16 MiB serialized output/browser import. Unusual DOCX encodings and very large documents may be rejected; images, OCR, footnotes, and visual layout interpretation are not supported.

## Recommendation meaning

The deterministic ESM matcher compares unique content terms from title/track/requirements against actual source paragraphs. Matching title/track terms and source headline/summary emphasis receive extra weight; relevant role-family coverage adds a small bonus. Filenames do not contribute to scores. Evidence references retain the source paragraph text, including its qualifiers. Repeating a keyword cannot multiply its score.

All ranked alternatives are available. No coverage, weak coverage, tied scores, profile conflicts, specialist gaps, and AI-material restrictions require review. Without a dedicated design/law/healthcare/venture-capital headline, the selection is labelled **Closest available variant**; no specialist file is invented. Manual override changes only the tab's selection. AI restriction metadata triggers manual employer-policy review and never generation or upload. Scores describe term coverage, not qualification or hiring probability.

## Private handling and limits

Keep original resumes, allowlists, generated bundles, recommendation exports, and real-job private notes outside Git, fixtures, docs, `public`, server routes, Supabase, and browser storage. The workbench uses FileReader and React state only; it has no profile endpoint, fetch/POST, beacon, WebSocket, storage, telemetry, or global profile. It renders imported values as React text, never HTML. Copy is manual through the read-only preview; no automatic clipboard operation is provided. Unsupported or malformed bundles produce fixed errors without echoing imported contents. Reset cancels in-flight file reads and clears state.

Browser validation checks structure, source references, completeness and email format; it does **not** fully re-derive the meaning of every free-text field or prove that a third-party bundle is authentic. All imported values remain review candidates. The local CLI re-extracts and compares the full derived profile before export. A stronger shared derivation/confirmation flow is needed before unattended form filling. Provenance is capped at 10,000 references per claim/field value and 1,000 candidates per field to align with consumer limits.

Tests use fictional sources with injected metadata/subprocess readers. One macOS-only CLI round-trip sets and reads a Finder tag on its newly created synthetic temporary DOCX, never an original; it is skipped on other systems, where production metadata checks still fail closed. Synthetic tests do not establish behavior on the user's actual sources or live ATS connectivity. Independent actual-source, browser and production-build checks are recorded separately. See [recorded evidence](resume-prep-evidence.md).
