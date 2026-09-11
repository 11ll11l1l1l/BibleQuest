# BibleQuest v3 — Product/Documentation Reconciliation

Status: product exact-green through Progress/Grow; final automated validation and independent two-host production verification complete; field evidence remains
Updated: 2026-09-12 JST

## Product truth

- exact-green product: `2c601b3289dba891f349801219f49804f85f63cc`
- product ref: `release/v3-phase-b-progress-artwork-20260912`
- product verifier: run `34633247237` — success
- product PR: #110

This remains the product identity because subsequent PR #111 and later release-control changes are tests/workflow/documentation only.

## Release-validation truth

- exact tested validation/integration SHA: `d0eab188479f20273cbd67cb5b796c74868dc5d4`
- validation ref: `release/v3-final-mobile-width-gate-20260912`
- validation run: `34634460077` — success
- validation PR: #111

Run `34634460077` passed the full accumulated release cycle available in CI: Cloudflare build gate, architecture validators, edge/security/static regressions, local app boot, full browser/mobile regressions, explicit 320/360/390/412/430 current-v3 width acceptance, PWA install/offline-shell regressions, accessibility/reduced-motion-sensitive coverage and accepted Phase B focused regressions.

This SHA is a validated repository/release-gate integration point, not a new product SHA.

## Product ancestry retained

- Account Phase B: `2f04b715...`, run `34632158164` success.
- Avatar Vault Phase B: `df2a705...`, run `34630985269` success.
- Personal Mission Phase B: `df1bbd...`, run `34629528297` success.
- Calendar Phase B: `c15d1f...`, run `34627049878` success.
- More Phase B: `046e2a85...`, run `34618963635` success.
- rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.

## Issue #6 reconciliation

Automated and hosted-headless final-width intent is satisfied for the current v3 architecture. The permanent test verifies 320/360/390/412/430 px, the five current nav routes Home/Learn/Play/Grow/More, Daily Journey prominence, header fit, touch targets, text floor, no horizontal overflow and no console/page errors. Run `34637203062` repeated the current hosted checks directly on both production hosts successfully.

Historical four-tab and Home nine-node wording is obsolete and must not drive a regression. Physical Android Chrome/Brave and genuine installed-PWA device acceptance remain separate field evidence and are not claimed by headless Chromium.

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

No production database mutation was made by PR #110, PR #111, PR #112 or the production verifier.

## Deployment truth

Do not transfer the historical `cf17f36...` / `04bd51b...` deployment PASS as proof for later product work. Fresh current evidence now exists.

- GitHub exact product regression: complete on product `2c601b3...`, run `34633247237`.
- exact validation/build/width regression: complete on validation integration `d0eab188...`, run `34634460077`.
- repository `main` during current production verification: `452e84cdbe1a63dc86d4079ff3bf0f6a9edc8f8b`.
- verification branch: `verify/v3-production-current-452e84c-20260912` at `197056e374f06b59246dcf953405818b89ffde9d`.
- current production verifier: run `34637203062`, job `103387887268` — success.
- canonical `https://mybiblequest.pages.dev/`: selected current release files matched byte-for-byte and the hosted current browser/mobile suite passed.
- compatibility `https://biblequest-7th.pages.dev/`: selected current release files matched byte-for-byte and the same hosted suite passed.

Therefore independent two-host production-content/browser verification is **complete** for the intended current product state. The current repository tooling does not expose a Cloudflare-internal deployment object/ID; that provider-internal identifier is not claimed and its absence is not a deployment failure.

## Next safe gate

No automatic new product tranche is selected.

1. preserve product `2c601b3...` and validation `d0eab188...` separately;
2. execute Issue #68 multi-account field validation when test credentials/sessions/devices are available;
3. execute physical Android Chrome/Brave + installed-PWA field acceptance when a real device is available;
4. do not repeat independent two-host production verification unless product/runtime bytes change;
5. obtain Cloudflare-internal deployment metadata only if strictly required and an authorized provider connection exposes it;
6. only if field/production evidence exposes a real product defect or material visual gap, fix the true owner and create a new exact candidate with complete regression and renewed live proof.

## Document authority

1. latest explicit user instruction;
2. `DEVELOPMENT_PRIORITY_V3.md`;
3. this file;
4. handoff/status;
5. `RELEASE_ACCEPTANCE_MATRIX_V3.md` and selected feature contract;
6. exact workflow/deployment/live evidence;
7. historical inventory/agent evidence.

Never transfer PASS; docs/validation-only HEAD != product SHA; static/headless CI != real-device/multi-account proof; GitHub validation != provider-internal metadata != independent live proof.
