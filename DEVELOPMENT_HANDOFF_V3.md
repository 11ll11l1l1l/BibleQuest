# BibleQuest v3 continuation handoff

Updated: 2026-09-09 UTC

This file is the durable restart point if a chat or usage window ends. GitHub is authoritative; do not reconstruct work from conversation memory alone.

## Repository and immutable checkpoints

- Repository: `11ll11l1l1l/BibleQuest`
- Frozen base: `release/v3.38-journey-groups`
- Frozen base SHA: `7c06c3380eaac0e20e579ae26453611e63ac564d`
- v3.38 bookkeeping run: `34259986598` (reported complete accumulated suite green)
- Active remote branch: `feature/v3-encouragements`
- Canonical remote #65 code commit: `b2fb1013822891930e017c8da0ea38e3e5c68b9e`
- Canonical code tree: `ec448f88874710b0cb45dc7b127beac44e9e97a1`
- Local equivalent commit: `bb6944e422510f3e35de8052563172317fa450bd` (same tree; commit metadata differs)
- Initial implementation commit `f6272064192201dd95da6945ce10c4003d9418fc` and former-member history fix `9cc487538624d3609b8c603cf205b8afde354230` were superseded by the database-owned duplicate guard.
- Draft v3 PR: `#89` — `feature/v3-encouragements` into `feature/v3-study-core`
- Separate production-v2 safety PR: `#88` — stale-device progress conflict protection into `main`; draft, unmerged

## Current authoritative inventory

- Regression-tested: 65 (including #64 Journey Groups)
- Verified: 1 (#65 Encouragements)
- Implemented: 0
- Not started: 34
- Strict implemented-or-better parity: 66/100
- Official regression stability: 65/100
- Deferred by user priority: #15 Japanese furigana and Kids #38–40

## #65 completed implementation

- preset-only, group-wide send/receive using the five retained encouragement kinds;
- `src/app/encouragements.js` is the sole feature owner;
- `src/core/api.js` is the sole browser Supabase boundary;
- `bq-journey-group` verifies active group/membership and derives the authenticated sender;
- a database `BEFORE INSERT` trigger is the sole UTC-bucket owner for every future insert; an additive partial unique index rejects direct, legacy and concurrent identical same-day sends without rewriting/deleting retained v2 rows;
- dedicated route, responsive UI, Journey Groups entry point, contract, architecture validator, edge regression and 390px browser regression;
- historical encouragements remain readable after a sender leaves; current active membership is enforced at send time instead of being misapplied to retained history;
- free-text chat, DMs, notifications, presence, completion sharing, assignments, rankings, XP, moderation and private study data remain excluded.

## Executed evidence

- All v3 JavaScript syntax checks: pass.
- `scripts/validate-v3-inventory.mjs`: pass.
- Complete accumulated architecture validator set: 20/20 pass.
- Complete accumulated edge regression set: 41/41 pass.
- Complete accumulated browser/mobile regression set: pass in functional run `34337262620` against asserted code candidate `b2fb1013822891930e017c8da0ea38e3e5c68b9e`.
- Isolated functional trigger commit: `aa765edbfd11112c5d6db710fe4e0e83faba03d3`; verification branch reset to the exact clean candidate after success.
- `git diff --check`: pass.
- Production Supabase, Cloudflare, v2 and `main`: untouched by #65.
- Read-only production Supabase inspection confirmed the retained encouragement table, RLS policies, grants and indexes. The #65 column, trigger, unique index and Edge Function change are not deployed, as expected.

## Open gate and exact next sequence

1. Commit the #65 promotion bookkeeping and publish it to `feature/v3-encouragements`.
2. Run an independent exact-SHA bookkeeping workflow against that candidate.
3. Freeze `release/v3.39-encouragements` only after that exact candidate passes.
4. Only after v3.39 freezes, begin #67 Community Bridge on a new isolated branch.

Future deployment order is migration first, then the updated `bq-journey-group` function, then the v3 client. Do not deploy any of them during the rebuild verification stage.

Local Chromium is absent. An official Playwright Chromium download was attempted three times and timed out. The cloud browser also blocks loopback access to the local test server. Do not claim the browser regression executed locally.

## Non-negotiable continuation rules

- Rebuild-and-verify; no patch accumulation.
- One owner/source of truth per responsibility.
- Run the complete accumulated regression suite after every milestone.
- Normal Actions stays `workflow_dispatch`-only; temporary push triggers belong only on isolated one-shot verification branches and never become release candidates.
- Never modify production v2, `main`, production Cloudflare or production Supabase during the rebuild without explicit approval.
- Never start the next feature before the current functional and bookkeeping/release gates close.
