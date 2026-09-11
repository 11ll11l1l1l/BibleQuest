# BibleQuest v3 continuation handoff

Updated: 2026-09-12 JST after congregation Calendar owner edit/delete promotion.

## Read first

1. `DEVELOPMENT_PRIORITY_V3.md`
2. `RECONCILIATION_V3.md`
3. `DEVELOPMENT_STATUS_V3.md`
4. `VISUAL_PHASE_B_V3.md` for visual/artwork work
5. relevant feature contract inside the selected feature
6. `docs/V3_ICON_ASSET_MAP.md` only as a semantic guide; verify binaries before wiring
7. `CONTINUE_PROMPT_V3.md` for reusable continuation

Repository evidence and the latest explicit user instruction override stale prose.

## Current product state

- repository: `11ll11l1l1l/BibleQuest`
- current `main` / exact-green product: `7d28d7ced00450f6c1abd93cb31ea78d51c5c876`
- current frozen release ref: `release/v3-calendar-owner-edit-delete-20260912`
- current accumulated regression run: `34623059639` — **success**
- current product PR: #102 — merged by fast-forwarding `main` to the exact tested synthetic merge candidate
- parent exact-green product: `046e2a85cafe10d722d03d467d3733eddfeb6e65`
- parent frozen ref: `release/v3-phase-b-more-icons-20260912`
- parent accumulated run: `34618963635` — **success**
- prior Ministry Hub Calendar checkpoint: `350cb1e583b207e10ba8dc50c3bb683dc50f9494`
- previous rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

The accumulated PR job explicitly fetched and checked out `7d28d7c...` (`refs/pull/102/merge`), then passed the complete suite. The frozen release ref was created at that exact candidate before `main` was fast-forwarded to the same SHA. No additional unverified product merge SHA was created.

## Deployment evidence

Do not transfer the parent deployment evidence to `7d28d7c...`.

The latest recorded Cloudflare Pages provider checks are for parent exact-green product `046e2a85...`, where both configured projects (`mybiblequest` and `biblequest` / `biblequest-7th`) reported success. The last independent two-host byte-for-byte/browser production verifier remains run `34612873935` for an earlier cumulative release.

For current exact product `7d28d7c...`, GitHub product regression is green, but deployment-provider and independent live-host evidence remain separate until explicitly verified.

## Newly completed work

### Congregation Calendar owner edit/delete

- creator `user_id` is preserved as normalized `ownerId`;
- creator-only Edit/Delete controls appear only on the stored congregation event, never synthetic recurrence occurrences;
- non-owner shared events remain read-only, including for another congregation leader;
- service `updateCongregationEvent` / `removeCongregationEvent` fail closed for non-owners before network mutation;
- API `updateCongregation` / `removeCongregation` filter by event `id` + creator `user_id` + `congregation_id`;
- existing own-row RLS remains the database authorization layer; no migration was added;
- update/delete mutate the original row, so the creation notification trigger does not fire again;
- successful mutation reloads shared Calendar state from the server-authoritative source;
- personal Calendar, Assignments, Congregation Membership, Notification Center and routing ownership were preserved;
- Calendar contract and architecture validator now permanently record this boundary.

Run `34623059639` passed the complete accumulated architecture, edge/security/static and browser/mobile suite on exact candidate `7d28d7c...`. The 390 px Calendar browser acceptance covered creator edit/delete, non-owner read-only behavior, recurrence refresh, personal-row isolation, touch target and overflow checks.

### Retained prior checkpoints

- Ministry Hub Calendar surface: exact-green `350cb1e...`, run `34616603649` success.
- Visual Phase B More semantic icons: exact-green `046e2a85...`, run `34618963635` success.

Do not repeat these milestones.

## Supabase production state

Project: `zkfmgezvzugchcwppreq`.

Existing release migrations remain **APPLIED + LIVE VERIFIED** and were untouched by PR #102:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Do not reapply them. The owner edit/delete milestone required no migration and made no direct production database change.

## Immediate next development route

Start product work from exact-green `7d28d7c...` even if a later docs-only bookkeeping commit becomes repository HEAD.

1. refresh `main`, active branches/actions and current investigator evidence before coding;
2. first reproduce and priority-classify any newly reported functionality/correctness issue; do not invent a blocker;
3. do not rebuild congregation Calendar owner edit/delete, Ministry Hub Calendar, or More semantic icons;
4. fixed-weekly congregation recurrence is complete; custom non-weekly recurrence remains explicitly deferred unless new evidence/user direction makes it release-required;
5. absent a reproduced P0/P1 functionality gap, continue Visual Phase B on the next materially minimal/placeholder/generic/emoji-like surface;
6. verify any proposed artwork binary exists or deliberately generate/import a real replacement; never wire nonexistent `assets/icons/v3/` paths;
7. preserve existing route, feature/state, persistence, API/Supabase, gameplay/scoring and accessibility ownership unless a separately selected milestone explicitly changes it;
8. add focused permanent regression coverage for the selected surface;
9. require the complete accumulated exact-candidate regression before promotion;
10. freeze the exact tested candidate before advancing `main` and keep deployment/live verification as separate evidence.

## Release-process notes

- PR #97 added the PR-triggered accumulated regression gate.
- PR #98 restored the validator-owned development-status ledger headings; run `34616114505` fully passed.
- PR #99 attempted a `push` trigger but the permanent workflow contract correctly rejected it; it was closed without merge.
- PR #102 completed Calendar creator edit/delete. Run `34623059639` checked out exact synthetic merge candidate `7d28d7c...` and passed; frozen ref `release/v3-calendar-owner-edit-delete-20260912` was created and `main` fast-forwarded to the same SHA.
- During PR #102 development, a full-file API write briefly removed one unrelated closing brace. Diff inspection caught it before gating; corrective commit `daf77b48876b0aaf3c1073a024fb510edc948c39` changed only that character. Final PR net API diff contains only the intended Calendar owner mutations.
- Accepted exact-SHA pattern remains: PR synthetic merge candidate → full green accumulated run → freeze exact candidate ref → fast-forward `main` to that exact green commit when ancestry permits.

## Visual/artwork instruction

Visual Phase B remains active. Use `VISUAL_PHASE_B_V3.md`. For selected artwork changes: **generate/import → choose → optimize → implement → test**. Do not stop for routine image approval. A generated asset that is not committed and wired into the real product does not count.

## Reporting

Report separately:

- current `main` / exact-green product SHA;
- frozen release/reference SHA;
- active development or docs branch/HEAD;
- work actually completed;
- exact tests/workflows executed;
- Cloudflare deployment-check state vs independent live verification;
- Supabase migration state;
- current credible P0/P1 blockers;
- next dependency-safe milestone;
- whether production/Supabase were changed.

## Non-negotiable rules

Rebuild-and-verify; one owner per responsibility; `src/core/api.js` remains the browser backend owner unless intentionally redesigned; never transfer PASS; never claim unexecuted tests; docs-only commits are not product candidates; do not weaken validators; preserve rollback; production deployment and independent live proof remain separate; do not call the app bug-free.