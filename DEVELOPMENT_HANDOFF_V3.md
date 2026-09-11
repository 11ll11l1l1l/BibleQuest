# BibleQuest v3 continuation handoff

Updated: 2026-09-12 JST after final mobile/build validation gate integration.

## Read first

1. `DEVELOPMENT_PRIORITY_V3.md`
2. `RECONCILIATION_V3.md`
3. `DEVELOPMENT_STATUS_V3.md`
4. `RELEASE_ACCEPTANCE_MATRIX_V3.md`
5. `VISUAL_PHASE_B_V3.md` only if current evidence selects another visual correction
6. the selected feature/release-gate contract
7. `CONTINUE_PROMPT_V3.md`

Repository evidence and the latest explicit user instruction override stale prose.

## Exact product vs validation truth

- repository: `11ll11l1l1l/BibleQuest`
- current exact-green **product**: `2c601b3289dba891f349801219f49804f85f63cc`
- product frozen ref: `release/v3-phase-b-progress-artwork-20260912`
- product accumulated run: `34633247237` — **success**
- product PR: #110
- current exact-green **release-validation layer**: `d0eab188479f20273cbd67cb5b796c74868dc5d4`
- validation frozen ref: `release/v3-final-mobile-width-gate-20260912`
- validation run: `34634460077` — **success**
- validation PR: #111
- previous rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

PR #111 changed workflow/tests/release documentation only. It did **not** change product behavior, visual product state, persistence, API/Supabase, auth, scoring or database code. Therefore `d0eab188...` is the exact tested validation/repository integration SHA, while `2c601b3...` remains the exact-green product identity.

Run `34634460077` explicitly checked out `d0eab188479f20273cbd67cb5b796c74868dc5d4` as `refs/pull/111/merge` and passed:

- `bash build.sh` Cloudflare deployment gate;
- complete accumulated architecture validators;
- complete edge/security/static suite;
- local app boot;
- complete browser/mobile suite;
- explicit 320/360/390/412/430 px current-v3 acceptance;
- PWA install and offline-shell regression;
- accessibility/reduced-motion-sensitive accumulated checks;
- all accepted Phase B focused regressions through Progress/Grow.

## Completed visual/product checkpoints

Do not repeat: More, Calendar, Personal Mission, Avatar Vault, Account, Progress/Grow, Calendar creator edit/delete, Ministry Hub Calendar.

Current Phase B product checkpoint `2c601b3...` already contains the accepted artwork state through Progress/Grow. Additional visual work is allowed only when current source/investigator evidence demonstrates a material remaining gap; Issue #94 does not authorize endless tranche creation.

## Issue #6 mobile/PWA state

Automated current-v3 acceptance is now complete and permanent at 320/360/390/412/430 px. The test validates the intentional five-tab shell (`Home`, `Learn`, `Play`, `Grow`, `More`), Daily Journey discoverability, header fit, practical touch targets, support/body text floor, no horizontal overflow, all five primary routes and no console/page errors.

Historical four-tab/nine-node wording in Issue #6 is obsolete implementation detail and must not be restored. Issue #6 remains open only for field evidence that CI cannot honestly provide: physical Android Chrome/Brave at 100% zoom and a genuinely installed-PWA check.

## Issue #68 multi-account state

Issue #68 remains a real field-evidence gate, not an implementation backlog item.

Read-only production inspection on Supabase project `zkfmgezvzugchcwppreq` confirmed:

- project `ACTIVE_HEALTHY`;
- relevant Edge Functions active, including `bq-assignment` v6, `bq-team` v1, `bq-journey-group` v2, `bq-couple` v2 and `bq-room-poll` v2;
- RLS enabled on checked congregation/group/team/assignment/couple/room relationship tables;
- 10 auth users, 4 congregation-membership rows across admin/member roles and 1 couple pair;
- currently 0 Journey Groups, 0 Cloud Teams, 0 group/team membership rows and 0 room-response rows.

Therefore actual multi-account UI/device activity is still required to create and verify the missing relationship workflows and negative isolation. Static/browser PASS does not close this gate. No production data was mutated during inspection.

## Security triage

Supabase advisor warnings for `bible_poll_aggregate_v2(uuid)` and `bible_poll_totals(uuid)` were inspected. Both are intentional authenticated aggregate-read `SECURITY DEFINER` functions with explicit congregation-membership authorization; the richer aggregate also enforces result-visibility rules. No current release security defect was reproduced from these warnings.

BibleQuest server-only tables reported as RLS-enabled/no-policy were checked and have no anon/authenticated DML grants. Do not add permissive policies merely to silence INFO findings.

Leaked-password protection remains disabled and is recommended platform hardening; it is not currently a reproduced product regression. Do not weaken or redesign the existing auth flow to compensate.

## Supabase migration state

Known release migrations remain **APPLIED + LIVE VERIFIED** and must not be reapplied:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Neither PR #110 nor PR #111 made a production database mutation.

## Immediate next route

1. preserve product `2c601b3...` and validation SHA `d0eab188...` separately;
2. do not add product code unless a current-v3 P0/P1, material visual gap, or required field validation exposes a real defect;
3. complete Issue #68 multi-account field validation using real/test accounts and multiple sessions/devices without bypassing auth/RLS;
4. execute physical Android Chrome/Brave + installed-PWA acceptance for Issue #6 when a real device/session is available;
5. establish/record the Cloudflare provider deployment identity for the intended final product;
6. independently verify canonical `https://mybiblequest.pages.dev/` and compatibility `https://biblequest-7th.pages.dev/` match the exact intended candidate;
7. if any product correction is required by field/production evidence, create a new exact candidate and rerun the complete release cycle. Never transfer PASS.

## Non-negotiable rules

Rebuild-and-verify; one owner per responsibility; `src/core/api.js` remains browser backend owner unless intentionally redesigned; never transfer PASS; never claim unexecuted tests; docs/validation-only HEAD != product SHA; do not weaken validators; preserve rollback; workflow remains `workflow_dispatch` + `pull_request`; GitHub validation != provider deployment != independent live proof; static CI != real multi-account/device proof; do not call the app bug-free.
