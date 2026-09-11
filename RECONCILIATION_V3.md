# BibleQuest v3 — Product/Documentation Reconciliation

Status: Progress/Grow Visual Phase B exact candidate verified, frozen and promoted; final-release evidence gates remain
Updated: 2026-09-12 JST

## Current product/release truth

Current exact-green product:

- exact product: `2c601b3289dba891f349801219f49804f85f63cc`
- frozen ref: `release/v3-phase-b-progress-artwork-20260912`
- exact accumulated verifier: run `34633247237` — **success**
- product PR: #110
- verified base/docs HEAD at candidate creation: `f7f79bb1195c71aa322b5458d9d299527802920b`
- feature head: `a51a0105228a7c3f6a9d0b35a0d74e1ef8814104`

Run `34633247237` fetched `2c601b3289dba891f349801219f49804f85f63cc` directly as `refs/pull/110/merge`, checked out that SHA, and passed the complete accumulated architecture, edge/security/static and browser/mobile suite. Existing Progress browser regression plus `v3-progress-phase-b-static.mjs` and `v3-progress-phase-b-smoke.mjs` passed. The exact candidate was frozen before `main` advanced to the same SHA. No unverified product promotion commit was created.

Immediate exact-green ancestry is preserved:

- Account Phase B: `2f04b7150b36d4a14dac953fd08ae2c5a307d0d9`, run `34632158164` success;
- Avatar Vault Phase B: `df2a7051e305474a5ea24912c3f5341f33bc61b8`, run `34630985269` success;
- Personal Mission Phase B: `df1bbd18782bee6430546ee7b444ad4bc48f5116`, run `34629528297` success;
- Calendar Phase B: `c15d1fceddce537fa8a31a6b2b5c909d197b1b3e`, run `34627049878` success;
- More Phase B: `046e2a85cafe10d722d03d467d3733eddfeb6e65`, run `34618963635` success.

Later documentation or release-gate-only commits may advance repository HEAD. They are bookkeeping/verification changes unless product code changes and earns a new exact-green product SHA.

## What the current product adds

### Visual Phase B Progress/Grow — `2c601b3...`

- adds passive same-origin SVG artwork in `assets/progress-feature-icons.svg` for Progress, XP, streak, activity, chapter, growth, profile, psychometrics, avatar, achievements and badge states;
- replaces generic rendered `✓/○` badge presentation with artwork chosen strictly from the existing unlocked state;
- preserves `src/core/progress.js` as the sole XP/streak/counter/reward/badge owner;
- preserves existing metric data attributes and navigation callbacks;
- adds `src/ui/progress-phase-b.css` as presentation-only styling after existing Progress styling;
- changes no XP, streak, stars, coins, badge unlock rules, event idempotency, persistence, scoring, API, Supabase or route ownership;
- adds permanent focused static and 390 px browser acceptance inside the accumulated workflow.

## Historical/rollback truth

Historical cumulative and production verification remains ancestry/evidence only and must not be transferred to changed product SHAs.

- prior rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`
- historical independently verified production evidence applies only to the historical exact SHA it tested.

## Release-gate reconciliation

Issue #6 contains structural language from an older shell. Current v3 intentionally renders five bottom-nav routes in `src/ui/shell.js`: Home, Learn, Play, Grow, More. Current v3 also uses a separate Bible World route rather than the older Home nine-node world/path layout. Therefore final acceptance must verify the current architecture while preserving the issue's underlying mobile intent: 100% zoom, no horizontal overflow, readable text, usable touch targets, stable header/navigation, and PWA/mobile behavior.

Issue #68 remains a real multi-account field-validation gate. Its production integrations are implemented, but multiple accounts/roles/devices must still prove isolation and real workflows; static/browser unit regressions alone cannot transfer that PASS.

Issue #94 remains the release-integration/visual gate. Progress/Grow joins More, Calendar, Personal Mission, Avatar Vault and Account as accepted exact-green Phase B batches. Further visual product changes require current evidence of a material remaining gap rather than automatic tranche creation.

## Deployment evidence for current product

Do not transfer older deployment PASS to `2c601b3...`.

- exact-candidate GitHub regression: complete/green;
- frozen exact product ref: complete;
- `main` advanced to exact tested product SHA: complete;
- provider deployment identity for `2c601b3...`: not canonically recorded;
- fresh independent two-host live verification for `2c601b3...`: not canonically recorded.

## Production Supabase truth

Production project: `zkfmgezvzugchcwppreq`.

Known release migrations remain **APPLIED + LIVE VERIFIED** and were untouched by PR #110:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Do not reapply them. PR #110 made no production database mutation.

## Release-process reconciliation

Recent accepted promotion sequence:

- PR #104 Calendar Phase B → exact `c15d1f...`, run `34627049878` success;
- PR #106 Personal Mission Phase B → exact `df1bbd...`, run `34629528297` success;
- PR #108 Avatar Vault Phase B → exact `df2a705...`, run `34630985269` success;
- PR #109 Account Phase B → exact `2f04b715...`, run `34632158164` success;
- PR #110 Progress/Grow Phase B → exact `2c601b3...`, run `34633247237` success.

Accepted pattern remains: PR synthetic merge candidate → complete green accumulated run → freeze exact candidate → advance `main` to that same tested SHA when ancestry permits.

## Document authority

1. latest explicit user instruction;
2. `DEVELOPMENT_PRIORITY_V3.md` for cross-feature selection;
3. this file for product/release ancestry and integration truth;
4. handoff/status;
5. selected feature/release-gate contract;
6. exact workflow/deployment/live evidence;
7. historical release/investigator/ledger documents.

## Next safe gate

Preserve exact-green product `2c601b3...`. The next dependency-safe work is release-hardening evidence, not another automatic visual tranche:

1. make explicit 320/360/390/412/430 current-v3 mobile acceptance a permanent final-candidate gate, including Home/Daily Journey prominence, five-tab shell fit, readable support text, touch targets, no overflow and console/page-error checks;
2. keep PWA install/offline/update/cache checks accumulated and prove them on the final exact candidate;
3. inspect current investigator/firewall findings before any further product visual changes;
4. complete Issue #68 multi-account field validation without bypassing RLS/auth boundaries;
5. if a material current visual gap is demonstrated, fix it in its true presentation owner and reverify a changed exact product SHA;
6. for official release, verify one exact integrated candidate, deploy it, record provider identity, then independently prove both production hosts match it.

Do not regress v3 to stale historical structures, redo completed Phase B milestones, reapply migrations, wire absent `assets/icons/v3/` binaries, import legacy-root fixes without current-v3 reproduction, weaken tests, or transfer deployment/live PASS from another SHA.
