# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after production release r3 verification.

`FEATURE_INVENTORY_V3.md` remains the parity ledger. `KIDS_GAMES_EXTENSION_V3.md` defines future Kids-game extension rules. `CONTINUE_PROMPT_V3.md` is the generic new-chat resume prompt. `RELEASE_6PM_2026-09-11.md` governed the release train and its success condition is now satisfied.

## Current verified baseline

- Production `main`: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.
- Frozen production release: `release/v3-production-20260911-r3` at the same SHA.
- Exact release verification: run `34560522189`, job `103142131338`, **success** on exact SHA `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.
- Exact release evidence: clean exact-SHA/diff hygiene; Cloudflare deployment gate; 53 accumulated v3 architecture validators; 86 edge/security/static regressions; 68 Playwright browser/mobile regressions; explicit PWA/offline/accessibility/core-browser coverage.
- Deployment gate: 267 JavaScript files passed syntax plus production-entry, v3 offline-shell owner/worker, Live Rooms, Transform ownership, and runtime-feature-injection guards.
- Canonical production host: `https://mybiblequest.pages.dev/`.
- Compatibility production host: `https://biblequest-7th.pages.dev/`.
- Both hosts propagated files byte-identical to r3 for the release-identity probes used by the production verifier.
- Canonical live verification run `34560806166`, job `103142953274`, passed Home/Account/navigation, Reader, Games, Transform, Accessibility, PWA install, Offline Shell, and Offline Bible Packs on the deployed r3 product.
- Compatibility-host explicit offline verification run `34560964242`, job `103143413769`, **success**: 166 cached shell resources were present, the v3 shell rendered offline, and `offline-shell-sw.js` remained the controller.
- Post-release test-only cleanup `952271aaf00e1a6f11280d8926b28399eebe8e4e` removed a readiness-polling race from `tests/v3-offline-shell-smoke.mjs`. Targeted live-host verification run `34561097576`, job `103143811936`, passed on both canonical and compatibility hosts. This test-only commit is not the production product SHA.
- Historical v3.71 baseline remains `release/v3.71-japanese-furigana` at `c631bea8d5177a9a2ff68139cb104b6fbf26015b` for ancestry/reference only.
- Do not call the app bug-free; this is the exact tested and deployed release state.

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
- The canonical host passed the release-critical live browser/PWA/offline checks.
- The compatibility host passed an explicit full-cache readiness + offline reload verification.
- Production Supabase/data was not modified for this static release.
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
- The compatibility-host live workflow later exposed a test readiness-polling race rather than a product failure. Explicit verification passed at 166 cached resources and successful offline reload; the test-only cleanup at `952271aaf00e1a6f11280d8926b28399eebe8e4e` passed the updated offline regression on both production hosts.

## Next major milestone

Begin the **post-release visual/artwork polish phase** from an isolated branch while preserving r3 production unchanged. First establish a written visual replacement contract and inventory of replaceable artwork/icons/colors/assets. The phase may improve polish and presentation but must preserve the current interface structure, navigation, responsive layout contracts, feature ownership, persistence, backend behavior, and accessibility. Validate each visual tranche with focused browser/mobile checks plus the accumulated regressions appropriate to the files touched before any later production promotion.
