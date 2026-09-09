# BibleQuest v3 continuation handoff

Updated: 2026-09-09 UTC

This file is the durable restart point if a chat or usage window ends. GitHub is authoritative; reconcile remote branches and workflow runs before changing code.

## Repository and immutable checkpoints

- Repository: `11ll11l1l1l/BibleQuest`
- Latest frozen base: `release/v3.42-team-center`
- Frozen base SHA: `b90bc7646f0a5464d3efa2c1f201ae3ba1827cf4`
- Exact v3.42 bookkeeping run: `34372856979` (complete accumulated suite green against the frozen SHA)
- Active remote branch: `feature/v3-trusted-score-events`
- Exact #70 functional candidate: `7d3cc6354ac5ff2b40004f6d66b32c5740c20b3b`
- Exact #70 functional run: `34407306308` (architecture, edge, browser/mobile all green against that exact SHA)
- Separate production-v2 safety PR: `#88` — stale-device progress conflict protection into `main`; draft and unmerged

## Current authoritative inventory

- Regression-tested: 69, including #69 Team Center after surviving the complete #70 suite.
- Verified: 1 (#70 Trusted score events).
- Implemented: 0.
- Not started: 30.
- Strict implemented-or-better parity: 70/100.
- Official regression stability: 69/100.
- Deferred by user priority: #15 Japanese furigana and Kids #38–40.

## #69 Team Center checkpoint

- `src/app/team-center.js` remains the sole team normalization, congregation scope, roster projection and management orchestration owner.
- `src/core/api.js` remains the sole browser Supabase/Edge Function boundary.
- Corrected functional candidate `fa6f6546ccf41b8c83621bd10fe3b92b5ca75f49` passed the entire accumulated suite in run `34367001625`.
- Exact bookkeeping candidate `b90bc7646f0a5464d3efa2c1f201ae3ba1827cf4` passed the complete accumulated suite in run `34372856979` and is frozen as `release/v3.42-team-center`.
- #69 is now Regression-tested because it survived the later complete #70 Trusted score events suite.

## #70 Trusted score events checkpoint

- `src/app/trusted-score-events.js` is the sole v3 client owner for authenticated congregation scope, score-event claim normalization, canonical event IDs, and trusted-response normalization.
- `src/core/api.js` remains the sole browser Supabase/Edge Function boundary and sends score claims only through the retained authenticated `bq-score` function.
- `bq-score` remains the trusted server authority for supported sources, point derivation, delegated scoring, active-membership checks, category/rate caps, duplicate handling, database writes, and badge evaluation. The browser does not calculate arbitrary award points and does not write `bible_score_events` directly.
- Stable event IDs are trimmed and capped to 120 characters before submission; duplicate canonical IDs in one browser batch fail before mutation. Cross-request/concurrent duplicate authority remains server/database-owned.
- A real authenticated account and active readable congregation are required. Local preview, guest, signed-out and foreign-congregation requests fail closed before remote submission; the trusted server independently rechecks authority.
- Permanent coverage: `TRUSTED_SCORE_EVENTS_V3.md`, `scripts/validate-v3-trusted-score-events.mjs`, `tests/v3-trusted-score-events-edge.mjs`, and `tests/v3-trusted-score-events-smoke.mjs`.
- Initial exact candidate `33c5f9cc446d61bcbda7a15262d41e3172020447` reached the browser stage in run `34406989680`; all architecture, edge, and prior browser regressions through Team Center passed, then the new #70 smoke test failed to parse because its fake API object was missing one closing brace. This was a test-only syntax defect; no application behavior was promoted from that run.
- Corrected exact candidate `7d3cc6354ac5ff2b40004f6d66b32c5740c20b3b` passed the complete accumulated architecture, edge, and Playwright/mobile suite in run `34407306308`.
- The isolated functional verification branch was reset from its temporary trigger commit to the exact clean candidate after success.
- Production Supabase, Cloudflare, v2 and `main` were not modified by #70.

## Exact next sequence

1. Finish only the #70 promotion/bookkeeping documentation on `feature/v3-trusted-score-events`.
2. Create/reset an isolated `verify/v3.43-trusted-score-events-bookkeeping` branch from that exact clean bookkeeping candidate.
3. Add only the temporary one-shot trigger required to run the manual-only workflow, with checkout/assertion pinned to the clean bookkeeping SHA.
4. Require all accumulated architecture, edge and Playwright/browser-mobile regressions to pass against that exact SHA.
5. Reset the bookkeeping verification branch to the clean candidate and freeze `release/v3.43-trusted-score-events` at that SHA.
6. Only after the freeze, create `feature/v3-leaderboards` from v3.43 and recover #71 Leaderboards data, ranking, privacy, empty/error and account-boundary contracts before implementation.

Production deployment remains out of scope during rebuild verification. Do not deploy pending migrations or functions merely to satisfy parity testing.

## Non-negotiable continuation rules

- Rebuild-and-verify; no patch accumulation.
- One owner/source of truth per responsibility.
- Run the complete accumulated regression suite after every milestone.
- Normal Actions stays `workflow_dispatch`-only; temporary push triggers belong only on isolated one-shot verification branches and never become release candidates.
- Never modify production v2, `main`, production Cloudflare or production Supabase during the rebuild without explicit approval.
- Never start implementation of the next feature before the current functional and bookkeeping/release gates close.
