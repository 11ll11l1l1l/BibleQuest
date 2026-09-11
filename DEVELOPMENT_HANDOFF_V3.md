# BibleQuest v3 continuation handoff

Updated: 2026-09-12 JST after guarded field-harness preparation, Live Room field-contract reconciliation, and release-control consolidation.

## Read first

1. `DEVELOPMENT_PRIORITY_V3.md`
2. `RECONCILIATION_V3.md`
3. `DEVELOPMENT_STATUS_V3.md`
4. `RELEASE_ACCEPTANCE_MATRIX_V3.md`
5. `RELEASE_FIELD_VALIDATION_V3.md` for the remaining field gates
6. `VISUAL_PHASE_B_V3.md` only if current field/production evidence selects another visual correction
7. the selected feature/release-gate contract
8. `CONTINUE_PROMPT_V3.md`

Repository evidence and the latest explicit user instruction override stale prose.

## Exact product vs validation truth

- repository: `11ll11l1l1l/BibleQuest`
- current repository `main` at this consolidation start: `ad6c6a7e0afaf9dcb38638f7a3a6fd7c047f2b14`
- current exact-green **product**: `2c601b3289dba891f349801219f49804f85f63cc`
- product frozen ref: `release/v3-phase-b-progress-artwork-20260912`
- product accumulated run: `34633247237` — **success**
- product PR: #110
- exact-green final-mobile **validation layer**: `d0eab188479f20273cbd67cb5b796c74868dc5d4`
- validation frozen ref: `release/v3-final-mobile-width-gate-20260912`
- validation run: `34634460077` — **success**
- validation PR: #111
- latest complete **release-control regression head**: `6dcf40096df4cb6785ea1a38753887ba9c71859e`
- latest complete release-control regression run: `34648966867` — **success**
- live verified repository `main` at production-verification time: `452e84cdbe1a63dc86d4079ff3bf0f6a9edc8f8b`
- live production verification branch: `verify/v3-production-current-452e84c-20260912`
- verifier commit: `197056e374f06b59246dcf953405818b89ffde9d`
- production verifier: run `34637203062`, job `103387887268` — **success**
- previous rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

PR #111 and later release-control work changed validation/tests/workflows/documentation, not the exact-green product identity unless repository evidence explicitly says otherwise. Therefore `2c601b3...` remains the exact-green product identity. Do not promote a later docs/workflow `main` SHA into a product SHA.

Run `34634460077` passed the complete accumulated release cycle available in CI for the final-mobile validation layer. Later release-control exact heads also passed the same canonical v3 regression: PR #120 head `ab0b9eba...` in run `34648510971`, and PR #121 head `6dcf400...` in run `34648966867`.

## Guarded field-readiness tooling

Repository-side preparation for Issue #68 now includes three guarded field harnesses:

- `tests/v3-field-validation-harness.mjs` — multi-account relationship/isolation field paths;
- `tests/v3-field-linked-assignment-harness.mjs` — linked/group/team assignment field paths;
- `tests/v3-field-live-room-harness.mjs` — current Live Room host/join/reconnect/end/isolation path.

PR #120 added all three to the canonical regression's `node --check` field-harness gate. Their field mutation paths fail closed unless the documented dedicated test environment explicitly enables them, and field credentials are supplied only through environment variables. Evidence output is designed to omit secrets/private identifiers.

Presence, syntax PASS, or headless execution of a guarded harness is **not** a substitute for real multi-account/physical-device field evidence. Do not close Issue #68 merely because the harnesses exist or CI is green.

PR #121 reconciled the canonical `RELEASE_FIELD_VALIDATION_V3.md` Live Room acceptance with Feature Inventory #43. The current shipped contract is `create/join/leave; reconnect; no stale room state`. Current v3 has no room question/answer/scoring loop; do not invent room rounds, scoring/ranking/progression, or require `bible_room_responses` activity to satisfy obsolete wording.

## Live production proof

Run `34637203062` independently verified the current intended product on both Cloudflare Pages hosts:

- asserted repository `main` was exactly `452e84c...` for the verification;
- re-ran `bash build.sh` successfully;
- byte-compared selected current shell/runtime and accepted Phase-B CSS/assets against both `https://mybiblequest.pages.dev/` and `https://biblequest-7th.pages.dev/`;
- canonical host passed current shell, explicit 320/360/390/412/430 widths, Reader, Account Phase B, Avatar Vault Phase B, Calendar Phase B, Mission Phase B, More Phase B, Progress Phase B, Assignments, Ministry Hub, Workspace, accessibility and offline-shell browser smoke;
- compatibility host passed the same live suite.

This closes the independent two-host production-content/browser verification for the unchanged product bytes. It does **not** create or expose a Cloudflare-internal deployment object/ID; the current GitHub/repository connection does not provide that provider-internal metadata. Do not repeat the two-host verifier merely because `main` later advanced through docs/test/workflow commits; rerun only if product/runtime bytes change or new evidence invalidates the proof.

