# BibleQuest v3 Development Status

Updated: 2026-09-12 JST after guarded field-harness preparation, Live Room acceptance reconciliation, and release-control consolidation.

## Current release truth

- current repository `main` at this consolidation start: `ad6c6a7e0afaf9dcb38638f7a3a6fd7c047f2b14`
- exact-green product SHA: `2c601b3289dba891f349801219f49804f85f63cc`
- product ref: `release/v3-phase-b-progress-artwork-20260912`
- product run: `34633247237` — success
- product PR: #110
- exact-green final-mobile validation SHA: `d0eab188479f20273cbd67cb5b796c74868dc5d4`
- validation ref: `release/v3-final-mobile-width-gate-20260912`
- validation run: `34634460077` — success
- validation PR: #111
- latest complete release-control regression head: `6dcf40096df4cb6785ea1a38753887ba9c71859e`
- latest complete release-control regression run: `34648966867` — success
- latest merged release-control `main`: `ad6c6a7e0afaf9dcb38638f7a3a6fd7c047f2b14`
- live verified repository `main` at production-verification time: `452e84cdbe1a63dc86d4079ff3bf0f6a9edc8f8b`
- current-production verification branch: `verify/v3-production-current-452e84c-20260912`
- verifier commit: `197056e374f06b59246dcf953405818b89ffde9d`
- production verifier run: `34637203062`, job `103387887268` — success
- rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

PR #111 and later release-control commits are validation/tests/docs/workflow only unless repository evidence explicitly shows otherwise. The product remains `2c601b3...` until product/runtime code changes and earns a new complete verification. A later documentation/workflow `main` HEAD is not a new product SHA.

## Automated final-release evidence complete

Run `34634460077` passed the accumulated exact-candidate release cycle available in CI:

- `bash build.sh` Cloudflare deployment gate;
- all accumulated architecture validators;
- all accumulated edge/security/static regressions;
- local app boot;
- complete accumulated browser/mobile suite;
- explicit 320/360/390/412/430 px current-v3 acceptance;
- five-tab Home/Learn/Play/Grow/More fit and usability;
- Daily Journey discoverability;
- header fit, practical touch targets, text-size floor, no horizontal overflow and no console/page errors;
- PWA install and offline-shell regression;
- accessibility/reduced-motion-sensitive accumulated checks;
- all accepted Phase B focused checks through Progress/Grow.

Later release-control work was also exercised by the full canonical v3 regression. In particular, PR #120 exact head `ab0b9eba970e4ce2a56ad4793d212a16abf3e351` passed run `34648510971`, and PR #121 exact head `6dcf40096df4cb6785ea1a38753887ba9c71859e` passed run `34648966867`. These runs do not create a new product identity because the changes were CI/release-documentation only.

## Guarded field-validation readiness

Repository-side preparation for the remaining Issue #68 field gate now includes three guarded Playwright harnesses:

- `tests/v3-field-validation-harness.mjs` — multi-account relationship/isolation scenarios using separate authenticated browser contexts and normal production UI/API paths;
- `tests/v3-field-linked-assignment-harness.mjs` — linked/group/team assignment field scenarios and persistence/isolation checks;
- `tests/v3-field-live-room-harness.mjs` — current Live Room create/join/reconnect/end/isolation contract across three independent sessions.

The canonical `.github/workflows/v3-regression.yml` syntax-checks all three guarded harnesses after PR #120. They fail closed for mutation unless the documented dedicated field-test environment is explicitly supplied. Credentials remain environment-only and evidence output is sanitized.

These harnesses are **supplemental field tooling**, not field PASS. They have not been represented as having executed against real dedicated Account A/B/C credentials in this release-control session. They do not replace real physical-device/network/PWA evidence and do not close Issue #68 by themselves.

The current authoritative Feature Inventory #43 Live Room contract is `create/join/leave; reconnect; no stale room state`. PR #121 reconciled `RELEASE_FIELD_VALIDATION_V3.md` to that shipped contract. Current v3 does not expose a room question/answer/scoring loop, and `bible_room_responses` activity is not a release requirement for #43. Do not invent room gameplay to satisfy superseded wording.

## Independent live-production evidence complete

Run `34637203062` held `main` at exact SHA `452e84c...` and then:

- re-ran `bash build.sh` successfully;
- confirmed selected current release files byte-for-byte on both `https://mybiblequest.pages.dev/` and `https://biblequest-7th.pages.dev/`;
- included current shell/runtime plus Account, Avatar Vault, Calendar, Mission, More and Progress Phase-B CSS/assets in the byte identity set;
- ran the current shell + explicit 320/360/390/412/430 width test directly against the canonical production host;
- ran Reader, Account Phase B, Avatar Vault Phase B, Calendar Phase B, Mission Phase B, More Phase B, Progress Phase B, Assignments, Ministry Hub, Workspace, accessibility and offline-shell browser smoke directly against the canonical host;
- repeated the same hosted browser/mobile suite successfully on the compatibility host.

This closes the independent two-host production-content/browser verification gap for the unchanged product bytes. It does not substitute for physical-device or real multi-account field proof. The connected repository tooling does not expose a Cloudflare-internal deployment object/ID, so that provider-internal identifier is not claimed.

## Product work retained

Accepted exact-green product work includes More, Calendar, Personal Mission, Avatar Vault, Account and Progress/Grow Phase B; Calendar creator edit/delete; Ministry Hub Calendar; all previously accumulated v3 feature/security regressions.

Issue #94 visual-polish milestone is complete and closed. Do not repeat these milestones. No new visual/product tranche is selected unless current field/production evidence demonstrates a material remaining gap.

## Production Supabase state

Project `zkfmgezvzugchcwppreq` was confirmed `ACTIVE_HEALTHY` in the latest read-only release inspection.

