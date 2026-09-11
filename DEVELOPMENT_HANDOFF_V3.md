# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after verified production release r3.

For new chat instances, `CONTINUE_PROMPT_V3.md` remains the generic resume prompt. `RELEASE_6PM_2026-09-11.md` governed the release train; its production success condition has been satisfied.

## Exact production release

- Repo: `11ll11l1l1l/BibleQuest`.
- Production `main`: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.
- Frozen rollback/reference branch: `release/v3-production-20260911-r3` at the same SHA.
- Exact release verifier: run `34560522189`, job `103142131338`, conclusion **success**.
- Exact-SHA/diff hygiene: passed.
- Cloudflare deployment gate: passed; 267 JavaScript files passed syntax and all production-entry/runtime ownership guards passed.
- Accumulated v3 architecture validators: 53 executed, all passed.
- Edge/security/static regressions: 86 executed, all passed.
- Playwright browser/mobile regressions: 68 executed, all passed.
- Release-critical browser coverage included PWA install, Offline Shell, Offline Bible Packs, Accessibility, shell/account/navigation, Reader, Games, and Transform.
- Historical baseline `release/v3.71-japanese-furigana` at `c631bea8d5177a9a2ff68139cb104b6fbf26015b` remains ancestry/reference evidence only and must not replace r3 evidence.

## Production verification

Canonical host: `https://mybiblequest.pages.dev/`
Compatibility host: `https://biblequest-7th.pages.dev/`

- Both hosts propagated the r3 product files checked by the production identity verifier.
- Canonical live verifier run `34560806166`, job `103142953274`, passed shell/account/navigation, Reader, Games, Transform, Accessibility, PWA install, Offline Shell, and Offline Bible Packs.
- Compatibility explicit offline verifier run `34560964242`, job `103143413769`, passed with 166 cached shell resources, one rendered v3 shell, mobile width contained at 390px, and `offline-shell-sw.js` controlling the page.
- Test-only readiness cleanup at `952271aaf00e1a6f11280d8926b28399eebe8e4e` was verified against both live hosts in run `34561097576`, job `103143811936`, conclusion **success**. This commit is release-control/test evidence, not the deployed product SHA.
- Production Supabase/data was not changed for the release.
- No physical Android/PWA result is implied by these automated browser checks.

## Release defects fixed during final gating

1. `transformation-v2.js` template-expression syntax failure; fixed at `2396aa4ef2b5166a1de83bae7b4ca72af844b7d0`.
2. Stale deployment gate still checked legacy `sw.js` precache ownership instead of v3 `offline-shell-sw.js`; corrected at `57febae5e4d2c004ace420cd27b4f80907b69ad2`.
3. Architecture validator rejected explicitly retired rows #39/#40 and stale release bookkeeping; corrected at `954af5287f1472beb923bd5bdf9313cf76f05aab`.
4. Inventory validator retained the old 100-applicable assumption; corrected at `adb9bef5bd7751fa15d78737e94d25b183f08a53` for 98 applicable + 2 retired.
5. Production Offline Shell first-load readiness was too slow because roughly 166 shell resources were warmed sequentially under a 4-second owner timeout. Diagnostics proved the cache eventually reached 166/166 and then offline reload succeeded. r3 introduced bounded 8-way warm concurrency, waits until page load before snapshotting shell resources, and uses a 15-second bounded owner completion window. The changed product SHA `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac` then passed the complete exact-SHA suite and canonical production offline verification.
6. A later compatibility-host workflow failure was isolated to a browser-test readiness race before network cutoff. Explicit polling verified the deployed product was healthy; `tests/v3-offline-shell-smoke.mjs` was then cleaned up test-only and passed on both production hosts.

## Release scope

Applicable v3 release scope remains **98/98 complete**:

- Regression-tested: 97
- Verified: 1 (#15 Japanese Furigana)
- Implemented: 0
- Not started in active release scope: 0
- User-retired legacy rows: 2 (#39 Hiragana Match, #40 Kids Bible Who Am I)

Do not revive #39/#40 as release debt. Any future Kids expansion must be treated as new post-release scope under `KIDS_GAMES_EXTENSION_V3.md`.

## Current mission

The release mission is complete. Preserve r3 production and begin post-release development in isolated branches.

The next authorized phase is **visual/artwork polish without interface redesign**. The goal is to make the v3 experience look more polished through replaceable artwork, icons, colors, textures, decorative assets, and theme presentation while retaining the current architecture and recognizable interface.

## What to work on now

1. Do not modify `main` or `release/v3-production-20260911-r3` while planning post-release visual work.
2. Create an isolated post-release visual-polish branch from the current release-control line.
3. Establish a written visual replacement contract before broad asset changes.
4. Inventory current visual surfaces and classify each as safely replaceable, CSS/theme-level, structural, or behavior-coupled.
5. Prioritize replacement-level polish: artwork, icons, illustrations, color tokens, backgrounds, decorative borders/textures, avatar/game imagery, and equivalent assets.
6. Preserve layout structure, navigation, routes, responsive contracts, feature ownership, storage/data behavior, Supabase/API contracts, and accessibility semantics.
7. Do not redesign screens or change information architecture merely to improve appearance.
8. For every tranche, run focused visual/mobile/browser acceptance and the accumulated regressions appropriate to touched files before considering promotion.
9. Keep visual work reversible so an asset/theme can be replaced again later without rewriting feature architecture.

## Non-negotiable evidence rules

- Rebuild-and-verify; one owner per responsibility.
- Preserve the frozen r3 product as rollback/reference.
- Never transfer PASS between changed product SHAs.
- Never claim an unexecuted test.
- Normal product Actions remain manual-only; temporary push-trigger verifier workflows stay isolated.
- Do not change production Supabase/data for visual work.
- A later GitHub promotion is not proof Cloudflare propagated; production identity and browser behavior must be reverified after any future release.
