# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after fresh 14:26 JST production release r3 revalidation.

`FEATURE_INVENTORY_V3.md` remains the parity ledger. `KIDS_GAMES_EXTENSION_V3.md` defines future Kids-game extension rules. `CONTINUE_PROMPT_V3.md` is the generic new-chat resume prompt. `RELEASE_6PM_2026-09-11.md` governed the release train and its success condition is now satisfied.

## Current verified baseline

- Production `main`: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.
- Frozen production release: `release/v3-production-20260911-r3` at the same SHA.
- Exact release verification: run `34560522189`, fresh attempt 3 job `103157401585`, **success** on exact SHA `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac` at 14:26 JST.
- Exact release evidence: clean exact-SHA/diff hygiene; Cloudflare deployment gate; 53 accumulated v3 architecture validators; 86 edge/security/static regressions; 68 Playwright browser/mobile regressions; explicit PWA/offline/accessibility/core-browser coverage.
- Deployment gate: 267 JavaScript files passed syntax plus production-entry, v3 offline-shell owner/worker, Live Rooms, Transform ownership, and runtime-feature-injection guards.
- Canonical production host: `https://mybiblequest.pages.dev/`.
- Compatibility production host: `https://biblequest-7th.pages.dev/`.
- Fresh production-live verification: run `34560806166`, attempt 2 job `103157415628`, **success**. Both hosts first byte-matched the r3 release identity probes; canonical Home/Account/navigation, Reader, Games, Transform, Accessibility, PWA install, Offline Shell, and Offline Bible Packs passed; compatibility Offline Shell and 390px basic-browser navigation also passed.
- Compatibility-host explicit offline verification run `34560964242`, job `103143413769`, **success**: 166 cached shell resources were present, the v3 shell rendered offline, and `offline-shell-sw.js` remained the controller.
- Post-release test-only cleanup `952271aaf00e1a6f11280d8926b28399eebe8e4e` removed a readiness-polling race from `tests/v3-offline-shell-smoke.mjs`. Targeted live-host verification run `34561097576`, job `103143811936`, passed on both canonical and compatibility hosts. This test-only commit is not the production product SHA.
- Historical v3.71 baseline remains `release/v3.71-japanese-furigana` at `c631bea8d5177a9a2ff68139cb104b6fbf26015b` for ancestry/reference only.
- Do not call the app bug-free; this is the exact tested and deployed release state.

## Fresh release-blocker audit

- No open GitHub issue matched the current P0/P1/release-blocker audit query.
- Draft PR #88 describes an older multi-device progress overwrite risk in legacy root `account.js`. Current v3 `index.html` loads `src/app/bootstrap.js` as the production application entry point and does not load that legacy root runtime. The v3 architecture assigns account/session/storage/backend responsibilities to `src/app/account.js`, `src/app/session.js`, `src/core/storage.js`, and `src/core/api.js`.
- Therefore PR #88's legacy root `account.js` path was not accepted as a reproduced r3 release blocker. No product fix, Supabase mutation, or production change was made from that draft.
- An isolated investigation branch `fix/v3-p0-progress-sync-20260911` was created at the then-current release-control SHA for safe investigation; no product commit was made on it.

## Release scope

| State | Count |
|---|---:|
| Regression-tested | 97 |
| Verified | 1 |
| Implemented | 0 |
| Not started in active release scope | 0 |
| User-retired from v3 release scope | 2 |
| Applicable v3 release scope | 98 |
| Legacy inventory total | 100 |

Active release-scope parity is **98/98 complete**.

Historical #39 Hiragana Match and #40 Kids Bible Who Am I remain user-retired from this release and are not blockers. The shared Games page, Memory Meadow/Kids Memory Match, Character Detective/Who Am I, Timeline, Recall, and shared game infrastructure remain the accepted release set.

## Production release status

The 2026-09-11 release objective is **complete**.

- `main` points to the exact r3 product SHA `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.
- `release/v3-production-20260911-r3` preserves that exact product state.
- Both Cloudflare Pages hosts serve the r3 product files used for identity verification.
- Fresh production-live run `34560806166` attempt 2 / job `103157415628` passed the release-critical canonical browser/PWA/offline checks and the compatibility-host offline/basic-browser checks end-to-end.
- Production Supabase/data was not modified for this static release or the fresh revalidation.
- Physical Android/PWA acceptance remains supplemental unless separately recorded; automated/browser production evidence must not be described as physical-device testing.

## Post-release rules

- Preserve `release/v3-production-20260911-r3` as the rollback/reference point.
- Do not mix unrelated legacy/main-only history back into v3.
- New product changes must occur on isolated development branches, not directly on production `main`.
- Keep rebuild-and-verify: one owner per function, reproduce defects before fixes, and retain regression coverage.
- No broad architecture or navigation redesign merely for visual polish.
- Artwork/theme/icon/color/asset work should be replacement-level and compatible with the existing v3 structure, feature ownership, persistence, backend contracts, accessibility, responsive layout, and interaction flows.
- A post-release visual change that alters behavior or structure is a product change and must be treated as such, not disguised as artwork replacement.

## Evidence rule

Never transfer PASS across changed product SHAs. Never claim an unexecuted test. Temporary verifier commits are not release candidates. Do not modify production Supabase/data unless a reproduced defect requires it. Production promotion and production verification remain separate evidence gates.

## Defect / root-cause ledger

- `transformation-v2.js` release-blocking template-expression syntax error was reproduced by the exact-SHA Cloudflare deployment gate and fixed at `2396aa4ef2b5166a1de83bae7b4ca72af844b7d0`.
- `scripts/deploy-gate.mjs` validated the retired legacy `sw.js` precache model instead of the v3 `offline-shell-sw.js` runtime-warming owner/worker. The stale gate was aligned with the v3 ownership contract at `57febae5e4d2c004ace420cd27b4f80907b69ad2`.
- `scripts/validate-v3-architecture.mjs` rejected the approved `Retired from v3 release scope` state and stale release-status bookkeeping; corrected at `954af5287f1472beb923bd5bdf9313cf76f05aab`.
- `scripts/validate-v3-inventory.mjs` retained the old four-status/100-applicable assumption; aligned with 98 applicable + 2 retired at `adb9bef5bd7751fa15d78737e94d25b183f08a53`.
- Production Offline Shell first-load readiness exposed a real latency race: roughly 166 same-origin shell resources were being warmed sequentially while the owner allowed only a 4-second completion window. Production diagnostics showed the cache eventually converged to 166/166 and offline reload then worked. r3 fixed the root cause with bounded 8-way worker warm concurrency, page-load-bounded snapshot timing, and a 15-second owner completion bound; exact release SHA `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac` then passed the complete accumulated suite and canonical production offline verification.
- The compatibility-host live workflow later exposed a test readiness-polling race rather than a product failure. Explicit verification passed at 166 cached resources and successful offline reload; the test-only cleanup at `952271aaf00e1a6f11280d8926b28399eebe8e4e` passed the updated offline regression on both production hosts. Fresh live attempt 2 then passed the complete canonical + compatibility production verification workflow.

## Next major milestone

Begin the **post-release visual/artwork polish phase** from an isolated branch while preserving r3 production unchanged. First establish a written visual replacement contract and inventory of replaceable artwork/icons/colors/assets. The phase may improve polish and presentation but must preserve the current interface structure, navigation, responsive layout contracts, feature ownership, persistence, backend behavior, and accessibility. Validate each visual tranche with focused browser/mobile checks plus the accumulated regressions appropriate to the files touched before any later production promotion.
