# BibleQuest v3 Development Status

Updated: 2026-09-12 JST after final automated mobile/build release gate integration.

## Current release truth

- exact-green product SHA: `2c601b3289dba891f349801219f49804f85f63cc`
- product ref: `release/v3-phase-b-progress-artwork-20260912`
- product run: `34633247237` — success
- product PR: #110
- exact-green validation SHA: `d0eab188479f20273cbd67cb5b796c74868dc5d4`
- validation ref: `release/v3-final-mobile-width-gate-20260912`
- validation run: `34634460077` — success
- validation PR: #111
- rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

PR #111 is validation/workflow/docs only. The product remains `2c601b3...`. Later docs commits do not change product identity.

## Automated final-release evidence now complete

Run `34634460077` checked out exact PR synthetic merge SHA `d0eab188...` and passed:

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

This closes the missing automated mobile/build evidence. It does not substitute for physical-device, multi-account or provider/live-production proof.

## Product work retained

Accepted exact-green product work includes More, Calendar, Personal Mission, Avatar Vault, Account and Progress/Grow Phase B; Calendar creator edit/delete; Ministry Hub Calendar; all previously accumulated v3 feature/security regressions.

Do not repeat these milestones. No new visual/product tranche is selected unless current evidence demonstrates a material remaining gap.

## Production Supabase state

Project `zkfmgezvzugchcwppreq` is `ACTIVE_HEALTHY`.

Known release migrations remain **APPLIED + LIVE VERIFIED** and unchanged:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Read-only release inspection confirms relevant linked-activity functions/tables exist and checked relationship tables have RLS enabled. Current production has 10 auth users, 4 congregation membership rows across admin/member roles and 1 couple pair, but no Journey Groups, Cloud Teams, group/team membership rows or room-response rows. No production data/schema/RLS/Edge Function changes were made.

## Security triage status

- poll aggregate `SECURITY DEFINER` advisor warnings were reviewed; both functions explicitly authorize congregation membership, and aggregate-v2 also enforces result visibility. No release blocker reproduced.
- BibleQuest server-only RLS/no-policy tables checked have anon/authenticated DML closed. No permissive policy change is warranted.
- leaked-password protection remains disabled and is recommended platform hardening, not a reproduced product regression.

## Current blockers / remaining gates

No current-v3 P0/P1 product/security/privacy/data-loss defect is reproduced. Do not call the app bug-free.

Remaining official-release evidence:

1. **Issue #68 multi-account field validation** — actual multiple accounts/sessions/devices must create/exercise congregation, Journey Group, Cloud Team, couple/challenge and Live Room workflows plus negative isolation and reconnect/re-login behavior.
2. **Issue #6 physical-device/PWA field validation** — Android Chrome/Brave at 100% zoom and a genuinely installed-PWA session. Headless width/PWA regression is green but does not prove this field step.
3. **Cloudflare provider identity** — record the provider deployment identity/SHA for the exact intended product.
4. **Independent two-host production verification** — prove `mybiblequest.pages.dev` and `biblequest-7th.pages.dev` serve the exact expected candidate and accepted visual/functional state.

Issue #94 remains the integration tracker, but it does not require another automatic visual tranche in the absence of a demonstrated material gap.

## Correct next route

- preserve product `2c601b3...` and validation `d0eab188...` separately;
- stop feature/visual churn unless field/production evidence exposes a real defect or material gap;
- perform Issue #68 using real/test account credentials and actual product paths, never direct table mutations to manufacture PASS;
- perform physical Android/installed-PWA acceptance when a device/session is available;
- obtain provider deployment evidence and independent host verification;
- if any product correction is required, create a new candidate and repeat build + architecture + edge/security + full browser/mobile + explicit widths + PWA/offline + relevant field proof before promotion.

## Defect / milestone ledger

- PR #110 Progress/Grow Phase B: completed, exact product `2c601b3...`, run `34633247237` success.
- PR #111 final mobile/build gate: completed, exact validation SHA `d0eab188...`, run `34634460077` success; no product behavior changed.
- Issue #6 old four-tab/nine-node wording: stale implementation detail; current five-tab v3 intent verified automatically.
- Issue #68: implementation complete, field evidence incomplete.
- PR #88 legacy stale-device issue: not reproduced in current v3 runtime.

## Evidence rules

Repository evidence overrides stale prose. Product SHA != validation/docs SHA. Never transfer PASS across product changes. Never claim physical-device/multi-account/provider/live evidence from CI. GitHub validation != Cloudflare deployment identity != independent production verification. Do not weaken auth/RLS/tests to make evidence easier.
