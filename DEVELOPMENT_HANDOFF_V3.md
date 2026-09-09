# BibleQuest v3 continuation handoff

Updated: 2026-09-09 UTC

This file is the durable restart point if a chat or usage window ends. GitHub is authoritative; do not reconstruct work from conversation memory alone.

## Repository and immutable checkpoints

- Repository: `11ll11l1l1l/BibleQuest`
- Frozen base: `release/v3.40-community-bridge`
- Frozen base SHA: `fca8edd2e18015b246aced2dff6590308ff6bde2`
- v3.40 bookkeeping run: `34340610144` (complete accumulated suite green)
- Active remote branch: `feature/v3-presence`
- Canonical remote #67 code commit: `4612f0501e5cd37e82c3d259094a0d91cf804e2d`
- Canonical #67 code tree: `3e0f0a5ac4ca324cbf188282bc4c13b5d8903e40`
- Local equivalent #67 commit: `4917b0ba7733f719e583974681233d303b0bf99e` (same tree; commit metadata differs)
- Canonical remote #65 code commit: `b2fb1013822891930e017c8da0ea38e3e5c68b9e`
- Canonical code tree: `ec448f88874710b0cb45dc7b127beac44e9e97a1`
- Local equivalent commit: `bb6944e422510f3e35de8052563172317fa450bd` (same tree; commit metadata differs)
- Initial implementation commit `f6272064192201dd95da6945ce10c4003d9418fc` and former-member history fix `9cc487538624d3609b8c603cf205b8afde354230` were superseded by the database-owned duplicate guard.
- Draft v3 PR: `#89` — `feature/v3-encouragements` into `feature/v3-study-core`
- Separate production-v2 safety PR: `#88` — stale-device progress conflict protection into `main`; draft, unmerged

## Current authoritative inventory

- Regression-tested: 66 (including #65 Encouragements)
- Verified: 1 (#67 Community Bridge)
- Implemented: 0
- Not started: 33
- Strict implemented-or-better parity: 67/100
- Official regression stability: 66/100
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

## #67 current implementation

- `src/app/community-bridge.js` is the sole read-only projection owner over verified Session, Congregation Membership, Journey Groups, and Encouragements owners;
- exposes only congregation ID/name/role, group ID/name/role/member counts, and an encouragement total;
- rejects foreign-scope group/encouragement data and never reuses stale data while signed out or in local preview;
- adds one responsive Community route and a More entry point for Membership & role, Journey Groups, and Encouragements;
- deliberately does not copy the legacy `Storage.prototype` interception or local score conversion;
- excludes scores, XP, presence, teams, leaderboards, recognition, assignments, notifications, ministry controls, identities, private study content, and private Couples data.

## Executed evidence

- All v3 JavaScript syntax checks: pass.
- `scripts/validate-v3-inventory.mjs`: pass.
- Complete accumulated architecture validator set: 21/21 pass locally with #67.
- Complete accumulated edge regression set: 42/42 pass locally with #67.
- Complete accumulated browser/mobile regression set: pass in functional run `34337262620` against asserted code candidate `b2fb1013822891930e017c8da0ea38e3e5c68b9e`.
- Isolated functional trigger commit: `aa765edbfd11112c5d6db710fe4e0e83faba03d3`; verification branch reset to the exact clean candidate after success.
- `git diff --check`: pass.
- Production Supabase, Cloudflare, v2 and `main`: untouched by #65.
- Read-only production Supabase inspection confirmed the retained encouragement table, RLS policies, grants and indexes. The #65 column, trigger, unique index and Edge Function change are not deployed, as expected.
- Complete #67 functional run `34340063733` passed against asserted code candidate `4612f0501e5cd37e82c3d259094a0d91cf804e2d`; trigger commit `ef62892ead75098928005fe751582c394d8f832c` was reset from the verification branch after success.

## Closed #67 milestone and exact next sequence

1. Functional run `34340063733` passed exact code candidate `4612f0501e5cd37e82c3d259094a0d91cf804e2d`; #67 is Verified and #65 is Regression-tested.
2. Bookkeeping run `34340610144` passed exact candidate `fca8edd2e18015b246aced2dff6590308ff6bde2`.
3. `release/v3.40-community-bridge` is frozen at that clean candidate; both temporary #67 verification branches were reset.
4. Continue #68 Presence only on `feature/v3-presence`, beginning with retained timeout/cleanup and RLS contract recovery.

Future deployment order is migration first, then the updated `bq-journey-group` function, then the v3 client. Do not deploy any of them during the rebuild verification stage.

Local Chromium is absent. An official Playwright Chromium download was attempted three times and timed out. The cloud browser also blocks loopback access to the local test server. Do not claim the browser regression executed locally.

## Non-negotiable continuation rules

- Rebuild-and-verify; no patch accumulation.
- One owner/source of truth per responsibility.
- Run the complete accumulated regression suite after every milestone.
- Normal Actions stays `workflow_dispatch`-only; temporary push triggers belong only on isolated one-shot verification branches and never become release candidates.
- Never modify production v2, `main`, production Cloudflare or production Supabase during the rebuild without explicit approval.
- Never start the next feature before the current functional and bookkeeping/release gates close.
