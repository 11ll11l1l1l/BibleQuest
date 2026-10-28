# V8 P0/P1 — public Library to group discussion

Owner: accelerated V8 development, 2026-10-28. Single executor. Branch: `v8/library-group-handoff-20261028`, stacked on cleanup PR #1554 repair head `7440cbb1df2fa54b25e898c66fe76a57ccbc79d9`; released runtime base `87cb9dd4c3b60b9679e0acecda519300194b6d55`.

## Scope and implementation

- Refreshed V8 inheritance/phase plan against shipped V7.1; retain one engine and existing canonical cards, roles, tenancy and publication boundaries.
- Published/rights-verified public devotional/teaching detail pages expose related series from six explicit topic mappings. Unknown topics, books, unpublished/unreviewed or nondisplayable items offer no action.
- Public series-only link seeds host preview. Existing shared-session state overrides URL preference. No reading prose/IDs, private reflections, participant answers or new arbitrary prompt payload enter room state.
- EN/TL/CEB action/help text and deliberate English fallback; wrapping 44px phone actions.
- Extended existing real-authenticated built-app journey to enter via an actual Library reading, verify the selected series and waiting shared card, then continue explicit-send/two-phone delivery assertions. Existing role/tenant/race denial tests remain unchanged.

## Verification

21 affected local unit cases pass, including actual approved-catalog matching, publication/rights denial, privacy/URL minimization, canonical-state precedence, localized actions and existing session/privacy/focus/retry tests. Typecheck, lint and production build pass on local Node 24.22.1; not pinned release certification. Full V7 suite: 738/738 PASS; image ledger audit: 31 attempts, no problems; format check PASS. Build budget/integrity evidence will be generated against the committed source; the first unbound invocation correctly refused to run without BQ_BUILD_SHA. Local Playwright Chromium download returned truncated archives, so local browser PASS is not claimed; exact-built/authenticated browser proof is required from existing CI.

## Preservation and next step

No DB/provider/schema/migration writes, new dependencies, content publication, artwork generation, new realtime engine or production deployment. Cleanup runner fix is a separate parent commit. Complete affected exact-head CI, integrate parent cleanup, then merge/rebase this dependent task without replacing release identity. Next: P2 media/provider/moderation contract validation or P3 Ilocano source/licensing validation. Remaining V8 phases are not complete.
