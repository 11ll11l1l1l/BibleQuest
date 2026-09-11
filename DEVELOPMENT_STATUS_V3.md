# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after #45 Bible World artwork complete functional verification.

`FEATURE_INVENTORY_V3.md` is authoritative. Live GitHub refs and executed Actions evidence supersede stale text.

## Deployment safety

- Latest frozen release: `release/v3.68-bible-world` at `e8753e8694eb4e7ab690829b1a497dae92776d64`; exact bookkeeping verification run `34543395077` passed the complete accumulated suite.
- Active branch: `feature/v3-bible-world-artwork`.
- #45 green functional candidate: `4e0c80a9c86d5118bf2982b3b1240ae4e0899678`.
- Focused #45 run `34544046955`: **success** for exact-SHA syntax/architecture, Bible World + artwork edge behavior, focused browser/mobile behavior, fallback behavior, and shell smoke.
- Complete #45 functional run `34544135975`: **success** for exact SHA `4e0c80a9c86d5118bf2982b3b1240ae4e0899678` across the accumulated architecture, edge/security, and browser/mobile suites.
- `main`, production v2, Supabase/data, and Cloudflare remain untouched.
- Product regression workflow remains `workflow_dispatch` only; temporary push triggers stay isolated on verifier branches and are reset after use.

## Current promoted state

| State | Count |
|---|---:|
| Regression-tested | 95 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 4 |
| Total | 100 |

Strict parity is **96/100**; regression stability is **95/100**. #44 Bible World is now Regression-tested because it survived the complete #45 functional gate; #45 Bible World artwork is Verified. #15 Japanese furigana, #38 Kids Memory Match, and #40 Kids Bible Who Am I are reopened for implementation. #39 Hiragana Match remains explicitly deferred.

## #45 verified functional boundary

#45 restores the retained Bible World artwork without creating a new data or scoring owner. `src/app/bible-world.js` exposes the retained `assets/world-locked.webp` and `assets/world-revealed.webp` paths and computes artwork reveal as the rounded mean of the eight existing Adaptive Learning mastery categories: Genesis, Exodus, History, Wisdom, Prophets, Gospels, Acts, and Letters. Category evidence is clamped before averaging.

The Bible World presentation layers the two retained images in a responsive 16:9 frame and clips the revealed layer according to that projection. Scripture regions remain accessible regardless of reveal percentage. If either artwork image fails to load, the page replaces the image presentation with a usable textual fallback while preserving the region map and Reader/Open Review routes. Reduced-motion preferences remove the reveal transition. Bible World still owns no persistence, XP, streak, Bible loading, backend writes, or second mastery store.

Permanent evidence: `docs/V3_BIBLE_WORLD_ARTWORK_CONTRACT.md`, `src/app/bible-world.js`, `src/features/bible-world/index.js`, `src/ui/bible-world.css`, `scripts/validate-v3-bible-world-artwork.mjs`, `tests/v3-bible-world-artwork-edge.mjs`, `tests/v3-bible-world-artwork-smoke.mjs`, and `.github/workflows/v3-regression.yml`.

## Defect / root-cause ledger

- #44 bookkeeping initially failed because a promotion rewrite renamed the durable `Defect / root-cause ledger` heading. The corrected bookkeeping candidate `e8753e8694eb4e7ab690829b1a497dae92776d64` passed complete run `34543395077`; `release/v3.68-bible-world`, `feature/v3-bible-world`, and the reset bookkeeping verifier were then aligned to that exact clean SHA.
- #45 focused candidate `4e0c80a9c86d5118bf2982b3b1240ae4e0899678` passed run `34544046955` with no product defect found.
- The same exact #45 candidate passed complete functional run `34544135975`; no architecture, edge/security, or browser/mobile failure was observed. Temporary verifier commits are not candidates and are not release SHAs.

## Next major milestone

Create one #45 bookkeeping candidate from the promoted inventory/status/handoff/timeline, run a fresh complete exact-SHA bookkeeping gate, and on green freeze `release/v3.69-bible-world-artwork` at that exact bookkeeping SHA. Then begin the next dependency-safe reopened capability. First preference is #38 Kids Memory Match because the verified Games owner already exists; recover its exact retained contract before coding. #15 and #40 remain active reopened work, while #39 remains deferred.

## Release rule

Never freeze an untested bookkeeping SHA. Temporary verifier commits are never release SHAs.