# BibleQuest v3 continuation handoff

Updated: 2026-09-12 JST after exact-green Visual Phase B Progress/Grow promotion.

## Read first

1. `DEVELOPMENT_PRIORITY_V3.md`
2. `RECONCILIATION_V3.md`
3. `DEVELOPMENT_STATUS_V3.md`
4. `VISUAL_PHASE_B_V3.md` for visual/artwork work
5. the selected feature/release-gate contract
6. `docs/V3_ICON_ASSET_MAP.md` only as a semantic guide; verify binaries before wiring
7. `CONTINUE_PROMPT_V3.md` for reusable continuation

Repository evidence and the latest explicit user instruction override stale prose.

## Current product state

- repository: `11ll11l1l1l/BibleQuest`
- current exact-green product: `2c601b3289dba891f349801219f49804f85f63cc`
- current frozen release ref: `release/v3-phase-b-progress-artwork-20260912`
- current accumulated regression run: `34633247237` — **success**
- current product PR: #110 — merged after the exact synthetic merge candidate passed
- feature head: `a51a0105228a7c3f6a9d0b35a0d74e1ef8814104`
- verified base/docs HEAD at candidate creation: `f7f79bb1195c71aa322b5458d9d299527802920b`
- parent exact-green product: `2f04b7150b36d4a14dac953fd08ae2c5a307d0d9`
- parent frozen ref: `release/v3-phase-b-account-artwork-20260912`
- parent run: `34632158164` — **success**
- previous rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

Run `34633247237` fetched and checked out exact PR #110 synthetic merge SHA `2c601b3289dba891f349801219f49804f85f63cc` as `refs/pull/110/merge`. It passed the complete accumulated architecture, edge/security/static and browser/mobile suite. Existing Progress regression plus the new Progress Phase B static and 390 px mobile acceptance passed. The exact candidate was frozen before `main` was advanced to the same SHA. Later documentation or release-gate-only commits are bookkeeping/verification changes unless product code changes and earns a new exact-green product SHA.

## Newly completed work

### Visual Phase B — Progress/Grow artwork

- PR #110 adds committed same-origin passive SVG artwork in `assets/progress-feature-icons.svg` for Progress, XP, streak, activity, chapter, growth, profile, psychometrics, avatar, achievements and locked/unlocked badge meanings;
- generic rendered `✓/○` badge artwork is replaced by badge-state-derived semantic artwork;
- `src/core/progress.js` remains the sole XP/streak/counter/reward/badge owner and was not changed;
- `src/features/progress/index.js` changes presentation markup while preserving metric data attributes and existing navigation callbacks;
- `src/ui/progress-phase-b.css` loads after the existing Progress visual-polish layer and is presentation-only;
- no XP, streak, reward, badge rule, persistence, scoring, API, Supabase or route-owner behavior changed;
- permanent static ownership/asset coverage and 390 px mobile acceptance are retained in the accumulated workflow.

### Retained exact-green Phase B checkpoints

- Account: `2f04b715...`, run `34632158164` success.
- Avatar Vault: `df2a705...`, run `34630985269` success.
- Personal Mission: `df1bbd...`, run `34629528297` success.
- Calendar: `c15d1f...`, run `34627049878` success.
- More: `046e2a85...`, run `34618963635` success.

Do not repeat these milestones.

## Release-gate reconciliation

Issue #6 contains historical acceptance wording from an older shell. Current v3 intentionally has five primary bottom-nav destinations (`Home`, `Learn`, `Play`, `Grow`, `More`), not the historical four-tab shell. Current v3 also uses the separate Bible World route rather than the older squeezed nine-node Home path. Preserve the intent of Issue #6—no zoom, no horizontal overflow, readable labels, useful touch targets, stable header/navigation, PWA/mobile behavior—while verifying the current architecture rather than reintroducing obsolete layout structure.

Issue #68 remains a real field-evidence gate: multiple real accounts/roles/devices must validate congregation, Journey Group, Cloud Team, couples, challenge and Live Room integration plus isolation/security behavior. Static/browser regressions do not substitute for that field evidence.

Issue #94 remains the final visual/integration release tracker. Do not add arbitrary visual tranches merely because it is open; select additional product work only from current evidence/investigator findings or clearly under-designed current-v3 surfaces.

## Deployment evidence

Do not transfer older provider or independent production PASS evidence to exact product `2c601b3...`.

GitHub exact-candidate regression and frozen-ref evidence are complete. Provider deployment identity for `2c601b3...` and fresh independent two-host live byte/browser verification remain separate evidence gaps until explicitly recorded.

## Supabase production state

Project: `zkfmgezvzugchcwppreq`.

The known release migrations remain **APPLIED + LIVE VERIFIED** and were untouched by PR #110:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Do not reapply them. Progress Phase B required no migration and made no production database mutation.

## Immediate next development route

Start release-hardening work from exact-green `2c601b3...` while preserving it as the product checkpoint.

1. add/execute a permanent final-candidate mobile-width acceptance gate for 320/360/390/412/430 px against the **current five-tab v3 shell**, Home/Daily Journey prominence, header fit, legibility/touch targets, no horizontal overflow and PWA/offline/install contracts;
2. reconcile Issue #6 evidence against the current architecture; do not change product structure merely to satisfy stale four-tab/nine-node wording;
3. inspect current investigator/release-firewall evidence before any further visual product changes;
4. reproduce and priority-classify any reported functionality/security/privacy/data-loss defect before modifying product behavior;
5. perform or prepare the Issue #68 multi-account field-validation matrix without weakening production security boundaries;
6. only if current evidence shows remaining material visual gaps, continue bounded Visual Phase B using real committed assets and focused regression coverage;
7. before final official release, establish one exact final candidate and run the complete architecture/static, edge/security, browser/mobile, accessibility, reduced-motion, PWA/offline/cache, visual asset/fallback, core functional, explicit-width and console/page-error cycle;
8. promote only that exact green candidate, then record provider deployment identity and independently verify both production hosts.

## Reporting

Report separately: exact-green product SHA; frozen ref; docs/validation HEAD if different; work completed; exact tests/workflows executed; provider deployment vs independent live state; Supabase state; current credible P0/P1 blockers; remaining release gates; whether production/Supabase changed.

## Non-negotiable rules

Rebuild-and-verify; one owner per responsibility; `src/core/api.js` remains the browser backend owner unless intentionally redesigned; never transfer PASS; never claim unexecuted tests; docs/validation-only commits are not product SHAs; do not weaken validators; preserve rollback; product regression remains `workflow_dispatch` + `pull_request` with no forbidden `push` trigger; GitHub promotion, provider deployment and independent live proof remain separate; do not call the app bug-free.
