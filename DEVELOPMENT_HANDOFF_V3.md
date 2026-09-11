# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after cumulative production release and live verification.

## Read first

1. `DEVELOPMENT_PRIORITY_V3.md`
2. `RECONCILIATION_V3.md`
3. `DEVELOPMENT_STATUS_V3.md`
4. relevant feature contracts only for their owned feature
5. `docs/V3_ICON_ASSET_MAP.md` before PNG/icon visual wiring
6. `CONTINUE_PROMPT_V3.md` for a reusable new-chat continuation prompt

Repository evidence and the latest explicit user instruction override stale prose.

## Current production state

- repository: `11ll11l1l1l/BibleQuest`
- live `main` / deployed release commit: `04bd51bfc4ff16a3b42d13e47e95e637999b4880`
- release branch: `release/v3-cumulative-20260911-r1`
- cumulative exact-green product SHA: `cf17f36f9f041aee4715271eaebbe8581fc2c067`
- cumulative verifier run: `34610903807` — success
- docs checkpoint: `675c6181ecc4dc36a47ba410feab142605eba913`; docs contract `34612119469` — success
- production/Cloudflare verifier run: `34612873935` — success
- previous rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

`cf17f36...` merged verified Line A `61ee54fac7d352312cef7ffd8010997fa8bc9e51` with full verified Line B `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`. The former divergence is resolved and released.

## Production verification evidence

Run `34612873935` proved both Cloudflare hosts match the promoted release files byte-for-byte and passed production browser/mobile smoke for shell, Assignments, Workspace, Avatar Vault, Calendar, accessibility and offline behavior.

Do not infer future propagation from GitHub; repeat live verification after any later production product change.

## Supabase production state

Project: `zkfmgezvzugchcwppreq`.

Release migrations are **APPLIED + LIVE VERIFIED**:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Assignment presence live verification covered safe projection shape, RLS/grants, non-callable private trigger, backfill parity, member/all/team/group audience behavior, ministry visibility, and reopen/recomplete/delete synchronization. Synthetic authorization rows were used only inside rollback transactions.

Calendar live verification covered ministry creation, ordinary-member congregation visibility, private-event isolation, trigger privilege boundaries, and zero persisted smoke rows/notifications after rollback.

Do not reapply these migrations.

## Included verified product work

- Assignment Private Responses;
- Workspace/Cloud Notes schema compatibility;
- Visual tranche 18;
- Avatar Vault v2;
- Calendar v1.5.

## Immediate next development route

The release gate is closed. Start the next dependency-safe Priority 1 milestone from current `main`/cumulative production state, not from an older postrelease line.

Before writing:

1. refresh `main`, active branches/actions and investigator findings;
2. confirm the selected work is actually unfinished;
3. inspect the owning feature/architecture contract;
4. preserve current rollback/release refs;
5. implement the smallest meaningful milestone;
6. run focused tests, then the required accumulated exact-SHA suite;
7. freeze evidence before any later production promotion.

Priority 1 remains functionality/correctness plus approved visual/art quality. Calendar v1/v1.5 must not be rebuilt. Its remaining follow-ups are considered only when selected by priority/dependency evidence.

## Visual/icon instruction

Inspect `VISUAL_PHASE_B_V3.md` and verify the real current asset tree. `docs/V3_ICON_ASSET_MAP.md` is a semantic map, not proof that all binaries exist. Do not invent features to use artwork. For selected visual changes: **generate → choose → optimize → implement → test**, without routine image-approval stops.

## Reporting

Report separately:

- live `main` / release commit;
- exact-green product SHA;
- active development branch/HEAD;
- work actually completed;
- exact tests/workflows executed;
- migration state;
- current credible P0/P1 blockers;
- next dependency-safe milestone;
- whether production/Supabase were touched.

## Non-negotiable rules

Rebuild-and-verify; one owner per responsibility; `src/core/api.js` remains the browser backend owner unless intentionally redesigned; never transfer PASS; never claim unexecuted tests; docs-only commits are not product candidates; do not weaken validators; preserve rollback; production deployment and Cloudflare proof remain separate; do not call the app bug-free.
