# BibleQuest v3 Development Status

Updated: 2026-09-12 JST after Visual Phase B Account artwork promotion.

## Current release truth

- current exact-green product SHA: `2f04b7150b36d4a14dac953fd08ae2c5a307d0d9`
- current product release ref: `release/v3-phase-b-account-artwork-20260912`
- current accumulated verifier: run `34632158164` — **success** on exact PR #109 synthetic merge candidate `2f04b7150b36d4a14dac953fd08ae2c5a307d0d9`
- current product PR: #109 — merged after exact-candidate accumulated verification
- parent exact-green product: Visual Phase B Avatar Vault `df2a7051e305474a5ea24912c3f5341f33bc61b8`, run `34630985269` — success
- prior Visual Phase B Personal Mission: `df1bbd18782bee6430546ee7b444ad4bc48f5116`, run `34629528297` — success
- prior Visual Phase B Calendar: `c15d1fceddce537fa8a31a6b2b5c909d197b1b3e`, run `34627049878` — success
- prior Visual Phase B More: `046e2a85cafe10d722d03d467d3733eddfeb6e65`, run `34618963635` — success
- previous production rollback/reference remains `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

Run `34632158164` explicitly fetched `2f04b7150b36d4a14dac953fd08ae2c5a307d0d9` as `refs/pull/109/merge`, checked it out, and passed the complete accumulated suite. The exact candidate was frozen before `main` was advanced to the same SHA. No unverified product promotion SHA was created.

Later docs-only bookkeeping commits may advance repository HEAD. They do not replace `2f04b715...` as the exact-green product checkpoint until another changed product candidate earns its own complete verification.

## Deployment state

No provider-deployment or independent live-host evidence has been transferred to exact product `2f04b715...`.

GitHub regression success and promotion do not prove either production hostname serves the new exact product. Provider deployment identity and independent byte/browser live-host verification remain separate release evidence and must be recorded separately when available.

## Newly completed product work

### Visual Phase B — Account artwork

Exact-green `2f04b715...` upgrades the existing Account presentation without reopening authentication, recovery, device, storage or backend behavior:

- adds committed same-origin passive SVG artwork in `assets/account-feature-icons.svg` for profile, sign-in, create-account, recovery, remembered-device and security meanings;
- leaves `src/app/account.js` as Account transaction/device behavior owner;
- leaves `src/app/session.js` as session/auth state owner;
- leaves `src/core/api.js` as the browser backend/Supabase boundary;
- limits UI changes to `src/features/account/index.js`, `src/ui/account-phase-b.css`, the new SVG sprite and stylesheet registration;
- keeps security/recovery/device meaning in visible text and decorative artwork `aria-hidden`;
- preserves Sign in/Create account/Recover switching, guest continuation, login/signup/recovery submissions, recovery-code display/copy/save acknowledgement/Continue gate, device listing/removal, recovery-code regeneration, password change, Return home, sign-out and tutorial handoff;
- adds permanent static ownership/asset coverage and 390 px browser acceptance;
- the browser acceptance verifies distinct guest-state artwork, signed-in profile/device/security artwork, committed asset loading, 44 px relevant controls, preserved callbacks, no horizontal overflow and no console/page errors.

Run `34632158164` passed all accumulated architecture validators, all accumulated edge/security/static regressions, local app boot, and the complete browser/mobile suite, including existing Account transaction coverage and the new Account Phase B acceptance.

### Prior completed checkpoints retained

- Visual Phase B Avatar Vault: exact-green `df2a705...`, run `34630985269` success.
- Visual Phase B Personal Mission: exact-green `df1bbd...`, run `34629528297` success.
- Visual Phase B Calendar: exact-green `c15d1f...`, run `34627049878` success.
- Calendar creator edit/delete: exact-green `7d28d7c...`, run `34623059639` success.
- Visual Phase B More: exact-green `046e2a85...`, run `34618963635` success.
- Ministry Hub Calendar: exact-green `350cb1e...`, run `34616603649` success.

Do not repeat these milestones.

## Priority-firewall note

Old PR #88's stale-device overwrite claim is tied to legacy root `account.js`, which is not loaded by current v3. Current v3 boots from `src/app/bootstrap.js`; account behavior is owned by `src/app/account.js`, and v3 progress behavior is owned under `src/core/progress.js`. Do not classify PR #88 itself as a current v3 P0 without reproducing the behavior through the current runtime.

## Production Supabase state

Production project: `zkfmgezvzugchcwppreq`.

The existing release migrations remain **APPLIED + LIVE VERIFIED** and were not changed by PR #109:

- `20260911144939` — `assignment_response_presence`
- `20260911144950` — `calendar_events`
- `20260911145003` — `calendar_congregation_sharing`

Do not reapply them. PR #109 made no production database mutation.

## Current blockers and release gates

No newly reproduced current-v3 P0/P1 product, security, privacy or data-loss defect was identified during the Account promotion. Do not describe the application as bug-free.

The following remain release/acceptance work rather than evidence that the exact-green product failed regression:

- required pre-release Visual Phase B/visual-polish program remains active under Issue #94 until the accepted final visual state is complete and the exact final candidate passes its release gates;
- provider deployment identity and fresh independent two-host verification for exact product `2f04b715...` are not yet canonically recorded;
- Issue #6 retains the final-candidate real/mobile-width acceptance requirement for 320/360/390/412/430 px and installed-PWA behavior;
- Issue #68 retains multi-account field validation for linked congregation/Journey Group/couple activity integration.

These evidence/acceptance gates must not be converted into speculative product rewrites. Reproduce an actual defect before changing established functionality.

## Correct next route

Priority 1 remains coordinated functionality/correctness plus Visual Phase B quality.

1. preserve `2f04b715...` and `release/v3-phase-b-account-artwork-20260912` as the current exact-green checkpoint;
2. do not repeat Account, Avatar Vault, Personal Mission, Calendar, More, Calendar creator edit/delete or Ministry Hub Calendar work;
3. refresh repository, active PR/action, open issue/investigator and production evidence before the next product write;
4. reproduce and priority-classify any newly reported functionality/correctness issue first; a credible current-v3 P0/P1 interrupts visual work;
5. fixed-weekly congregation recurrence is complete; custom non-weekly recurrence remains deferred unless current evidence/user direction makes it release-required;
6. absent a reproduced P0/P1 gap, continue Visual Phase B on the next materially minimal, placeholder, generic or emoji-like user-facing surface using real committed assets;
7. preserve route, feature/state, persistence, API/Supabase, gameplay/scoring, accessibility and PWA ownership unless a separately selected milestone explicitly changes it;
8. add focused permanent regression coverage for the selected surface;
9. require the complete accumulated regression on the exact synthetic merge candidate before promotion;
10. freeze the exact tested candidate before advancing `main`; keep provider deployment and independent live proof as separate evidence;
11. before final public release approval, complete final-candidate provider identity, explicit 320/360/390/412/430 + installed-PWA acceptance, multi-account linked-activity validation, and independent two-host production proof.

## Defect / root-cause ledger

- **Status-contract regression — closed.** PR #98 restored validator-owned canonical headings; run `34616114505` passed completely.
- **Invalid push-trigger hardening attempt — rejected/closed.** PR #99 attempted a `push` trigger; permanent workflow contract rejected it and it was not merged.
- **Ministry Hub Calendar surface — completed.** Exact-green `350cb1e...`; run `34616603649` success.
- **Visual Phase B More — completed.** Exact-green `046e2a85...`; run `34618963635` success.
- **Calendar creator edit/delete — completed.** Exact-green `7d28d7c...`; run `34623059639` success.
- **Visual Phase B Calendar — completed.** Exact-green `c15d1f...`; run `34627049878` success.
- **Visual Phase B Personal Mission — completed.** Exact-green `df1bbd...`; run `34629528297` success.
- **Visual Phase B Avatar Vault — completed.** Exact-green `df2a705...`; run `34630985269` success.
- **Visual Phase B Account — completed.** Exact-green `2f04b715...`; run `34632158164` success; frozen release ref created and `main` advanced to the exact tested synthetic merge candidate.
- **Legacy PR #88 stale-device overwrite — not reproduced in current v3 runtime.** The referenced root runtime is not the current v3 entry path; do not import it without current-v3 evidence.
- No newly reproduced current-v3 P0/P1 product defect is recorded here. New findings must be reproduced and priority-classified before modification.

## Next major milestone

Inspect the current exact-green tree for the next materially under-designed Visual Phase B surface while checking current open work for any newly reproduced release-blocking functionality/correctness issue. Do not invent feature work merely because optional expansion is possible. If no current-v3 P0/P1 defect is reproduced, select the smallest high-value user-facing surface whose presentation is still materially placeholder, generic or emoji-like, implement real committed artwork under `VISUAL_PHASE_B_V3.md`, preserve existing interaction ownership, and require a new exact-SHA accumulated regression before promotion.

Release hardening may proceed as evidence work without modifying product behavior: record provider deployment identity when available, complete the required final-candidate mobile-width/installed-PWA evidence, complete multi-account field validation, and independently verify both production hostnames for the exact deployed product before final release approval.

## Evidence rules

Repository evidence overrides stale prose. Docs-only HEAD != product SHA. Never transfer PASS across changed product SHAs. Never claim unexecuted tests. GitHub promotion != provider deployment proof != independent live-host proof. A committed migration != an applied migration unless production evidence proves it. Do not call the application bug-free.
