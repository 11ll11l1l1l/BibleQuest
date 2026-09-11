# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after #45 Bible World artwork complete functional verification.

Live GitHub refs and exact executed evidence are authoritative; recover them first.

## Frozen baseline

- Repo: `11ll11l1l1l/BibleQuest`.
- Latest frozen: `release/v3.68-bible-world` at `e8753e8694eb4e7ab690829b1a497dae92776d64`.
- v3.68 exact bookkeeping verification run `34543395077`: **success**.
- `feature/v3-bible-world` and the reset #44 bookkeeping verifier were verified aligned to that exact clean SHA.
- `main`, production v2, Cloudflare, data, and Supabase remain untouched.
- Normal v3 Actions are dispatch-only; temporary push triggers stay isolated and are reset after use.

## Current #45 state

- Active branch: `feature/v3-bible-world-artwork`.
- Green functional candidate: `4e0c80a9c86d5118bf2982b3b1240ae4e0899678`.
- Focused run `34544046955`: **success** for exact-SHA syntax/architecture, Bible World and artwork edge coverage, focused browser/mobile behavior, artwork fallback, and shell smoke.
- Complete functional run `34544135975`: **success** for exact SHA `4e0c80a9c86d5118bf2982b3b1240ae4e0899678` across accumulated architecture, edge/security, and browser/mobile suites.
- Promoted state: **95 Regression-tested / 1 Verified / 0 Implemented / 4 Not started**; strict parity **96/100**, regression stability **95/100**.
- #44 Bible World is Regression-tested; #45 Bible World artwork is Verified.
- A fresh complete bookkeeping gate is still required on the bookkeeping candidate created from this promoted state before v3.69 can freeze.

## #45 verified boundary

The retained artwork pair is `assets/world-locked.webp` and `assets/world-revealed.webp`. Bible World computes the reveal percentage as the rounded average of the eight existing Adaptive Learning mastery categories after clamping malformed values. The presentation layers the retained images at 16:9 and reveals the second layer according to that percentage.

The artwork is presentation only. Every Bible World region remains accessible, Scripture is never locked, and existing Reader/Open Review handoffs remain unchanged. Any artwork load failure degrades to an explicit usable fallback without blocking the world map or content routes. Reduced-motion removes the reveal transition. No direct localStorage, `MutationObserver`, `window.BQMedia`, global media injector, persistence, XP, streak, backend write, Bible loading, or second mastery owner is introduced.

Permanent evidence: `docs/V3_BIBLE_WORLD_ARTWORK_CONTRACT.md`, `src/app/bible-world.js`, `src/features/bible-world/index.js`, `src/ui/bible-world.css`, `scripts/validate-v3-bible-world-artwork.mjs`, `tests/v3-bible-world-artwork-edge.mjs`, `tests/v3-bible-world-artwork-smoke.mjs`, `.github/workflows/v3-regression.yml`.

## Priority state after #45

The user has explicitly reopened #15 Japanese furigana, #38 Kids Memory Match, and #40 Kids Bible Who Am I for development toward 100/100. #39 Hiragana Match remains deferred and must not be silently implemented. All three reopened rows still require exact old-version contract recovery before code changes.

## Exact next executable sequence

1. Treat the bookkeeping commit containing this handoff/inventory/status/timeline as the new #45 bookkeeping candidate and recover its exact SHA from the live `feature/v3-bible-world-artwork` ref.
2. Create/reset an isolated bookkeeping verifier and run a fresh complete exact-SHA accumulated gate; do not transfer PASS from functional SHA `4e0c80a...`.
3. On green, reset the verifier to the clean bookkeeping candidate and freeze `release/v3.69-bible-world-artwork` at that exact SHA.
4. Verify release and product refs equal the successful bookkeeping SHA.
5. Branch the next capability only from frozen v3.69.
6. Prefer #38 Kids Memory Match next if repository evidence confirms it is dependency-safe under the existing Games owner; recover its retained behavior, data, timing, scoring/reward, lifecycle, and mobile contract before implementation. If #38 evidence exposes a prerequisite, choose #15 or #40 only after their own contract recovery.
7. Continue focused → complete functional → promotion/bookkeeping → complete bookkeeping → freeze, then immediately continue the next reopened row. Keep #39 deferred.

## Non-negotiable safety

Rebuild-and-verify; one owner per responsibility; no PASS transfer across changed SHAs; no production or `main` mutation without explicit authorization. Never freeze an untested SHA.