# BibleQuest v3 continuation handoff

Updated: 2026-09-12 JST after Ministry Hub Calendar and Visual Phase B More-hub promotion.

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
- current `main` / exact-green product: `046e2a85cafe10d722d03d467d3733eddfeb6e65`
- current frozen release ref: `release/v3-phase-b-more-icons-20260912`
- current accumulated regression run: `34618963635` — **success**
- parent exact-green product: `350cb1e583b207e10ba8dc50c3bb683dc50f9494`
- parent frozen ref: `release/v3-ministry-calendar-surface-20260912`
- parent accumulated run: `34616603649` — **success**
- previous cumulative exact-green product: `cf17f36f9f041aee4715271eaebbe8581fc2c067`
- previous rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

Both recent promotions fast-forwarded `main` directly to the exact merge candidate exercised by the accumulated PR regression. No additional unverified merge SHA was created.

## Deployment evidence

Cloudflare Pages provider checks succeeded for exact current product `046e2a85...` on both configured projects (`mybiblequest` and `biblequest`/`biblequest-7th`). Treat this as deployment-provider evidence only. The last independent two-host byte-for-byte/browser production verifier remains run `34612873935` for the prior cumulative release; do not silently transfer it to `046e2a85...`.

## Newly completed work

### Ministry Hub Calendar surface

- valid congregation members now receive the verified Calendar destination from Ministry Hub;
- Ministry Hub only delegates to route `calendar`;
- `src/app/calendar.js` remains the Calendar lifecycle/persistence/shared-event owner;
- unsupported congregation roles still fail closed;
- no Calendar schema/API/RLS/storage/recurrence/authorization behavior changed;
- exact candidate `350cb1e...` passed full accumulated run `34616603649`.

### Visual Phase B — More hub feature icons

- real asset: `assets/more-feature-icons.svg` with 15 semantic symbols;
- presentation layer: `src/ui/more-phase-b.css`, loaded after historical `more-visual-polish.css`;
- existing More controls/routes/callbacks are unchanged;
- icons remain decorative (`aria-hidden`) while text labels remain authoritative;
- `tests/v3-more-phase-b-static.mjs` and `tests/v3-more-phase-b-smoke.mjs` are permanently invoked by the accumulated regression;
- exact candidate `046e2a85...` passed full run `34618963635`, including 390 px sprite loading, unique semantic refs, >=44 px targets and no horizontal overflow.

The historical `assets/icons/v3/` mapped binary family still does not exist. Do not wire those paths. Generate/import deliberate real assets only inside a selected Phase B milestone.

## Supabase production state

Project: `zkfmgezvzugchcwppreq`.

Existing release migrations remain **APPLIED + LIVE VERIFIED** and were untouched by these milestones:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Do not reapply them.

## Immediate next development route

Start from exact-green `046e2a85...`.

1. refresh `main`, active branches/actions and current evidence;
2. investigate the next candidate before coding;
3. leading functionality candidate: congregation-shared Calendar event edit/delete UI/owner flow;
4. if that is already complete, do not rebuild it — select the next verified gap or another materially under-designed Phase B surface;
5. preserve one owner/source of truth and current rollback/release refs;
6. implement the smallest meaningful milestone;
7. add focused permanent regression coverage;
8. require complete accumulated exact-candidate verification before promotion;
9. keep deployment and independent live-host verification as separate evidence.

## Release-process notes

- PR #97 added the PR-triggered accumulated regression gate.
- PR #98 restored the validator-owned development-status ledger headings; run `34616114505` fully passed.
- PR #99 attempted a `push` trigger but the permanent workflow contract correctly rejected it in run `34617187008`; it was closed without merge. Do not reintroduce that trigger merely to obtain evidence.
- The accepted exact-SHA pattern is: PR synthetic merge candidate → full green accumulated run → freeze exact candidate ref → fast-forward `main` to that exact green commit when ancestry permits.

## Visual/artwork instruction

Visual Phase B remains active. Use `VISUAL_PHASE_B_V3.md`. For selected artwork changes: **generate/import → choose → optimize → implement → test**. Do not stop for routine image approval. A generated asset that is not committed and wired into the real product does not count.

## Reporting

Report separately:

- current `main` / exact-green product SHA;
- frozen release/reference SHA;
- active development branch/HEAD;
- work actually completed;
- exact tests/workflows executed;
- Cloudflare deployment-check state vs independent live verification;
- Supabase migration state;
- current credible P0/P1 blockers;
- next dependency-safe milestone;
- whether production/Supabase were changed.

## Non-negotiable rules

Rebuild-and-verify; one owner per responsibility; `src/core/api.js` remains the browser backend owner unless intentionally redesigned; never transfer PASS; never claim unexecuted tests; docs-only commits are not product candidates; do not weaken validators; preserve rollback; production deployment and independent live proof remain separate; do not call the app bug-free.