## Completed visual/product checkpoints

Do not repeat: More, Calendar, Personal Mission, Avatar Vault, Account, Progress/Grow, Calendar creator edit/delete, Ministry Hub Calendar.

Current Phase B product checkpoint `2c601b3...` already contains the accepted artwork state through Progress/Grow, and run `34637203062` proves the checked current assets/styles are live on both production hosts. Issue #94 is closed as completed. Additional visual work is allowed only when current field/production evidence demonstrates a material remaining gap.

## Issue #6 mobile/PWA state

Automated and hosted headless current-v3 acceptance is complete at 320/360/390/412/430 px. The test validates the intentional five-tab shell (`Home`, `Learn`, `Play`, `Grow`, `More`), Daily Journey discoverability, header fit, practical touch targets, support/body text floor, no horizontal overflow, all five primary routes and no console/page errors.

Historical four-tab/nine-node wording in Issue #6 is obsolete implementation detail and must not be restored. Issue #6 remains open only for field evidence that CI cannot honestly provide: physical Android Chrome and Brave at 100% zoom plus a genuinely installed-PWA device check.

## Issue #68 multi-account state

Issue #68 remains a real field-evidence gate, not an implementation backlog item.

The latest read-only production inspection on Supabase project `zkfmgezvzugchcwppreq` confirmed:

- project `ACTIVE_HEALTHY`;
- relevant Edge Functions active, including `bq-assignment` v6, `bq-team` v1, `bq-journey-group` v2, `bq-couple` v2 and `bq-room-poll` v2;
- RLS enabled on checked congregation/group/team/assignment/couple/room relationship tables;
- 10 auth users;
- one congregation containing 4 member accounts total: 1 admin + 3 members;
- 6 auth users outside congregation membership, so an unrelated Account C topology is available;
- one couple-pair row existed but was **pending**, with **no active linked couple**;
- at that inspection there were 0 Journey Groups, 0 Cloud Teams, 0 group/team membership rows and 0 shared Live Room sessions/participants.

The historical `room responses: 0` observation is informational only; current #43 Live Rooms have no question/response gameplay acceptance.

Therefore the congregation A/B/C account topology exists for real isolation testing, but the couples scenarios first require completing/accepting a legitimate test pair through the product UI. Actual multi-account UI/device activity is still required to create and verify all relationship workflows and negative isolation. Static/browser PASS and harness syntax PASS do not close this gate. The repository-side harness work did not mutate production data.

## Security triage

Supabase advisor warnings for `bible_poll_aggregate_v2(uuid)` and `bible_poll_totals(uuid)` were inspected. Both are intentional authenticated aggregate-read `SECURITY DEFINER` functions with explicit congregation-membership authorization; the richer aggregate also enforces result-visibility rules. No current release security defect was reproduced from these warnings.

BibleQuest server-only tables reported as RLS-enabled/no-policy were checked and have no anon/authenticated DML grants. Do not add permissive policies merely to silence INFO findings.

Leaked-password protection remains disabled and is recommended platform hardening; it is not currently a reproduced product regression. Do not weaken or redesign the existing auth flow to compensate.

## Supabase migration state

Known release migrations remain **APPLIED + LIVE VERIFIED** and must not be reapplied:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

No production database/schema/RLS/Edge Function mutation was made by PRs #117–#121 or by the current release-control consolidation.

## Immediate next route

1. preserve exact-green product `2c601b3...` separately from later validation/release-control HEADs;
2. treat Issue #94 visual polish as complete/closed; do not resume visual product work unless field/production evidence demonstrates a material release gap;
3. do not add product code unless a current-v3 P0/P1 or required field validation exposes a real defect;
4. complete Issue #68 multi-account field validation with legitimate dedicated accounts and separate sessions/devices through normal auth/UI/API/RLS paths; use the guarded harnesses as operator tooling, not as a substitute for observed field proof;
5. complete/accept a legitimate linked test couple through the product UI before couples-field scenarios;
6. execute physical Android Chrome/Brave + installed-PWA acceptance for Issue #6 when a real device/session is available;
7. do not rerun the independent two-host hosted verification unless product/runtime bytes change or new evidence invalidates it;
8. if strict Cloudflare-internal deployment metadata is required, obtain it only through an authorized provider connection; do not infer or invent it;
9. if any product correction is required by field/production evidence, create a new exact candidate and rerun the complete release cycle and changed live proof. Never transfer PASS.

## Non-negotiable rules

Rebuild-and-verify; one owner per responsibility; `src/core/api.js` remains browser backend owner unless intentionally redesigned; never transfer PASS; never claim unexecuted tests; docs/validation/workflow-only HEAD != product SHA; a field harness existing or syntax-checking green != real field PASS; do not weaken validators/auth/RLS; preserve rollback; GitHub validation != provider-internal metadata != independent live proof; static/headless CI != real multi-account/device proof; do not call the app bug-free.
