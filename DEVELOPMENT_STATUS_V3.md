# BibleQuest v3 Development Status

Updated: 2026-09-11 JST for the 18:00 JST production-release deadline.

`RELEASE_6PM_2026-09-11.md` is the overriding execution priority until the release is live. `FEATURE_INVENTORY_V3.md` remains the parity ledger. `KIDS_GAMES_EXTENSION_V3.md` defines future Kids-game extension rules. `CONTINUE_PROMPT_V3.md` is the generic new-chat resume prompt.

## Current verified baseline

- Historical frozen baseline: `release/v3.71-japanese-furigana` at `c631bea8d5177a9a2ff68139cb104b6fbf26015b`.
- Historical exact v3.71 bookkeeping run `34550650269`: **success** across accumulated architecture, edge/security, and browser/mobile suites.
- Current exact production candidate and freeze: `release/v3-production-20260911` at `adb9bef5bd7751fa15d78737e94d25b183f08a53`.
- Exact release verification run `34558985204`, job `103137606678`: **success** on that exact SHA.
- Executed evidence on `adb9bef5bd7751fa15d78737e94d25b183f08a53`: clean exact-SHA/diff hygiene; Cloudflare deployment gate; 53 accumulated v3 architecture validators; 86 edge/security/static regressions; 68 Playwright browser/mobile regressions; explicit PWA/offline/accessibility/core-smoke coverage confirmation.
- The deployment gate checked JavaScript syntax across 267 files and passed the production-entry, v3 offline-shell owner/worker, Live Rooms, Transform ownership, and runtime-feature-injection guards.
- Do not call the app bug-free; this is the exact tested release state.

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

Historical #39 Hiragana Match and #40 Kids Bible Who Am I are user-retired from this release and are no longer blockers. The existing shared Games page, Memory Meadow/Kids Memory Match, Character Detective/Who Am I, Timeline, Recall and shared game infrastructure are sufficient for this release.

## 18:00 JST production objective

BibleQuest v3 must be available on the existing Cloudflare Pages production website by **18:00 JST on September 11, 2026**.

Production hosts:

- Canonical: `https://mybiblequest.pages.dev/`
- Compatibility: `https://biblequest-7th.pages.dev/`

The existing Cloudflare Pages projects deploy repository `main`. The repository Cloudflare build entrypoint is `build.sh`, which runs `scripts/deploy-gate.mjs`.

The user's deadline instruction authorizes production promotion of the exact verified v3 release candidate once all required gates are green. No additional routine approval is required at that stage.

## Active release rules

- No new features before release.
- Do not revive retired Kids/Kana rows.
- No speculative/broad refactors.
- Fix only reproduced P0/P1 release defects.
- Low-risk visual replacement/polish is allowed only while it cannot jeopardize the release; stop discretionary polish at 14:30 JST.
- After 14:30 JST, product changes are release-blocker fixes only.
- Every changed product SHA must earn exact-SHA verification.
- A GitHub merge/promotion is not proof Cloudflare propagated; production host behavior/build identity must be verified.

## Release train

1. **Preparation/blocker audit:** complete.
2. **Release fixes:** complete for reproduced blockers found by the release suite.
3. **Exact candidate validation:** complete on `adb9bef5bd7751fa15d78737e94d25b183f08a53`, run `34558985204`.
4. **Freeze:** complete at `release/v3-production-20260911`, exact SHA `adb9bef5bd7751fa15d78737e94d25b183f08a53`.
5. **Promotion:** next — preserve current legacy `main`, then move `main` to the exact verified v3 SHA without merging unrelated main-only legacy changes.
6. **Cloudflare verification:** after promotion — confirm both Pages deployments and production smoke on the canonical host.
7. **Deadline buffer:** only deployment/release blockers; prefer the verified candidate over risky late changes.

## User-required action

Minimize user involvement. The only expected user-side check, if available after Cloudflare deploys, is a short physical Android/PWA smoke:

- open `mybiblequest.pages.dev`;
- hard refresh or close/reopen installed PWA;
- confirm Home renders;
- Reader opens;
- one Game launches and returns;
- Account/sign-in surface is reachable.

A visible blank screen, permanent loader, impossible navigation/login, game launch failure, or severe mobile overflow is a release blocker. If physical-device smoke cannot be performed before 18:00, record that fact and rely only on the automated/browser and production-web checks actually executed.

## Evidence rule

Never transfer PASS across changed product SHAs. Never claim an unexecuted test. Temporary verifier commits are not release candidates. Do not modify production Supabase/data unless a reproduced blocker requires it. The exact clean SHA that passes the complete release gate is the only product state eligible for production promotion.

## Defect / root-cause ledger

- `transformation-v2.js` release-blocking template-expression syntax error was reproduced by the exact-SHA Cloudflare deployment gate and fixed at `2396aa4ef2b5166a1de83bae7b4ca72af844b7d0`.
- `scripts/deploy-gate.mjs` still validated the retired legacy `sw.js` precache model instead of the v3 `offline-shell-sw.js` runtime-warming owner/worker. The stale gate was aligned with the v3 ownership contract at `57febae5e4d2c004ace420cd27b4f80907b69ad2`.
- `scripts/validate-v3-architecture.mjs` rejected the explicitly approved `Retired from v3 release scope` status and required release-control status headings; that stale bookkeeping contract was corrected at `954af5287f1472beb923bd5bdf9313cf76f05aab`.
- `scripts/validate-v3-inventory.mjs` independently retained the old four-status/100-applicable assumption. It was aligned with 98 applicable + 2 retired at `adb9bef5bd7751fa15d78737e94d25b183f08a53`, after which the complete exact-SHA release suite passed.

## Next major milestone

Promote the frozen exact verified SHA `adb9bef5bd7751fa15d78737e94d25b183f08a53` to repository `main` without mixing unrelated legacy/main-only changes, allow both Cloudflare Pages projects to deploy, then run production verification for Home, Account/sign-in reachability, Reader, Games, Transform, navigation, and PWA/service-worker behavior.