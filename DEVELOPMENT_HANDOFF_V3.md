# BibleQuest v3 continuation handoff

Updated: 2026-09-12 JST after exact-green Visual Phase B Account promotion.

## Read first

1. `DEVELOPMENT_PRIORITY_V3.md`
2. `RECONCILIATION_V3.md`
3. `DEVELOPMENT_STATUS_V3.md`
4. `VISUAL_PHASE_B_V3.md` for visual/artwork work
5. the selected feature contract
6. `docs/V3_ICON_ASSET_MAP.md` only as a semantic guide; verify binaries before wiring
7. `CONTINUE_PROMPT_V3.md` for reusable continuation

Repository evidence and the latest explicit user instruction override stale prose.

## Current product state

- repository: `11ll11l1l1l/BibleQuest`
- current exact-green product: `2f04b7150b36d4a14dac953fd08ae2c5a307d0d9`
- current frozen release ref: `release/v3-phase-b-account-artwork-20260912`
- current accumulated regression run: `34632158164` — **success**
- current product PR: #109 — merged after the exact synthetic merge candidate passed
- feature head: `5becefc41150f5578f88c9f6ac107fe5d2a7ecf2`
- verified base/docs HEAD at candidate creation: `bd7f3e1a4a15d725ec647ed1899acad49e8f18ae`
- parent exact-green product: `df2a7051e305474a5ea24912c3f5341f33bc61b8`
- parent frozen ref: `release/v3-phase-b-avatar-vault-artwork-20260912`
- parent run: `34630985269` — **success**
- previous rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

Run `34632158164` fetched and checked out `2f04b7150b36d4a14dac953fd08ae2c5a307d0d9` as `refs/pull/109/merge`. It passed the complete accumulated architecture, edge/security/static and browser/mobile suite. The new Account Phase B static contract and 390 px mobile acceptance both passed. The exact candidate was frozen before `main` was advanced to the same SHA. A later docs-only HEAD is bookkeeping only and does not replace this exact-green product.

## Newly completed work

### Visual Phase B — Account artwork

- PR #109 adds committed same-origin passive SVG artwork in `assets/account-feature-icons.svg` for `profile`, `sign-in`, `create-account`, `recovery`, `device` and `security`;
- `src/app/account.js`, `src/app/session.js` and `src/core/api.js` remain the behavior/session/backend owners and were not changed;
- `src/features/account/index.js` changes presentation markup only and preserves all existing Account actions/callbacks;
- `src/ui/account-phase-b.css` loads after the earlier Account visual-polish layer and is presentation-only;
- security/recovery/device meaning remains visible in text; artwork is decorative and `aria-hidden`;
- sign-in, signup, recovery, guest continuation, recovery-code save/copy gate, remembered-device removal, recovery-code regeneration, password change, Return home, sign-out and tutorial handoff are preserved;
- permanent static coverage plus 390 px mobile acceptance is retained in the accumulated workflow;
- no auth, persistence, API, Supabase, schema, RLS, Edge Function or cloud-progress behavior changed.

### Retained prior exact-green checkpoints

- Avatar Vault Phase B: `df2a7051e305474a5ea24912c3f5341f33bc61b8`, run `34630985269` success.
- Personal Mission Phase B: `df1bbd18782bee6430546ee7b444ad4bc48f5116`, run `34629528297` success.
- Calendar Phase B: `c15d1fceddce537fa8a31a6b2b5c909d197b1b3e`, run `34627049878` success.
- Calendar creator edit/delete: `7d28d7ced00450f6c1abd93cb31ea78d51c5c876`, run `34623059639` success.
- More Phase B: `046e2a85cafe10d722d03d467d3733eddfeb6e65`, run `34618963635` success.
- Ministry Hub Calendar: `350cb1e583b207e10ba8dc50c3bb683dc50f9494`, run `34616603649` success.

Do not repeat these milestones.

## Priority-firewall note

Old PR #88 references stale-device cloud-progress overwrites in legacy root `account.js`. That root runtime is not loaded by current v3: `index.html` boots `src/app/bootstrap.js`, current account behavior lives in `src/app/account.js`, and progress ownership lives under `src/core/progress.js`. Do not treat PR #88 as a current v3 P0 unless a defect is reproduced through the current v3 runtime.

## Deployment evidence

Do not transfer older Cloudflare/provider or independent production PASS evidence to exact product `2f04b715...`.

GitHub exact-candidate regression and frozen-ref evidence are complete. Provider deployment identity for `2f04b715...` and fresh independent two-host live byte/browser verification remain separate evidence gaps until explicitly recorded.

## Supabase production state

Project: `zkfmgezvzugchcwppreq`.

These release migrations remain **APPLIED + LIVE VERIFIED** and were untouched by PR #109:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Do not reapply them. Account Phase B required no migration and made no production database mutation.

## Immediate next development route

Start new product selection from exact-green `2f04b715...`, while using current `main` to read later docs-only bookkeeping if present.

1. refresh `main`, active branches/actions, open issues and current investigator/production evidence before coding;
2. first reproduce and priority-classify any newly reported functionality/correctness/security/privacy/data-loss issue; do not promote stale labels into blockers;
3. do not rebuild Account, Avatar Vault, Personal Mission, Calendar, More or other completed checkpoints;
4. fixed-weekly congregation recurrence is complete; custom non-weekly recurrence remains deferred unless current evidence/user direction makes it release-required;
5. absent a reproduced P0/P1 gap, continue the mandatory pre-release Visual Phase B program on the next materially under-designed, placeholder, generic or emoji-like user-facing surface;
6. verify a real asset exists or deliberately generate/import a replacement; never wire nonexistent `assets/icons/v3/` paths;
7. preserve route, state, persistence, API/Supabase, gameplay/scoring, accessibility and PWA ownership unless a separately selected milestone explicitly changes it;
8. add focused permanent regression coverage for the selected surface;
9. require the complete accumulated exact-candidate regression before promotion;
10. freeze the exact tested candidate before advancing `main`;
11. before final release approval, separately complete provider deployment identity, explicit 320/360/390/412/430 + installed-PWA acceptance as still required, multi-account linked-activity field validation, and independent two-host production proof on the exact final candidate.

## Visual/artwork instruction

Visual Phase B remains active under Issue #94. For selected artwork changes: **generate/import → choose → optimize → implement → test**. Do not stop for routine image approval. A generated asset that is not committed and wired into the real product does not count.

## Reporting

Report separately:

- current exact-green product SHA;
- frozen release/reference SHA;
- repository/docs HEAD if different;
- active development/docs branch and HEAD;
- work actually completed;
- exact tests/workflows executed;
- provider deployment-check state vs independent live verification;
- Supabase migration state;
- current credible P0/P1 blockers;
- next dependency-safe milestone;
- whether production/Supabase were changed.

## Non-negotiable rules

Rebuild-and-verify; one owner per responsibility; `src/core/api.js` remains the browser backend owner unless intentionally redesigned; never transfer PASS; never claim unexecuted tests; docs-only commits are not product candidates; do not weaken validators; preserve rollback; product regression remains `workflow_dispatch` + `pull_request` with no forbidden `push` trigger; GitHub promotion, provider deployment and independent live proof remain separate; do not call the app bug-free.