Known release migrations remain **APPLIED + LIVE VERIFIED** and must not be replayed:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

The latest read-only field-readiness inspection confirmed relevant linked-activity functions/tables exist and checked relationship tables have RLS enabled. It showed 10 auth users; one congregation with 4 members total (1 admin + 3 members); 6 auth users outside congregation membership; and one couple-pair row that was **pending**, with **no active linked couple**. At that inspection there were no Journey Groups, Cloud Teams, group/team membership rows or shared Live Room sessions/participants. The `room responses: 0` observation is informational only because the current Live Room contract has no room question/scoring loop.

This means the A/B/C congregation/isolation topology exists for real field testing, while couples scenarios first require completing a legitimate link through the product UI. The guarded harnesses were added without mutating production Supabase data/schema/RLS/Edge Functions.

## Security triage status

- poll aggregate `SECURITY DEFINER` advisor warnings were reviewed; both functions explicitly authorize congregation membership, and aggregate-v2 also enforces result visibility. No release blocker reproduced.
- BibleQuest server-only RLS/no-policy tables checked have anon/authenticated DML closed. No permissive policy change is warranted.
- leaked-password protection remains disabled and is recommended platform hardening, not a reproduced product regression.

## Current blockers / remaining gates

No current-v3 P0/P1 product/security/privacy/data-loss defect is reproduced. Do not call the app bug-free.

Remaining official-release evidence:

1. **Issue #68 multi-account field validation** — actual dedicated multiple accounts/sessions/devices must exercise congregation/Journey Group, targeted assignments, Cloud Team, legitimate linked-couple/challenge and current-contract Live Room workflows plus negative isolation and reconnect/reload/re-login behavior. The guarded harnesses reduce operator error but do not substitute for the real field run.
2. **Issue #6 physical-device/PWA field validation** — Android Chrome and Brave at 100% zoom plus a genuinely installed-PWA session on a physical device. Automated and hosted headless width/PWA regression is green but cannot prove this step.
3. **Cloudflare internal provider metadata, only if strictly required** — exact production content identity is proven for the unchanged product bytes, but the Cloudflare-internal deployment object/ID is not exposed by the currently connected repository tooling.

Independent two-host production verification is complete and must not be reopened unless product/runtime bytes change or new evidence invalidates it.

Issue #94 is closed as completed. It is not a remaining release gate and must not be reopened merely to create another visual tranche; only new material field/production evidence can justify additional visual product work.

## Next major milestone

- preserve exact-green product `2c601b3...` separately from later validation/release-control HEADs;
- use the guarded field harnesses only with legitimate dedicated test accounts and normal product authentication/UI/API/RLS paths;
- complete/accept a legitimate test couple link through the product UI before claiming couples field scenarios;
- complete the Issue #68 field matrix and capture sanitized observed evidence; do not manufacture PASS with direct database inserts or privileged mutation;
- perform physical Android Chrome/Brave and installed-PWA acceptance when a real device/session is available;
- stop feature/visual churn unless those gates reproduce a real current-v3 defect or material release gap;
- do not repeat two-host hosted verification unless product/runtime bytes change;
- if any product correction is required, create a new exact candidate and repeat build + architecture + edge/security + full browser/mobile + explicit widths + PWA/offline + relevant field/live proof before promotion.

## Defect / root-cause ledger

- PR #110 Progress/Grow Phase B: completed, exact product `2c601b3...`, run `34633247237` success.
- PR #111 final mobile/build gate: completed, exact validation SHA `d0eab188...`, run `34634460077` success; no product behavior changed.
- PR #112 release-control reconciliation: docs-only; complete accumulated regression run `34636337038` success.
- Current-production verifier: run `34637203062`, job `103387887268` success; both hosts byte-match checked current release files and pass hosted browser/mobile acceptance.
- PR #117: guarded multi-account field harness merged; canonical regression run `34643801970` success; no product/runtime behavior change.
- PR #118: linked-assignment field harness merged; exact head `85619c776f4557eb01db77154fb4b168da77cd4f`, full regression run `34645086148` success; no product/runtime behavior change.
- PR #119: guarded Live Room field harness and operator note merged; validation-only, no product/runtime behavior change.
- PR #120: all three guarded field harnesses covered by canonical syntax checks; exact head `ab0b9eba970e4ce2a56ad4793d212a16abf3e351`, full regression run `34648510971` success.
- PR #121: current Live Room field acceptance reconciled to shipped Feature Inventory #43 contract; exact head `6dcf40096df4cb6785ea1a38753887ba9c71859e`, full regression run `34648966867` success; merged release-control `main` `ad6c6a7e0afaf9dcb38638f7a3a6fd7c047f2b14`.
- Issue #94 visual-polish milestone: completed and closed after accepted Phase-B state was regression-verified and independently proven live on both production hosts.
- Issue #6 old four-tab/nine-node wording: stale implementation detail; current five-tab v3 intent verified automatically and on hosted production, physical-device field proof still missing.
- Issue #68: implementation complete, field evidence incomplete; repository-side guarded harnesses are prepared, but real authenticated field execution remains required.
- PR #88 legacy stale-device issue: not reproduced in current v3 runtime.
- Release-control validator regression: detected by PR #112 because this file had renamed required contract headings after run `34634460077`; corrected without weakening the validator or changing product behavior.

## Evidence rules

Repository evidence overrides stale prose. Product SHA != validation/docs/workflow SHA. Never transfer PASS across product changes. Never claim physical-device/multi-account/provider-internal evidence from CI. A harness being present or syntax-checked is not proof that its real field scenario passed. GitHub validation != provider-internal metadata != independent live proof. Do not weaken auth/RLS/tests to make evidence easier.
