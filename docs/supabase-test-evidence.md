# COS-SUPABASE-PREP-001 test evidence

## Test command
`npm test`

## Red -> green cycles (brief)
1. `lib/supabase/config.test.ts`: configured missing-env case first, then implemented `getSupabasePublicConfig`.
2. `lib/security/redirects.test.ts` and `lib/security/same-origin.test.ts`: unsafe redirect/same-origin cases first, then guards.
3. `tests/sql/applications-rls.test.ts`: real PostgreSQL policy assertions via `@electric-sql/pglite`, not mocks:
   - owner CRUD passes;
   - invalid stage, empty company, non-HTTP URL rejected by constraints;
   - anonymous select/insert/update/delete denied;
   - cross-owner read/update/delete yields no rows;
   - insert as user B with owner A rejected;
   - owner reassignment rejected.
4. Auth and workspace actions use verified server identity and domain validation; UI mutation validation is covered by existing `domain/domain.test.ts`.

## Current result
`npm test`: 65 tests passed, 14 test files.

Additional Codex finding coverage:
- loopback origin validation and canonical origin matching;
- server-action wiring tests for missing verification, origin guard, owner scoping, delete failure, signout failure;
- SQLSTATE/constraint assertions and RLS ownership diagnostics;
- btrim/nonempty URL/role/company and URL authority constraints;
- `updated_at` trigger advancement.
Remaining: cookie adapter behavior is not directly tested, and live Supabase auth/refresh/RLS remains unverified.