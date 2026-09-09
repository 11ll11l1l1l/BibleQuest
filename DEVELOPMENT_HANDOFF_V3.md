# BibleQuest v3 continuation handoff

Updated: 2026-09-10 JST

This file is the durable restart point if a chat or usage window ends. GitHub is authoritative; reconcile remote branches and workflow runs before changing code.

## Repository and immutable checkpoints

- Repository: `11ll11l1l1l/BibleQuest`
- Latest frozen base: `release/v3.43-trusted-score-events`
- Frozen base SHA: `80d01efa06f3ff08a0284389cf027d16afd35225`
- Exact v3.43 bookkeeping run: `34407984154` (complete accumulated suite green against the frozen SHA)
- Active remote branch: `feature/v3-leaderboards`
- Exact #71 functional candidate: `08345c522c007679915d9a072db8cbd81fdd4eec`
- Exact #71 functional run: `34411253995` (architecture, edge, browser/mobile all green against that exact SHA)
- Separate production-v2 safety PR: `#88` — stale-device progress conflict protection into `main`; draft and unmerged

## Current authoritative inventory

- Regression-tested: 70, including #70 Trusted score events after surviving the complete #71 suite.
- Verified: 1 (#71 Leaderboards).
- Implemented: 0.
- Not started: 29.
- Strict implemented-or-better parity: 71/100.
- Official regression stability: 70/100.
- Deferred by user priority: #15 Japanese furigana and Kids #38–40.

## #70 Trusted score events checkpoint

- `src/app/trusted-score-events.js` remains the sole v3 client owner for authenticated congregation scope, score-event claim normalization, canonical event IDs, and trusted-response normalization.
- `src/core/api.js` remains the sole browser Supabase/Edge Function boundary and sends score claims only through the retained authenticated `bq-score` function.
- `bq-score` remains the trusted server authority for supported sources, point derivation, delegated scoring, active-membership checks, category/rate caps, duplicate handling, database writes, and badge evaluation. The browser does not calculate arbitrary award points and does not write `bible_score_events` directly.
- Corrected exact functional candidate `7d3cc6354ac5ff2b40004f6d66b32c5740c20b3b` passed the complete accumulated architecture, edge, and Playwright/mobile suite in run `34407306308`.
- Exact bookkeeping candidate `80d01efa06f3ff08a0284389cf027d16afd35225` passed run `34407984154` and is frozen as `release/v3.43-trusted-score-events`.
- #70 is now Regression-tested because it survived the later complete #71 Leaderboards suite.

## #71 Leaderboards checkpoint

- `src/app/leaderboards.js` is the sole v3 period/lane normalization and ranking-projection owner.
- `src/core/api.js` remains the sole browser Supabase boundary and consumes the retained `public.bible_leaderboard(uuid,timestamptz)` aggregate plus the active congregation directory.
- The recovered board retains Today / This Week / All Time and eight lanes: Overall, Knowledge, Reading, Wisdom, Mastery, Consistency, Group and Couples.
- Rankings sort by trusted points descending, then display name; active congregation members remain visible with zero points; scores for former/out-of-scope members fail closed from the projection.
- `overall` is a presentation sum of trusted server category aggregates. #71 does not calculate source award points and does not own trusted score writes, XP, badges, awards or #72 Recognition.
- Period cutoffs use the active congregation's existing IANA timezone when present, with browser-local timezone only as fallback. Today starts at congregation-local midnight and This Week starts Monday at congregation-local midnight.
- Initial exact candidate `4286669555e8a1ce7faf59a9d74f28c920d9ca06` exposed a literal adjacency assumption in the #70 validator before runtime testing; the validator was corrected to verify exported API boundaries structurally.
- Candidate `d44479b4543a4e56f7507c8836245a918e1c3b57` then exposed a real timezone defect in #71: CI UTC was incorrectly used for recovered local period boundaries. The owner was corrected and permanent Asia/Tokyo plus America/New_York edge coverage added.
- Corrected exact functional candidate `08345c522c007679915d9a072db8cbd81fdd4eec` passed the complete accumulated architecture, edge and browser/mobile suite in run `34411253995`.
- The isolated functional verification branch was reset from its temporary trigger commit to the exact clean candidate after success.
- Production Supabase, Cloudflare, v2 and `main` were not modified by #71.

## Exact next sequence

1. Finish only the #71 promotion/bookkeeping documentation on `feature/v3-leaderboards`.
2. Create/reset isolated `verify/v3.44-leaderboards-bookkeeping` from the exact clean bookkeeping candidate.
3. Add only the temporary one-shot trigger required to run the manual-only workflow, with checkout/assertion pinned to the clean bookkeeping SHA.
4. Require all accumulated architecture, edge and Playwright/browser-mobile regressions to pass against that exact SHA.
5. Reset the bookkeeping verification branch to the clean candidate and freeze `release/v3.44-leaderboards` at that exact SHA.
6. Only after the freeze, create `feature/v3-congregation-recognition` from v3.44 and recover #72 Recognition load/award/display/permission contracts before implementation.

Production deployment remains out of scope during rebuild verification. Do not deploy pending migrations or functions merely to satisfy parity testing.

## Non-negotiable continuation rules

- Rebuild-and-verify; no patch accumulation.
- One owner/source of truth per responsibility.
- Run the complete accumulated regression suite after every milestone.
- Normal Actions stays `workflow_dispatch`-only; temporary push triggers belong only on isolated one-shot verification branches and never become release candidates.
- Never modify production v2, `main`, production Cloudflare or production Supabase during the rebuild without explicit approval.
- Never start implementation of the next feature before the current functional and bookkeeping/release gates close.
