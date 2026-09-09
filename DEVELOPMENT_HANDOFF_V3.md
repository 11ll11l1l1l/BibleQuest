# BibleQuest v3 continuation handoff

Updated: 2026-09-09 UTC

This file is the durable restart point if a chat or usage window ends. GitHub is authoritative; reconcile remote branches and workflow runs before changing code.

## Repository and immutable checkpoints

- Repository: `11ll11l1l1l/BibleQuest`
- Latest frozen base: `release/v3.41-presence`
- Frozen base SHA: `f8c576c3285a6a27e1b8e3cc2f6ee487d519650c`
- Exact v3.41 bookkeeping run: `34357429102` (complete accumulated suite green against the frozen SHA)
- Active remote branch: `feature/v3-team-center`
- Exact #69 functional candidate: `fa6f6546ccf41b8c83621bd10fe3b92b5ca75f49`
- Exact #69 functional run: `34367001625` (architecture, edge, browser/mobile all green against that exact SHA)
- Separate production-v2 safety PR: `#88` — stale-device progress conflict protection into `main`; draft and unmerged

## Current authoritative inventory

- Regression-tested: 68, including #68 Presence after surviving the complete #69 suite.
- Verified: 1 (#69 Team Center).
- Implemented: 0.
- Not started: 31.
- Strict implemented-or-better parity: 69/100.
- Official regression stability: 68/100.
- Deferred by user priority: #15 Japanese furigana and Kids #38–40.

## #68 Presence checkpoint

- `src/app/presence.js` remains the sole lifecycle, heartbeat, stale-state interpretation, session transition and cleanup owner.
- The retained RLS-protected `public.bible_presence` contract is reused without a production migration.
- Functional run `34354132909` passed against `7e5c6fb8938ef8ef95fbdc7275bb00060ca76334`.
- Bookkeeping run `34357429102` passed against `f8c576c3285a6a27e1b8e3cc2f6ee487d519650c`; that SHA is frozen as v3.41.
- #68 is now Regression-tested because the later complete #69 suite passed.

## #69 Team Center checkpoint

- `src/app/team-center.js` is the sole team normalization, congregation scope, roster projection and management orchestration owner.
- `src/core/api.js` remains the sole browser Supabase/Edge Function boundary.
- Reads include only active `game_team` rows in active congregations. Foreign, malformed, inactive and unsupported team rows fail closed.
- Ministry-capable congregation roles may create, add, remove and rename through the existing authenticated `bq-team` function. Only the creator or congregation admin may archive; the active creator cannot be removed.
- Existing congregation roles are displayed; no per-team role schema, score, leaderboard, presence, assignment, chat, XP or private-study ownership was invented.
- Permanent coverage: `TEAM_CENTER_V3.md`, `scripts/validate-v3-team-center.mjs`, `tests/v3-team-center-edge.mjs`, and `tests/v3-team-center-smoke.mjs`.
- Run `34366738460` failed because its edge mock returned an archived row the real `active = true` API query cannot return. Commit `fa6f6546ccf41b8c83621bd10fe3b92b5ca75f49` corrects the fixture by removing archived rows and memberships.
- Corrected run `34367001625` explicitly checked out/asserted `fa6f6546ccf41b8c83621bd10fe3b92b5ca75f49` and passed the entire accumulated suite.
- Production Supabase, Cloudflare, v2 and `main` were not modified.

## Exact next sequence

1. Commit and publish only the #69 promotion/bookkeeping changes on `feature/v3-team-center`.
2. Create/reset an isolated `verify/v3.42-team-center-bookkeeping` branch from that exact clean candidate.
3. Add only the temporary one-shot trigger required to run the manual-only workflow, with checkout/assertion pinned to the clean candidate SHA.
4. Require all architecture, edge and Playwright browser/mobile regressions to pass against that exact SHA.
5. Reset the verification branch to the clean candidate and freeze `release/v3.42-team-center` at that SHA.
6. Only after the freeze, create `feature/v3-trusted-score-events` from v3.42 and recover #70's schema, trusted-server authority, idempotency and duplicate-rejection contract before implementation.

Production deployment remains out of scope during rebuild verification. Do not deploy pending migrations or functions merely to satisfy parity testing.

## Non-negotiable continuation rules

- Rebuild-and-verify; no patch accumulation.
- One owner/source of truth per responsibility.
- Run the complete accumulated regression suite after every milestone.
- Normal Actions stays `workflow_dispatch`-only; temporary push triggers belong only on isolated one-shot verification branches and never become release candidates.
- Never modify production v2, `main`, production Cloudflare or production Supabase during the rebuild without explicit approval.
- Never start implementation of the next feature before the current functional and bookkeeping/release gates close.
