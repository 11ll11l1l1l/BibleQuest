# BibleQuest v3 Development Status

Updated: 2026-09-11 JST for the 18:00 JST production-release deadline.

`RELEASE_6PM_2026-09-11.md` is the overriding execution priority until the release is live. `FEATURE_INVENTORY_V3.md` remains the parity ledger. `KIDS_GAMES_EXTENSION_V3.md` defines future Kids-game extension rules. `CONTINUE_PROMPT_V3.md` is the generic new-chat resume prompt.

## Current verified baseline

- Frozen verified baseline: `release/v3.71-japanese-furigana` at `c631bea8d5177a9a2ff68139cb104b6fbf26015b`.
- Exact v3.71 bookkeeping run `34550650269`: **success** across accumulated architecture, edge/security, and browser/mobile suites.
- Earlier functional candidate `5b3891e3a2c5403c4b88087cd6d6dcbae8412b81` passed targeted run `34549872861` and complete functional run `34550018009`.
- Active release-control branch: `feature/v3-post-parity-closeout`; recover live HEAD before acting.
- Frozen v3.71 has no known regression blocker in the executed evidence. Do not call it bug-free.

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

1. **Preparation/blocker audit — now:** recover live branch/evidence and verify Cloudflare compatibility.
2. **Hardening/limited polish — finish by 14:30:** only reproduced blockers and low-risk replacement-level polish.
3. **Exact candidate validation — 14:30–16:15:** Cloudflare deployment gate; complete accumulated architecture; edge/security; Playwright browser/mobile; PWA/offline; relevant accessibility; syntax/static/diff checks.
4. **Freeze/promotion — 16:15–17:00:** freeze exact green SHA, record evidence, promote verified v3 product state to `main` without mixing unrelated legacy work.
5. **Cloudflare verification — 17:00–17:40:** confirm both Pages projects and production smoke on canonical host.
6. **Deadline buffer — 17:40–18:00:** only deployment blockers; prefer the last verified candidate over risky late changes.

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
