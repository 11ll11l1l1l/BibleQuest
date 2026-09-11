# BibleQuest v3 — Product/Documentation Reconciliation

Status: product exact-green through Progress/Grow; final automated mobile/build validation integrated; field/provider evidence remains
Updated: 2026-09-12 JST

## Product truth

- exact-green product: `2c601b3289dba891f349801219f49804f85f63cc`
- product ref: `release/v3-phase-b-progress-artwork-20260912`
- product verifier: run `34633247237` — success
- product PR: #110

This remains the product identity because subsequent PR #111 changed only tests/workflow/release documentation.

## Release-validation truth

- exact tested validation/integration SHA: `d0eab188479f20273cbd67cb5b796c74868dc5d4`
- validation ref: `release/v3-final-mobile-width-gate-20260912`
- validation run: `34634460077` — success
- validation PR: #111
- PR #111 feature head: `dd0b3b7dad7d59f76f05facb55ccd90bb02fb7f0`
- PR #111 base: `1f95ce74b55aed45afab5d4d1dd9efaa8d79762a`

Run `34634460077` explicitly fetched and checked out `d0eab188479f20273cbd67cb5b796c74868dc5d4` as `refs/pull/111/merge` and passed the full accumulated release cycle available in CI:

- Cloudflare `bash build.sh` deployment gate;
- architecture validators;
- edge/security/static regressions;
- local app boot;
- full browser/mobile regressions;
- explicit 320/360/390/412/430 current-v3 width acceptance;
- PWA install/offline-shell regressions;
- accessibility/reduced-motion-sensitive accumulated coverage;
- accepted Phase B focused regressions.

This SHA is a validated repository/release-gate integration point, not a new product SHA.

## Product ancestry retained

- Account Phase B: `2f04b715...`, run `34632158164` success.
- Avatar Vault Phase B: `df2a705...`, run `34630985269` success.
- Personal Mission Phase B: `df1bbd...`, run `34629528297` success.
- Calendar Phase B: `c15d1f...`, run `34627049878` success.
- More Phase B: `046e2a85...`, run `34618963635` success.
- rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.

## Issue #6 reconciliation

Automated final-width intent is now satisfied for the current v3 architecture. The permanent test verifies 320/360/390/412/430 px, the five current nav routes Home/Learn/Play/Grow/More, Daily Journey prominence, header fit, touch targets, text floor, no horizontal overflow and no console/page errors.

Historical four-tab and Home nine-node wording is obsolete and must not drive a regression. Physical Android Chrome/Brave and genuine installed-PWA acceptance remain separate field evidence and are not claimed by headless Chromium.

## Issue #68 reconciliation

Implementation is live; field proof remains missing.

Read-only production inspection of project `zkfmgezvzugchcwppreq` found the project healthy, relevant Edge Functions active, checked relationship tables RLS-enabled, 10 auth users, 4 congregation memberships across admin/member roles and one couple pair. Journey Group, Cloud Team and room-response rows are currently absent, so their real multi-account workflows have not yet generated production field evidence.

Do not insert rows manually to manufacture PASS. Actual product/auth/RLS/realtime paths must be exercised with multiple accounts/sessions/devices.

## Security reconciliation

Supabase advisor warnings were triaged without production mutation:

- authenticated `SECURITY DEFINER` RPCs `bible_poll_aggregate_v2(uuid)` and `bible_poll_totals(uuid)` explicitly authorize congregation membership; aggregate-v2 also enforces results visibility. No exploitable release defect was reproduced.
- BibleQuest server-only tables flagged RLS-enabled/no-policy were checked to have anon/authenticated DML closed. No permissive policy should be added just to silence INFO.
- leaked-password protection is disabled. This is recommended platform hardening, not presently a reproduced product regression.

## Supabase production truth

Known release migrations remain **APPLIED + LIVE VERIFIED** and unchanged:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

No production database mutation was made by PR #110, PR #111, or the release-readiness inspection.

## Deployment truth

Do not transfer historical deployment PASS to product `2c601b3...`.

- GitHub exact product regression: complete.
- exact validation/build/width regression: complete.
- provider deployment identity for exact intended product: not canonically recorded.
- independent verification of canonical `https://mybiblequest.pages.dev/`: not yet recorded for this product.
- independent verification of compatibility `https://biblequest-7th.pages.dev/`: not yet recorded for this product.

## Next safe gate

No automatic new product tranche is selected.

1. preserve product `2c601b3...` and validation `d0eab188...` separately;
2. execute Issue #68 multi-account field validation when test credentials/sessions/devices are available;
3. execute physical Android Chrome/Brave + installed-PWA field acceptance when a real device is available;
4. record exact Cloudflare provider deployment identity for the intended product;
5. independently verify both production hosts against that exact candidate;
6. only if field/production evidence exposes a real product defect or material visual gap, fix the true owner and create a new exact candidate with complete regression.

## Document authority

1. latest explicit user instruction;
2. `DEVELOPMENT_PRIORITY_V3.md`;
3. this file;
4. handoff/status;
5. `RELEASE_ACCEPTANCE_MATRIX_V3.md` and selected feature contract;
6. exact workflow/deployment/live evidence;
7. historical inventory/agent evidence.

Never transfer PASS; docs/validation-only HEAD != product SHA; static CI != real-device/multi-account proof; GitHub validation != provider deployment != independent live proof.
