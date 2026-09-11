# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST for the user-mandated 18:00 JST Cloudflare release.

## FIRST INSTRUCTION — DEADLINE OVERRIDE

Before any development work, read `RELEASE_6PM_2026-09-11.md`. It is the overriding execution priority until the production release is live. If this handoff, older milestone text, artwork plans, agent prompts, or backlog items conflict with that file, the 6 PM release-control file wins.

For new chat instances, `CONTINUE_PROMPT_V3.md` contains the generic resume prompt.

## Exact verified production candidate

- Repo: `11ll11l1l1l/BibleQuest`.
- Frozen production release branch: `release/v3-production-20260911`.
- Exact tested/frozen SHA: `adb9bef5bd7751fa15d78737e94d25b183f08a53`.
- Exact release verification run: `34558985204`, job `103137606678`, conclusion **success**.
- Exact-SHA/diff hygiene: passed.
- Cloudflare deployment gate: passed; 267 JavaScript files passed syntax and all deployment-entry/runtime ownership guards passed.
- Accumulated v3 architecture validators: 53 executed, all passed.
- Edge/security/static regressions: 86 executed, all passed.
- Playwright browser/mobile regressions: 68 executed, all passed.
- The completed browser set explicitly included `v3-pwa-install-smoke.mjs`, `v3-offline-shell-smoke.mjs`, `v3-offline-bible-packs-smoke.mjs`, `v3-accessibility-smoke.mjs`, `v3-shell-smoke.mjs`, `v3-reader-smoke.mjs`, `v3-games-smoke.mjs`, and `v3-transform-engine-smoke.mjs`.
- Historical baseline remains `release/v3.71-japanese-furigana` at `c631bea8d5177a9a2ff68139cb104b6fbf26015b`; its older run evidence must not be substituted for the current production candidate evidence.

## Release defects fixed during final gating

1. Reproduced JavaScript syntax error in `transformation-v2.js`; fixed at `2396aa4ef2b5166a1de83bae7b4ca72af844b7d0`.
2. Cloudflare deployment gate still checked retired legacy `sw.js` precache ownership instead of v3 `offline-shell-sw.js` runtime warming; gate corrected at `57febae5e4d2c004ace420cd27b4f80907b69ad2`.
3. `validate-v3-architecture.mjs` still rejected the explicitly retired rows #39/#40 and required missing release-status bookkeeping sections; corrected at `954af5287f1472beb923bd5bdf9313cf76f05aab`.
4. `validate-v3-inventory.mjs` separately retained the old four-status/100-applicable model; corrected at final green SHA `adb9bef5bd7751fa15d78737e94d25b183f08a53` to validate 98 applicable + 2 retired.

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

The existing Cloudflare projects deploy repository `main`. `build.sh` calls `scripts/deploy-gate.mjs`. Production promotion of the exact green release candidate is authorized by the user; do not ask again for routine permission.

## What to work on now

1. Do not alter the frozen product SHA `adb9bef5bd7751fa15d78737e94d25b183f08a53`.
2. Re-check live `main`; preserve its current legacy state on a safety branch.
3. Promote `main` directly to the exact frozen verified SHA without merging unrelated legacy/main-only commits into v3.
4. Allow both existing Cloudflare Pages projects to deploy repository `main`.
5. Confirm both public hosts propagated the v3 release.
6. Run production checks for Home, Account/sign-in reachability, Reader, Games, Transform, primary navigation, manifest/service-worker and PWA/offline-shell behavior.
7. Fix only a reproduced production release blocker. Any changed product SHA requires a completely new exact-SHA release suite before redeployment.

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