# BibleQuest v3 Development Status

Updated: 2026-09-10 JST

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity ledger. Development continues under rebuild-and-verify with exact-SHA verification and one-owner boundaries.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase, production data, and production Cloudflare remain untouched.
- Latest frozen checkpoint before #83 bookkeeping: `release/v3.55-avatar-vault` at `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`.
- Active branch: `feature/v3-innovation-suite`.
- Normal v3 Actions remain `workflow_dispatch` only on product branches.
- Temporary `push:` triggers are restricted to isolated `verify/...` branches and are reset away after each run.

## Current progress after #83 functional verification

| State | Count |
|---|---:|
| Regression-tested | 82 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 17 |
| Total | 100 |

Strict implemented-or-better parity is **83/100**. Official regression stability is **82/100**.

- #82 Avatar Vault — Regression-tested after surviving #83's complete accumulated suite.
- #83 Innovation suite — Verified by exact functional candidate `daafbd442e666b9dc075c87f5f39e1999bce7adf` in run `34490525261`.
- #84 Tutorial/onboarding trainer — Not started; read-only legacy recovery is under way and no #84 product write belongs before #83 bookkeeping passes and v3.56 freezes.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred.

These values are represented by the #83 bookkeeping transaction and are not frozen until the exact bookkeeping SHA itself passes a new complete accumulated gate.

## #83 Innovation Suite — verified functional boundary

The recovered #83 contract is intentionally bounded. Personal Mission is the v3 implementation slice; Guided Study and Character Detective are already owned elsewhere, while Bible World and Church Challenges remain deferred to their inventory owners/dependencies.

Ownership:
- `src/engines/mission.js` — pure recommendation logic only.
- `src/app/mission.js` — Personal Mission lifecycle; reuses Open Review `overview()` rather than owning due/mastery state.
- `src/features/mission/index.js` — presentation only.
- `src/app/open-review.js` — remains review/due/mastery owner.
- Router retains navigation ownership; Personal Mission uses `my-mission` because `mission` is already owned by Daily Mission.

Permanent evidence:
- `INNOVATION_SUITE_V3.md`
- `scripts/validate-v3-innovation-suite.mjs`
- `tests/v3-innovation-suite-edge.mjs`
- `tests/v3-innovation-suite-smoke.mjs`
- accumulated invocation in `.github/workflows/v3-regression.yml`

Exact functional candidate `daafbd442e666b9dc075c87f5f39e1999bce7adf` passed run `34490525261`: exact-SHA checkout/assertion, complete accumulated architecture validators, complete edge/security regressions, and complete browser/mobile Playwright regressions all passed.

## Defect / root-cause ledger

- Run `34485325897`, earlier #83 candidate before the final fixes: exact SHA plus architecture/edge stages passed, but shell smoke timed out because the v3 shell did not mount. A route-ownership collision was corrected by moving Personal Mission to `my-mission`; that change alone did not clear startup.
- Candidate `f6f29370ebc7e151e3e5b447899a82dbe65ddeb7`, targeted run `34489335450`: #83 architecture/edge passed but shell mount still failed. Root cause was a real bootstrap Temporal Dead Zone: `createMissionService({openReview})` ran before lexical `const openReview` was initialized, throwing before `mountShell`.
- Candidate `daafbd442e666b9dc075c87f5f39e1999bce7adf`: initialization was reordered so the existing Open Review owner is created before Personal Mission. No owner behavior was duplicated or changed.
- Targeted exact-SHA run `34490094401` passed shell + #83 smoke after the ordering fix.
- Full exact-SHA functional run `34490525261` then passed the entire accumulated suite. Existing shell smoke permanently protects this startup regression.

## #84 read-only recovered boundary

Retained production history and `onboarding-tutorial.js` establish these requirements for the next capability:
- trainer-led multi-step onboarding with first-run completion persistence;
- Next/Back, temporary close/skip, finish, and no duplicate overlay;
- permanently reopenable tutorial launcher using force-open semantics;
- optional post-registration recovery-code step that cannot be dismissed before the user confirms saving it;
- recovery code remains private and must not be logged/tracked;
- tutorial/account setup surface remains English where the legacy contract requires it;
- actionable handoffs into actual BibleQuest destinations;
- offline/PWA availability after the app has been installed/cached;
- #85 avatar reaction visuals remain a separate inventory capability and must not be silently promoted with #84.

## Next major milestone: #84 Tutorial/onboarding trainer

1. Verify this exact #83 bookkeeping candidate with the full exact-SHA bookkeeping gate.
2. On green, freeze `release/v3.56-innovation-suite` at that exact bookkeeping SHA.
3. Create `feature/v3-tutorial-onboarding` from the frozen release.
4. Finish #84 contract recovery from retained `onboarding-tutorial.js`, `tutorial-launcher.js`, service-worker/offline wiring, account-created/recovery-code events, and retained tests.
5. Implement the smallest clean v3 owner set without legacy `window.BQ*`, direct browser storage, duplicate routing, or PWA ownership.
6. Run targeted checks, then a new complete accumulated functional gate.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase/data and production Cloudflare remain unchanged throughout the rebuild.
