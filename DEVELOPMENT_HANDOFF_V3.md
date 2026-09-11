# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after fresh current-chat revalidation of the unchanged production r3 SHA and both Cloudflare production hosts.

For new chat instances, `CONTINUE_PROMPT_V3.md` remains the generic resume prompt. `RELEASE_6PM_2026-09-11.md` governed the release train; its production success condition has been satisfied.

## Fresh current-chat release evidence

- Production product SHA remains `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`; no product/runtime file, `main`, frozen release ref, Cloudflare asset, or production Supabase/data was changed in this revalidation.
- Exact release verifier run `34560522189` was rerun as **attempt 8**, job `103240333963`, and concluded **success** on the unchanged exact production SHA. Exact-SHA/diff hygiene, the Cloudflare deployment gate, accumulated architecture validators, edge/security/static regressions, Playwright browser/mobile regressions, and release-critical coverage presence all passed.
- Corrected live-host verifier run `34567697491` was rerun as **attempt 6**, job `103241236297`, and concluded **success**. It confirmed the verifier-only delta, confirmed both Cloudflare hosts still byte-match the frozen r3 product files, passed canonical corrected Offline Shell, canonical Offline Bible Packs, compatibility corrected Offline Shell, and compatibility basic-browser navigation.
- Production-live workflow run `34560806166` was rerun as **attempt 6**, job `103241788928`. Freshly passed before its known legacy test race: exact release identity, both-host release-file identity, canonical shell/Account/navigation, Reader, Games, Transform, Accessibility, and PWA install.
- That legacy workflow then failed only at its old `tests/v3-offline-shell-smoke.mjs` readiness assertion: `Offline shell cache did not reach late shell modules before offline transition.` Later steps in that legacy workflow were skipped and are not claimed from it. The corrected attempt-6 verifier above independently passed the corresponding Offline Shell/Bible Packs and compatibility gaps on the live hosts.
- No new runtime P0/P1 release defect was reproduced. The open visual-polish tracker (#94) is post-release integration scope and is not a blocker against the already-frozen r3 release.

## Exact production release

- Repo: `11ll11l1l1l/BibleQuest`.
- Production `main`: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.
- Frozen rollback/reference branch: `release/v3-production-20260911-r3` at the same SHA.
- Exact release verifier: run `34560522189`; prior attempt 7 job `103187059070` and fresh attempt 8 job `103240333963` both concluded **success** on the exact deployed product SHA.
- Exact-SHA/diff hygiene: passed.
- Cloudflare deployment gate: passed; 267 JavaScript files passed syntax and all production-entry/runtime ownership guards passed.
- Accumulated v3 architecture validators: 53 executed, all passed.
- Edge/security/static regressions: 86 executed, all passed.
- Playwright browser/mobile regressions: 68 executed, all passed.
- Release-critical browser coverage included PWA install, Offline Shell, Offline Bible Packs, Accessibility, shell/account/navigation, Reader, Games, and Transform.
- Historical baseline `release/v3.71-japanese-furigana` at `c631bea8d5177a9a2ff68139cb104b6fbf26015b` remains ancestry/reference evidence only and must not replace r3 evidence.

## Fresh release revalidation in the current release-control cycle

- The unchanged r3 product SHA `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac` was re-run through the exact release verifier rather than relying only on older PASS evidence.
- Run `34560522189`, prior attempt 7 job `103187059070` and fresh attempt 8 job `103240333963` passed exact-SHA/diff hygiene, `build.sh` / Cloudflare deployment gate, 53 accumulated architecture validators, 86 edge/security/static regressions, 68 Playwright browser/mobile regressions, and release-critical PWA/offline/accessibility/core-browser coverage. The workflow checked out the exact detached SHA `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`; no product branch was changed by either rerun.
- Production-live run `34560806166`, fresh attempt 6 job `103241788928`, re-confirmed that both Cloudflare hosts byte-match the frozen r3 release product files.
- In that same fresh attempt, the canonical host passed shell/account/navigation, Reader, Games, Transform, Accessibility, and PWA install.
- Fresh attempt 6 then failed at the legacy Offline Shell test's readiness polling race with `Offline shell cache did not reach late shell modules before offline transition`. Later workflow steps were skipped and are not claimed from that attempt.
- The readiness race was already isolated by test-only commit `952271aaf00e1a6f11280d8926b28399eebe8e4e`, changing only `tests/v3-offline-shell-smoke.mjs` relative to r3. It replaces the fragile `waitForFunction` plus immediate second cache read with bounded explicit polling and diagnostics.
- Corrected gap-closing run `34567697491` fresh **attempt 6**, job `103241236297`, completed successfully. It re-confirmed the verifier-only delta from r3, re-confirmed both Cloudflare hosts still match the frozen release product files, and passed canonical corrected Offline Shell, canonical Offline Bible Packs, compatibility corrected Offline Shell, and compatibility 390px basic-browser navigation.
- Therefore no runtime P0/P1 release defect was reproduced from the legacy workflow red result; no product SHA, `main`, release branch, Cloudflare runtime asset, or production Supabase/data change was made.
- A release-control audit also reviewed draft PR #88's legacy root `account.js` progress-sync concern. Current v3 `index.html` loads only `src/app/bootstrap.js`; the legacy root `account.js` is not a v3 production entry point, so that draft legacy path was not treated as a reproduced r3 release blocker and no product change was made.
- Current P0/P1 audit found no reproduced r3 blocker. Issue #94 remains a post-release visual integration tracker, not a production-r3 blocker.

## Production verification

Canonical host: `https://mybiblequest.pages.dev/`
Compatibility host: `https://biblequest-7th.pages.dev/`

- Both hosts serve the frozen r3 product files used for identity verification; this was re-confirmed again by corrected production verifier run `34567697491` attempt 6 / job `103241236297` and by production-live run `34560806166` attempt 6 / job `103241788928`.
- Fresh canonical browser evidence from production-live attempt 6: Home/Account/navigation, Reader, Games, Transform, Accessibility, and PWA install passed before the legacy test race interrupted that workflow.
- Fresh corrected offline evidence: canonical Offline Shell and Offline Bible Packs plus compatibility Offline Shell and basic browser navigation all passed in run `34567697491` attempt 6 / job `103241236297`.
- Exact deployed-product verification was independently rerun in run `34560522189` attempt 8 / job `103240333963` and passed the complete accumulated release suite without changing the product SHA.
- Historical same-product-SHA production-live evidence remains available, but current status should cite the fresh split evidence above rather than pretending the legacy production workflow passed steps it skipped.
- Production Supabase/data was not changed for the release or the fresh revalidation.
- No physical Android/PWA result is implied by these automated browser checks.

## Release defects fixed during final gating

1. `transformation-v2.js` template-expression syntax failure; fixed at `2396aa4ef2b5166a1de83bae7b4ca72af844b7d0`.
2. Stale deployment gate still checked legacy `sw.js` precache ownership instead of v3 `offline-shell-sw.js`; corrected at `57febae5e4d2c004ace420cd27b4f80907b69ad2`.
3. Architecture validator rejected explicitly retired rows #39/#40 and stale release bookkeeping; corrected at `954af5287f1472beb923bd5bdf9313cf76f05aab`.
4. Inventory validator retained the old 100-applicable assumption; corrected at `adb9bef5bd7751fa15d78737e94d25b183f08a53` for 98 applicable + 2 retired.
5. Production Offline Shell first-load readiness was too slow because roughly 166 shell resources were warmed sequentially under a 4-second owner timeout. Diagnostics proved the cache eventually reached 166/166 and then offline reload succeeded. r3 introduced bounded 8-way warm concurrency, waits until page load before snapshotting shell resources, and uses a 15-second bounded owner completion window. The changed product SHA `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac` then passed the complete exact-SHA suite and canonical production offline verification.
6. A separate browser-test readiness race could report a false Offline Shell failure before network cutoff. The correction is test-only at `952271aaf00e1a6f11280d8926b28399eebe8e4e`; it changes no product/runtime file and has now passed repeated fresh live checks on both hosts.

## Release scope

Applicable v3 release scope remains **98/98 complete**:

- Regression-tested: 97
- Verified: 1 (#15 Japanese Furigana)
- Implemented: 0
- Not started in active release scope: 0
- User-retired legacy rows: 2 (#39 Hiragana Match, #40 Kids Bible Who Am I)

Do not revive #39/#40 as release debt. Any future Kids expansion must be treated as new post-release scope under `KIDS_GAMES_EXTENSION_V3.md`.

## Current mission

The release mission is complete. Preserve r3 production and continue post-release development only in isolated branches.

The post-release repository has advanced beyond this release-control branch: the classified visual replacement program has been completed on isolated post-release branches, and Assignment Private Responses is exact-green in development but is not production-live because its migration has not been applied. Do not mix either post-release line into r3 release evidence or production without a separately selected exact-SHA integration/release cycle.

## What to work on now

1. Do not modify `main` or `release/v3-production-20260911-r3` merely to continue development.
2. Recover the newest post-release branch/evidence before selecting another product milestone.
3. Preserve the exact-green visual checkpoint and the exact-green Assignment Private Responses checkpoint as separate evidence until an explicit integration decision is made.
4. Do not apply the Assignment Private Responses production migration unless that production integration milestone is explicitly selected.
5. Keep new product work isolated, architecture-bounded, acceptance-defined, and exact-SHA verified.
6. Preserve layout structure, navigation, routes, responsive contracts, feature ownership, storage/data behavior, Supabase/API contracts, and accessibility semantics unless a separately justified milestone explicitly changes them.
7. Keep retired Kids/Kana work retired unless explicitly reopened as new scope under `KIDS_GAMES_EXTENSION_V3.md`.

## Non-negotiable evidence rules

- Rebuild-and-verify; one owner per responsibility.
- Preserve the frozen r3 product as rollback/reference.
- Never transfer PASS between changed product SHAs.
- Never claim an unexecuted test.
- Normal product Actions remain manual-only; temporary push-trigger verifier workflows stay isolated.
- Do not change production Supabase/data without a separately selected production integration or reproduced defect requiring it.
- A later GitHub promotion is not proof Cloudflare propagated; production identity and browser behavior must be reverified after any future release.
