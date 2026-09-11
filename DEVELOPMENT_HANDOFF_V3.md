# BibleQuest v3 continuation handoff

Updated: 2026-09-12 JST after Visual Phase B Calendar artwork promotion.

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
- current exact-green product: `c15d1fceddce537fa8a31a6b2b5c909d197b1b3e`
- current frozen release ref: `release/v3-phase-b-calendar-artwork-20260912`
- current accumulated regression run: `34627049878` — **success**
- current product PR: #104 — merged by fast-forwarding `main` to the exact tested synthetic merge candidate
- parent exact-green product: `7d28d7ced00450f6c1abd93cb31ea78d51c5c876`
- parent frozen ref: `release/v3-calendar-owner-edit-delete-20260912`
- parent accumulated run: `34623059639` — **success**
- prior Visual Phase B More checkpoint: `046e2a85cafe10d722d03d467d3733eddfeb6e65`, run `34618963635` success
- prior Ministry Hub Calendar checkpoint: `350cb1e583b207e10ba8dc50c3bb683dc50f9494`, run `34616603649` success
- previous rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

Run `34627049878` explicitly fetched and checked out `c15d1f...` as `refs/pull/104/merge`. It passed the complete accumulated suite. The exact candidate was frozen before `main` was fast-forwarded to the same SHA. No additional unverified product merge SHA was created.

If this handoff is later updated by a docs-only merge, start new product work from exact-green `c15d1f...`, not from an assumed docs HEAD product identity.

## Deployment evidence

Do not transfer older Cloudflare or independent production PASS evidence to `c15d1f...`.

The latest previously recorded Cloudflare Pages provider checks were for older exact-green product `046e2a85...`. The last independent two-host byte/browser verifier remains run `34612873935` for an earlier cumulative release.

For current exact product `c15d1f...`, GitHub product regression is green. Provider deployment identity and independent live-host verification remain separate evidence until explicitly recorded for this exact product.

## Newly completed work

### Visual Phase B — Calendar artwork

- literal Calendar event emoji were removed from the Calendar renderer;
- real passive SVG artwork is committed in `assets/calendar-feature-icons.svg` for planner, personal, assignment, congregation and empty states;
- `src/ui/calendar-phase-b.css` is loaded after `src/ui/calendar.css` and is presentation-only;
- agenda event source styling and mobile form containment were improved without changing Calendar behavior;
- decorative SVGs remain `aria-hidden`; existing labels/buttons remain authoritative;
- Calendar routes, service methods, personal/shared events, creator-only edit/delete, assignments, fixed-weekly recurrence, storage, API/Supabase, scoring and navigation ownership are unchanged;
- `tests/v3-calendar-phase-b-static.mjs` and `tests/v3-calendar-phase-b-smoke.mjs` are permanent accumulated checks;
- existing `tests/v3-calendar-smoke.mjs` remains the functional browser regression.

Run `34627049878` passed all architecture, edge/security/static and browser/mobile gates on exact candidate `c15d1f...`, including both existing Calendar functional acceptance and the new 390 px Calendar artwork acceptance.

### Retained prior checkpoints

- Calendar creator edit/delete: exact-green `7d28d7c...`, run `34623059639` success.
- Visual Phase B More semantic icons: exact-green `046e2a85...`, run `34618963635` success.
- Ministry Hub Calendar surface: exact-green `350cb1e...`, run `34616603649` success.

Do not repeat these milestones.

## Supabase production state

Project: `zkfmgezvzugchcwppreq`.

Existing release migrations remain **APPLIED + LIVE VERIFIED** and were untouched by PR #104:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Do not reapply them. The Calendar artwork milestone required no migration and made no production database mutation.

## Immediate next development route

Start product work from exact-green `c15d1f...` even if a later docs-only bookkeeping commit becomes repository HEAD.

1. refresh `main`, active branches/actions and current investigator/production evidence before coding;
2. first reproduce and priority-classify any newly reported functionality/correctness issue; do not invent a blocker;
3. do not rebuild Calendar artwork, Calendar creator edit/delete, Ministry Hub Calendar, or More semantic icons;
4. fixed-weekly congregation recurrence is complete; custom non-weekly recurrence remains deferred unless current evidence/user direction makes it release-required;
5. absent a reproduced P0/P1 functionality gap, continue Visual Phase B on the next materially minimal/placeholder/generic/emoji-like surface;
6. verify any proposed artwork binary exists or deliberately generate/import a real replacement; never wire nonexistent `assets/icons/v3/` paths;
7. preserve route, feature/state, persistence, API/Supabase, gameplay/scoring, accessibility and PWA ownership unless a separately selected milestone explicitly changes it;
8. add focused permanent regression coverage for the selected surface;
9. require the complete accumulated exact-candidate regression before promotion;
10. freeze the exact tested candidate before advancing `main` and keep deployment/live verification as separate evidence.

## Release-process notes

- PR #97 added the PR-triggered accumulated regression gate.
- PR #98 restored the validator-owned development-status ledger headings; run `34616114505` fully passed.
- PR #99 attempted a `push` trigger but the permanent workflow contract correctly rejected it; it was closed without merge.
- PR #102 completed Calendar creator edit/delete at exact-green `7d28d7c...`; run `34623059639` passed.
- PR #104 completed Calendar Visual Phase B artwork. Run `34627049878` checked out exact synthetic merge candidate `c15d1f...` and passed; frozen ref `release/v3-phase-b-calendar-artwork-20260912` was created and `main` fast-forwarded to the same SHA.
- Accepted exact-SHA pattern remains: PR synthetic merge candidate → full green accumulated run → freeze exact candidate ref → fast-forward `main` to that exact green commit when ancestry permits.

## Visual/artwork instruction

Visual Phase B remains active. Use `VISUAL_PHASE_B_V3.md`. For selected artwork changes: **generate/import → choose → optimize → implement → test**. Do not stop for routine image approval. A generated asset that is not committed and wired into the real product does not count.

## Reporting

Report separately:

- current exact-green product SHA;
- frozen release/reference SHA;
- repository/docs HEAD if different;
- active development or docs branch/HEAD;
- work actually completed;
- exact tests/workflows executed;
- Cloudflare deployment-check state vs independent live verification;
- Supabase migration state;
- current credible P0/P1 blockers;
- next dependency-safe milestone;
- whether production/Supabase were changed.

## Non-negotiable rules

Rebuild-and-verify; one owner per responsibility; `src/core/api.js` remains the browser backend owner unless intentionally redesigned; never transfer PASS; never claim unexecuted tests; docs-only commits are not product candidates; do not weaken validators; preserve rollback; GitHub promotion, provider deployment and independent live proof remain separate; do not call the app bug-free.
