# BibleQuest v3 Development Status

Updated: 2026-09-12 JST after independent current-production two-host verification, fresh field-readiness inspection, and visual-milestone closeout.

## Current release truth

- exact-green product SHA: `2c601b3289dba891f349801219f49804f85f63cc`
- product ref: `release/v3-phase-b-progress-artwork-20260912`
- product run: `34633247237` — success
- product PR: #110
- exact-green validation SHA: `d0eab188479f20273cbd67cb5b796c74868dc5d4`
- validation ref: `release/v3-final-mobile-width-gate-20260912`
- validation run: `34634460077` — success
- validation PR: #111
- live verified repository `main` at verification time: `452e84cdbe1a63dc86d4079ff3bf0f6a9edc8f8b`
- current-production verification branch: `verify/v3-production-current-452e84c-20260912`
- verifier commit: `197056e374f06b59246dcf953405818b89ffde9d`
- production verifier run: `34637203062`, job `103387887268` — success
- rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

PR #111 and later release-control commits are validation/docs/workflow only. The product remains `2c601b3...` until product code changes and earns a new complete verification.

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

## Independent live-production evidence complete

Run `34637203062` held `main` at exact SHA `452e84c...` and then:

- re-ran `bash build.sh` successfully;
- confirmed selected current release files byte-for-byte on both `https://mybiblequest.pages.dev/` and `https://biblequest-7th.pages.dev/`;
- included current shell/runtime plus Account, Avatar Vault, Calendar, Mission, More and Progress Phase-B CSS/assets in the byte identity set;
- ran the current shell + explicit 320/360/390/412/430 width test directly against the canonical production host;
- ran Reader, Account Phase B, Avatar Vault Phase B, Calendar Phase B, Mission Phase B, More Phase B, Progress Phase B, Assignments, Ministry Hub, Workspace, accessibility and offline-shell browser smoke directly against the canonical host;
- repeated the same hosted browser/mobile suite successfully on the compatibility host.

This closes the independent two-host production-content/browser verification gap. It does not substitute for physical-device or real multi-account field proof. The connected repository tooling does not expose a Cloudflare-internal deployment object/ID, so that provider-internal identifier is not claimed.

## Product work retained

Accepted exact-green product work includes More, Calendar, Personal Mission, Avatar Vault, Account and Progress/Grow Phase B; Calendar creator edit/delete; Ministry Hub Calendar; all previously accumulated v3 feature/security regressions.

Issue #94 visual-polish milestone is complete and closed. Do not repeat these milestones. No new visual/product tranche is selected unless current field/production evidence demonstrates a material remaining gap.

## Production Supabase state

Project `zkfmgezvzugchcwppreq` is `ACTIVE_HEALTHY`.

Known release migrations remain **APPLIED + LIVE VERIFIED** and unchanged:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Read-only release inspection confirms relevant linked-activity functions/tables exist and checked relationship tables have RLS enabled. Fresh aggregate field-readiness inspection shows 10 auth users; one congregation with 4 members total (1 admin + 3 members); 6 auth users outside congregation membership; and one couple-pair row that is **pending**, with **no active linked couple**. There are still no Journey Groups, Cloud Teams, group/team membership rows, shared Live Room sessions/participants, or room-response rows. This means the A/B/C congregation/isolation account topology exists, but the couple scenario still requires completing a legitimate link through the product UI. No production data/schema/RLS/Edge Function changes were made.

## Security triage status

- poll aggregate `SECURITY DEFINER` advisor warnings were reviewed; both functions explicitly authorize congregation membership, and aggregate-v2 also enforces result visibility. No release blocker reproduced.
- BibleQuest server-only RLS/no-policy tables checked have anon/authenticated DML closed. No permissive policy change is warranted.
- leaked-password protection remains disabled and is recommended platform hardening, not a reproduced product regression.

## Current blockers / remaining gates

No current-v3 P0/P1 product/security/privacy/data-loss defect is reproduced. Do not call the app bug-free.

Remaining official-release evidence:

1. **Issue #68 multi-account field validation** — actual multiple accounts/sessions/devices must create/exercise congregation, Journey Group, Cloud Team, couple/challenge and Live Room workflows plus negative isolation and reconnect/re-login behavior. Current aggregate account topology can support congregation A/B/C isolation, but no active linked couple exists yet.
2. **Issue #6 physical-device/PWA field validation** — Android Chrome/Brave at 100% zoom and a genuinely installed-PWA session. Automated and hosted headless width/PWA regression is green but does not prove this field step.
3. **Cloudflare internal provider metadata, only if strictly required** — exact production content identity is now proven to the current main product files, but the Cloudflare-internal deployment object/ID is not exposed by the currently connected repository tooling.

Independent two-host production verification is complete and must not be reopened unless the product/runtime changes.

Issue #94 is closed as completed. It is not a remaining release gate and must not be reopened merely to create another visual tranche; only new material field/production evidence can justify additional visual product work.

## Next major milestone

- preserve product `2c601b3...` and validation `d0eab188...` separately;
- stop feature/visual churn unless field/production evidence exposes a real defect or material gap;
- perform Issue #68 using real/test account credentials and actual product paths, never direct table mutations to manufacture PASS;
- complete/accept a test couple link through the product UI before claiming the couples field scenarios;
- perform physical Android/installed-PWA acceptance when a real device/session is available;
- do not repeat two-host hosted verification unless product/runtime bytes change;
- if any product correction is required, create a new candidate and repeat build + architecture + edge/security + full browser/mobile + explicit widths + PWA/offline + relevant field/live proof before promotion.

## Defect / root-cause ledger

- PR #110 Progress/Grow Phase B: completed, exact product `2c601b3...`, run `34633247237` success.
- PR #111 final mobile/build gate: completed, exact validation SHA `d0eab188...`, run `34634460077` success; no product behavior changed.
- PR #112 release-control reconciliation: docs-only; complete accumulated regression run `34636337038` success.
- Current-production verifier: run `34637203062`, job `103387887268` success; both hosts byte-match checked current release files and pass hosted browser/mobile acceptance.
- Issue #94 visual-polish milestone: completed and closed after accepted Phase-B state was regression-verified and independently proven live on both production hosts.
- Issue #6 old four-tab/nine-node wording: stale implementation detail; current five-tab v3 intent verified automatically and on hosted production, physical-device field proof still missing.
- Issue #68: implementation complete, field evidence incomplete; fresh aggregate readiness inspection confirms congregation A/B/C topology is available but the only couple-pair row is pending, not active.
- PR #88 legacy stale-device issue: not reproduced in current v3 runtime.
- Release-control validator regression: detected by PR #112 because this file had renamed required contract headings after run `34634460077`; corrected without weakening the validator or changing product behavior.

## Evidence rules

Repository evidence overrides stale prose. Product SHA != validation/docs SHA. Never transfer PASS across product changes. Never claim physical-device/multi-account/provider-internal evidence from CI. GitHub validation != provider-internal metadata != independent live proof. Do not weaken auth/RLS/tests to make evidence easier.
