# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST for the user-mandated 18:00 JST Cloudflare release.

## FIRST INSTRUCTION — DEADLINE OVERRIDE

Before any development work, read `RELEASE_6PM_2026-09-11.md`. It is the overriding execution priority until the production release is live. If this handoff, older milestone text, artwork plans, agent prompts, or backlog items conflict with that file, the 6 PM release-control file wins.

For new chat instances, `CONTINUE_PROMPT_V3.md` contains the generic resume prompt.

## Frozen verified baseline

- Repo: `11ll11l1l1l/BibleQuest`.
- Latest frozen verified baseline: `release/v3.71-japanese-furigana` at `c631bea8d5177a9a2ff68139cb104b6fbf26015b`.
- Exact bookkeeping run `34550650269`: **success** across accumulated architecture, edge/security, and browser/mobile suites.
- Earlier exact functional candidate `5b3891e3a2c5403c4b88087cd6d6dcbae8412b81` passed targeted run `34549872861` and complete functional run `34550018009`.
- Current release-control branch: `feature/v3-post-parity-closeout`, branched from frozen v3.71. Always recover its live HEAD before acting.

## Release scope

The current Kids game set is accepted for this release. Historical rows #39 Hiragana Match and #40 Kids Bible Who Am I are explicitly user-retired from the active v3 release scope and are not blockers. They remain optional future expansion only under `KIDS_GAMES_EXTENSION_V3.md`.

Applicable release scope is **98/98 complete**:

- Regression-tested: 97
- Verified: 1 (#15 Japanese Furigana)
- Implemented: 0
- Not started in active release scope: 0
- User-retired legacy rows: 2 (#39, #40)

Existing Kids coverage includes the shared Games page/launcher, #38 Memory Meadow / Kids Memory Match, and #36 Character Detective / Who Am I. Do not build another Kids-specific Who Am I for this release.

## Current mission

A verified BibleQuest v3 release must be available on the existing Cloudflare Pages website by **18:00 JST on 2026-09-11**.

Canonical production target: `https://mybiblequest.pages.dev/`
Compatibility target: `https://biblequest-7th.pages.dev/`

The existing Cloudflare projects deploy repository `main`. `build.sh` calls `scripts/deploy-gate.mjs`. Production promotion of the exact green release candidate is authorized by the user; do not ask again for routine permission once all release gates pass.

## What to work on now

1. Recover live release-control HEAD and current test/deployment evidence.
2. Audit Cloudflare compatibility and only real P0/P1 release blockers.
3. No new features. No retired Kids/Kana work. No broad refactors.
4. Low-risk artwork/icon/color replacement is allowed only if it cannot threaten the validation window; discretionary polish stops at 14:30 JST.
5. Run Cloudflare deployment gate plus complete accumulated exact-SHA v3 architecture, edge/security, browser/mobile, PWA/offline, and relevant accessibility checks.
6. Freeze only the exact green SHA.
7. Record final evidence.
8. Promote that verified v3 state to `main` without mixing unrelated legacy/main work.
9. Verify Cloudflare propagation and production runtime on both hosts.

## User task policy

Do everything possible through connected tools. Do not make the user repeat context or perform repository steps that can be automated. The only expected user-side task is a short physical Android/PWA smoke after deployment if available: Home, Reader, one Game, and Account/sign-in surface. If this is not performed, record it honestly; do not imply physical-device acceptance.

## Non-negotiable evidence rules

- Rebuild-and-verify; one owner per responsibility.
- Fix only reproduced release defects.
- Never transfer PASS between changed product SHAs.
- Never claim an unexecuted test.
- Never call the app bug-free.
- Normal product Actions remain manual-only; temporary push-trigger verifier workflows stay isolated.
- Do not change production Supabase/data unless a verified release blocker specifically requires it.
- A GitHub promotion is not proof Cloudflare propagated; verify the deployed site.
