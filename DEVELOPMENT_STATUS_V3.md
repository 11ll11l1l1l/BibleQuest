# BibleQuest v3 Development Status

Updated: 2026-09-12 JST after Visual Phase B Progress/Grow promotion.

## Current release truth

- current exact-green product SHA: `2c601b3289dba891f349801219f49804f85f63cc`
- current product release ref: `release/v3-phase-b-progress-artwork-20260912`
- current accumulated verifier: run `34633247237` — **success** on exact PR #110 synthetic merge candidate `2c601b3289dba891f349801219f49804f85f63cc`
- current product PR: #110 — merged after exact-candidate accumulated verification
- parent exact-green product: Account Phase B `2f04b7150b36d4a14dac953fd08ae2c5a307d0d9`, run `34632158164` — success
- prior Avatar Vault: `df2a7051e305474a5ea24912c3f5341f33bc61b8`, run `34630985269` — success
- prior Personal Mission: `df1bbd18782bee6430546ee7b444ad4bc48f5116`, run `34629528297` — success
- prior Calendar: `c15d1fceddce537fa8a31a6b2b5c909d197b1b3e`, run `34627049878` — success
- previous production rollback/reference remains `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

Run `34633247237` explicitly fetched and checked out `2c601b3289dba891f349801219f49804f85f63cc` as `refs/pull/110/merge`. All accumulated architecture validators, edge/security/static regressions, local boot and browser/mobile regressions passed, including existing Progress regression and the new Progress Phase B static/mobile acceptance. The exact candidate was frozen before `main` advanced to it.

Later docs/validation-only commits may advance repository HEAD. They do not replace `2c601b3...` as the exact-green product checkpoint unless product code changes and earns its own full verification.

## Deployment state

No provider-deployment or independent live-host evidence has been transferred to exact product `2c601b3...`.

GitHub regression success and promotion do not prove either production hostname serves this exact product. Provider deployment identity and independent live-host verification remain separate release evidence.

## Newly completed product work

### Visual Phase B — Progress/Grow artwork

Exact-green `2c601b3...` upgrades Grow/Progress presentation without reopening progress behavior:

- adds committed same-origin passive SVG artwork for Progress, XP, streak, activity, chapter, growth, profile, psychometrics, avatar, achievements and badge states;
- replaces generic badge `✓/○` presentation with locked/unlocked artwork derived strictly from existing Progress-owner state;
- leaves `src/core/progress.js` unchanged as sole XP/streak/counter/reward/badge owner;
- preserves existing metric values/data attributes and Transformation/Profile/Psychometrics/Avatar callbacks;
- adds `src/ui/progress-phase-b.css` as a presentation-only layer after prior Progress styling;
- changes no XP, streak, star, coin, badge-unlock, event-idempotency, persistence, scoring, API, Supabase or route-owner behavior;
- adds permanent static ownership/asset coverage and 390 px mobile acceptance.

Run `34633247237` passed the complete accumulated suite with this exact candidate.

### Prior completed checkpoints retained

- Account Phase B: exact-green `2f04b715...`, run `34632158164` success.
- Avatar Vault Phase B: exact-green `df2a705...`, run `34630985269` success.
- Personal Mission Phase B: exact-green `df1bbd...`, run `34629528297` success.
- Calendar Phase B: exact-green `c15d1f...`, run `34627049878` success.
- Calendar creator edit/delete: exact-green `7d28d7c...`, run `34623059639` success.
- More Phase B: exact-green `046e2a85...`, run `34618963635` success.
- Ministry Hub Calendar: exact-green `350cb1e...`, run `34616603649` success.

Do not repeat these milestones.

## Priority-firewall note

Old PR #88 remains tied to legacy root `account.js`, not the current v3 runtime. Do not classify it as a current-v3 P0 without reproducing the behavior through current v3 owners.

Issue #6 also contains historical structural wording from an older shell. Current v3 intentionally has five primary bottom-nav destinations (`Home`, `Learn`, `Play`, `Grow`, `More`) and a separate Bible World route. Final mobile acceptance must prove the current shell at the required widths rather than regress v3 to obsolete four-tab/nine-node structure.

## Production Supabase state

Production project: `zkfmgezvzugchcwppreq`.

Known release migrations remain **APPLIED + LIVE VERIFIED** and were unchanged by PR #110:

- `20260911144939` — `assignment_response_presence`
- `20260911144950` — `calendar_events`
- `20260911145003` — `calendar_congregation_sharing`

Do not reapply them. PR #110 made no production database mutation.

## Current blockers and release gates

No newly reproduced current-v3 P0/P1 product/security/privacy/data-loss defect is recorded. Do not describe the app as bug-free.

Remaining release work is now more evidence-driven:

- Issue #94 remains the mandatory final visual/integration release tracker; accepted Phase B work is integrated through Progress/Grow, but final visual acceptance must be based on current evidence rather than automatic new tranches;
- Issue #6 requires explicit final-candidate mobile acceptance at 320/360/390/412/430 px plus PWA/mobile behavior; its stale four-tab/nine-node wording must be reconciled to the current v3 architecture;
- Issue #68 requires actual multi-account field validation across congregation/Journey Group/Cloud Team/couple/challenge/Live Room workflows and isolation boundaries;
- provider deployment identity for the exact intended final product remains required;
- fresh independent verification of both production hosts remains required.

## Correct next route

1. preserve `2c601b3...` and `release/v3-phase-b-progress-artwork-20260912` as the exact-green product checkpoint;
2. add and execute a permanent 320/360/390/412/430 release acceptance test against the current five-tab v3 shell, Home/Daily Journey, header fit, support-text legibility, touch targets, no overflow and console/page errors;
3. keep existing PWA install/offline-shell/update/cache regressions accumulated and prove them on the final exact candidate;
4. inspect current investigator/firewall evidence before selecting any further visual product change;
5. reproduce any new current-v3 functionality/security/privacy issue before modification;
6. perform or prepare Issue #68 multi-account field validation without bypassing auth/RLS or confusing static tests with field proof;
7. if evidence shows a material remaining visual gap, fix the true presentation owner and run a new exact-product accumulated regression;
8. for official release, establish one exact final candidate, run the full release cycle, deploy that exact candidate, record provider identity and independently verify both production hosts.

## Defect / root-cause ledger

- **Status-contract regression — closed.** PR #98 / run `34616114505`.
- **Invalid push-trigger hardening attempt — rejected/closed.** PR #99.
- **Ministry Hub Calendar — completed.** `350cb1e...` / run `34616603649`.
- **Visual Phase B More — completed.** `046e2a85...` / run `34618963635`.
- **Calendar creator edit/delete — completed.** `7d28d7c...` / run `34623059639`.
- **Visual Phase B Calendar — completed.** `c15d1f...` / run `34627049878`.
- **Visual Phase B Personal Mission — completed.** `df1bbd...` / run `34629528297`.
- **Visual Phase B Avatar Vault — completed.** `df2a705...` / run `34630985269`.
- **Visual Phase B Account — completed.** `2f04b715...` / run `34632158164`.
- **Visual Phase B Progress/Grow — completed.** `2c601b3...` / run `34633247237`; frozen ref created and `main` advanced to the exact tested synthetic merge candidate.
- **Legacy PR #88 stale-device overwrite — not reproduced in current v3 runtime.** Do not import without current-v3 evidence.
- **Issue #6 structural wording — partially stale.** Preserve mobile acceptance intent, not obsolete four-tab/nine-node implementation details.

## Next major milestone

Release-hardening evidence is the next major milestone: make the five required phone widths a permanent current-v3 final-candidate gate, then use investigator/current-tree evidence to decide whether any additional visual product change is truly required. In parallel, the remaining non-automatable production-readiness gate is Issue #68 multi-account field validation.

## Evidence rules

Repository evidence overrides stale prose. Docs/validation-only HEAD != product SHA. Never transfer PASS across changed product SHAs. Never claim unexecuted tests. GitHub promotion != provider deployment proof != independent live-host proof. Static regression != real multi-account field proof. A committed migration != applied migration unless production evidence proves it. Do not call the application bug-free.
