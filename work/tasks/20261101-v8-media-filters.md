# V8 Files search and moderation filters

Baseline: remote integration `d3e2032e444a8a8621904b45050257f85ef90f50`, PR #1558. One executor, coding-first continuation. No schema changes or provider configuration.

## Implementation

Adds EN/TL/CEB filename search, My uploads / all-visible scope, lifecycle status filtering, Apply/Clear and recoverable filtered-empty/error states. More and Refresh retain the same filters; changing or clearing filters resets the cursor. Controls retain existing phone-sized targets and constrained input widths. Context changes reset filters/results; stale controls and late results cannot repopulate a different account/congregation.

The existing service now owns authorized listing as well as upload/moderation/download. Membership determines reviewer access; caller-provided filters cannot elevate it. Repository queries AND tenant, owner/status/escaped case-insensitive filename filters with the existing published-or-owned visibility restriction and stable timestamp/ID pagination. Query text remains a value, never interpolated into OR expressions. Search accepts up to 80 characters without `*`; literal `%`, `_` and backslash are escaped. Returned cursors bind normalized filters; mismatched pagination is rejected. Membership/account/role are rechecked after metadata/quota reads before any records are released. Provider IDs and reviewer-only attestations stay redacted for members.

## Verification

20/20 focused V8 tests PASS (9 existing + 11 new): repository query construction, filter/cursor denials, member/reviewer visibility, role/account/tenant rechecks, UI Apply/More/Refresh/Clear, escaped search text, empty/error recovery, pre-notification account switch, late result isolation and actual TL/CEB rendering. A disposable PGlite 0.3.10 Postgres query confirmed literal wildcard/backslash filename matching with combined owner/status/tenant predicates and query-expression text isolation. No live database was used.

Application typecheck, production build, existing lint/format and whitespace checks PASS locally on Node 24.22.1. Browser/phone, deployed endpoint/RLS/Drive and exact-head integrated release QA remain deferred. Supabase changelog and official filter/ilike docs were consulted; no dependency versions or schema history changed. Deno 2.5.4 endpoint type check PASS on an identical isolated source copy with the existing pinned `@supabase/supabase-js@2.112.4` installed locally. Direct Deno registry resolution failed; the local-dependency check avoids that transport limitation. No repository dependency/lockfile changed.

No live migration, provider write, upload, moderation or real-user notification. Files remains disabled until the existing setup/backend acceptance is complete.
