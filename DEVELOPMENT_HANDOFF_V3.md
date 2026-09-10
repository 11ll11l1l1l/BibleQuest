# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after #44 Bible World functional verification.

Live GitHub refs and exact executed evidence are authoritative; recover them first.

## Frozen baseline

- Repo: `11ll11l1l1l/BibleQuest`.
- Latest frozen: `release/v3.67-live-rooms` at `d7b9385ddc814fe0b6587e92626bf6c65aefe5b5`.
- v3.67 exact bookkeeping verification run `34541856135`: **success**.
- Release and `feature/v3-live-rooms` were verified identical to that exact SHA before #44 branched.
- `main`, production v2, Cloudflare, data and Supabase remain untouched.
- Normal v3 Actions are dispatch-only; temporary push triggers stay isolated and are reset after use.

## Current #44 state

- Active branch: `feature/v3-bible-world`.
- Green functional candidate: `ce5d29cec689a31fa146400ec9f5f82b46b64bd7`.
- Focused run `34542469395`: **success** for exact-SHA syntax, Bible World edge behavior, real browser/mobile route, Reader/Open Review handoff, and shell smoke.
- Complete functional run `34542639569`: **success** for exact SHA `ce5d29cec689a31fa146400ec9f5f82b46b64bd7` across accumulated architecture, edge/security, and browser/mobile suites.
- Promoted bookkeeping state: **94 Regression-tested / 1 Verified / 0 Implemented / 5 Not started**; strict parity **95/100**, regression stability **94/100**.
- #43 Live Rooms is Regression-tested; #44 Bible World is Verified.
- A fresh complete bookkeeping gate is still required before v3.68 freeze.

## #44 verified boundary

Bible World is a read-only orchestration/projection over the existing Adaptive Learning mastery profile. It presents nine always-accessible story regions and retains the Journey Path **60%** explored threshold. The first region below 60% is the next marker; if all regions are explored, Letters & Revelation remains the endpoint. Creation and Patriarchs split Genesis using the retained formulas, while the other seven regions directly project their matching Adaptive category.

`src/app/bible-world.js` owns only the projection and handoff contract. `src/app/adaptive-learning.js` remains the sole mastery/evidence owner; `src/app/reader.js` remains Reader state/navigation owner; `src/app/open-review.js` remains review owner. Bible World itself performs no persistence, scoring, XP, streak, backend calls, or Bible loading.

Read routes to the recovered anchor passage through Reader. Review routes to Open Smart Review. Scripture itself is never locked, and the UI states that percentages are learning evidence rather than spiritual maturity or faith scoring.

Permanent evidence: `docs/V3_BIBLE_WORLD_CONTRACT.md`, `src/app/bible-world.js`, `src/features/bible-world/index.js`, `src/ui/bible-world.css`, `src/app/bootstrap.js`, `src/features/learn/index.js`, `scripts/validate-v3-bible-world.mjs`, `tests/v3-bible-world-edge.mjs`, `tests/v3-bible-world-smoke.mjs`, `.github/workflows/v3-regression.yml`.

## #45 recovered read-only boundary

Historical commit `10cc63101cedbd0e90434068b4434cbc66ac3e9c` retained the artwork pair used for Bible World reveal. Both binaries are already present in the current tree:

- `assets/world-locked.webp` — retained locked/clouded world art.
- `assets/world-revealed.webp` — retained revealed world art.

The historical presentation layered the images at 16:9 and clipped the revealed layer according to the rounded average of the eight mastery categories: Genesis, Exodus, History, Wisdom, Prophets, Gospels, Acts, and Letters. Copy explicitly kept Scripture available while clouds cleared with learning evidence.

Inventory #45 acceptance is `correct assets; responsive layout; missing-asset fallback`. Clean #45 should extend the existing Bible World projection/presentation only. It must not resurrect the historical `quest-media.js` architecture: no direct `localStorage`, no `MutationObserver`, no `window.BQMedia`, and no global DOM injector. Missing artwork must degrade to a usable Bible World rather than block route/content access.

## Exact next executable sequence

1. Finish #44 promotion bookkeeping on `feature/v3-bible-world` and establish one exact bookkeeping candidate SHA.
2. Run an isolated exact-SHA complete bookkeeping gate; do not transfer PASS from functional SHA `ce5d29c...`.
3. On green, reset the verifier to the clean bookkeeping candidate and freeze `release/v3.68-bible-world` at that exact SHA.
4. Verify release/product refs equal the successful bookkeeping SHA.
5. Branch `feature/v3-bible-world-artwork` from frozen v3.68.
6. Implement #45 using the retained image pair, existing Adaptive mastery source, responsive layered presentation, and explicit missing-image fallback; then run focused/full/bookkeeping verification.

## Non-negotiable safety

Rebuild-and-verify; one owner per responsibility; no PASS transfer across changed SHAs; no production or `main` mutation without explicit authorization.
