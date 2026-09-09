# BibleQuest v3 continuation handoff

Updated: 2026-09-09 UTC

This file is the durable restart point if a chat or usage window ends. GitHub is authoritative; do not reconstruct work from conversation memory alone.

## Repository and immutable checkpoints

- Repository: `11ll11l1l1l/BibleQuest`
- Frozen base remains `release/v3.40-community-bridge` until the final #68 documentation-only bookkeeping SHA passes the complete release gate.
- Frozen base SHA: `fca8edd2e18015b246aced2dff6590308ff6bde2`
- v3.40 bookkeeping run: `34340610144` (complete accumulated suite green)
- Active remote branch: `feature/v3-presence`
- Canonical #68 verified SHA before final bookkeeping corrections: `7e5c6fb8938ef8ef95fbdc7275bb00060ca76334`
- Exact #68 complete-suite run: `34354132909` (architecture, edge, browser/mobile all green against that exact SHA)
- Canonical remote #67 code commit: `4612f0501e5cd37e82c3d259094a0d91cf804e2d`
- Canonical remote #65 code commit: `b2fb1013822891930e017c8da0ea38e3e5c68b9e`
- Draft v3 PR: `#89` — `feature/v3-encouragements` into `feature/v3-study-core`
- Separate production-v2 safety PR: `#88` — stale-device progress conflict protection into `main`; draft, unmerged

## Current authoritative inventory

- Regression-tested: 67, including #67 Community Bridge after surviving the complete #68 suite.
- Verified: 1 (#68 Presence).
- Implemented: 0.
- Not started: 32.
- Strict implemented-or-better parity: 68/100.
- Official regression stability: 67/100.
- Deferred by user priority: #15 Japanese furigana and Kids #38–40.

## #67 Community Bridge

- `src/app/community-bridge.js` remains the sole read-only projection owner over Session, Congregation Membership, Journey Groups, and Encouragements.
- It exposes only privacy-minimized congregation/group/encouragement projection data and rejects foreign-scope or stale signed-out/local-preview cloud data.
- #67 is now Regression-tested because the complete #68 Presence suite passed without regressing it.

## #68 Presence implementation

- `src/app/presence.js` is the sole online/offline lifecycle, heartbeat, stale-state interpretation, session transition, and cleanup owner.
- `src/core/api.js` remains the sole browser Supabase boundary and uses retained `public.bible_presence` authorization rather than adding a competing remote owner.
- A real authenticated account writes online state; guest/local-preview/signed-out states perform no cloud writes.
- Heartbeat interval is 60 seconds; rows older than 120 seconds are interpreted as stale/offline.
- Cleanup clears timers/listeners and performs bounded best-effort offline/delete behavior even when the final remote operation fails.
- Same-identity session refresh reuses the active lifecycle; identity changes restart it.
- Presence does not own Team Center, assignments, rankings, recognition, notifications, chat, XP, private study state, or other community workflows.
- Permanent protection: `PRESENCE_V3.md`, `scripts/validate-v3-presence.mjs`, `tests/v3-presence-edge.mjs`, and `tests/v3-presence-smoke.mjs`.

## Executed evidence

- Presence code/test candidate parent `97650ff993a7ac5e556ec1b330c1011a72475931` includes the same-identity session-refresh regression protection.
- Bookkeeping/verification SHA `7e5c6fb8938ef8ef95fbdc7275bb00060ca76334` was explicitly checked out by isolated verification run `34354132909`.
- Run `34354132909` completed successfully: accumulated architecture validators green, accumulated edge regressions green, and accumulated Playwright browser/mobile regressions green.
- Production Supabase, Cloudflare, v2 and `main` were not modified by #68.
- The documentation corrections that advance #67 to Regression-tested and totals to 68/100 create a new bookkeeping SHA. That exact final SHA must pass the same complete suite before release freeze; do not infer its result from run `34354132909`.

## Exact next sequence

1. Finish the documentation-only #68 bookkeeping candidate on `feature/v3-presence`.
2. Create/reset an isolated `verify/v3.41-presence-bookkeeping` branch from that exact clean candidate.
3. Add only the temporary one-shot trigger needed to execute the full regression workflow, with checkout/assertion pinned to the clean candidate SHA.
4. Require the complete architecture, edge, and browser/mobile suite to pass against that exact SHA.
5. Reset the verification branch to the exact clean candidate and freeze `release/v3.41-presence` at that SHA.
6. Only after the freeze, create `feature/v3-team-center` from `release/v3.41-presence` and begin #69 Team Center contract recovery.

## #69 Team Center reconnaissance already recovered

- Inventory contract: team list plus member/role workflows.
- Retained RLS permits congregation members to read teams/team memberships and permits appropriate ministry roles to create teams.
- Browser RLS does not authorize arbitrary member add/remove or role mutation.
- Therefore do not implement Team Center membership/role mutation as direct browser table writes. Recover and reuse an existing trusted server function if one exists; otherwise keep mutation paths fail-closed/read-only until an authoritative trusted contract is established.

Production deployment remains out of scope during rebuild verification. Do not deploy pending migrations/functions merely to satisfy parity testing.

Local Chromium is not authoritative for this milestone; browser evidence is from the GitHub Actions Playwright run above. Do not claim unexecuted local browser results.

## Non-negotiable continuation rules

- Rebuild-and-verify; no patch accumulation.
- One owner/source of truth per responsibility.
- Run the complete accumulated regression suite after every milestone.
- Normal Actions stays `workflow_dispatch`-only; temporary push triggers belong only on isolated one-shot verification branches and never become release candidates.
- Never modify production v2, `main`, production Cloudflare or production Supabase during the rebuild without explicit approval.
- Never start implementation of the next feature before the current functional and bookkeeping/release gates close.
