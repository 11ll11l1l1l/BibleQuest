# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after #44 Bible World functional verification.

`FEATURE_INVENTORY_V3.md` is authoritative. Live GitHub refs and executed Actions evidence supersede stale text.

## Deployment safety

- Latest frozen release: `release/v3.67-live-rooms` at `d7b9385ddc814fe0b6587e92626bf6c65aefe5b5`; exact bookkeeping verification run `34541856135` passed.
- Active branch: `feature/v3-bible-world`.
- #44 green functional candidate: `ce5d29cec689a31fa146400ec9f5f82b46b64bd7`; complete run `34542639569` passed exact-SHA architecture, edge/security, and browser/mobile regressions.
- Focused #44 run `34542469395` passed exact-SHA syntax, Bible World edge behavior, real `#/bible-world` browser behavior, mobile checks, and the existing shell regression.
- `main`, production v2, Supabase/data, and Cloudflare remain untouched.
- Product regression workflow remains `workflow_dispatch` only; temporary push triggers stay isolated and are reset after use.

## Current promoted state

| State | Count |
|---|---:|
| Regression-tested | 94 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 5 |
| Total | 100 |

Strict parity is **95/100**; regression stability is **94/100**. #43 Live Rooms is now Regression-tested because it survived the complete #44 functional gate; #44 Bible World is Verified. #15 and Kids #38–40 remain explicitly deferred. #45 Bible World artwork is the next dependency-safe capability.

## #44 verified functional boundary

#44 restores the Bible World journey map as a clean projection over the existing Adaptive Learning mastery owner. It renders nine biblical-story regions, keeps every Scripture region always accessible, marks a region explored at the recovered **60%** journey-evidence threshold, and selects the first region below 60% as the next path marker. Creation uses `min(100, Genesis × 2)` and Patriarchs uses `max(0, min(100, (Genesis − 50) × 2))`; the remaining regions project their matching Adaptive Learning category directly.

Selecting a region opens a bounded region-detail path. Read hands the recovered anchor passage to the existing Reader owner through `setBook(code, chapter)` and routes to Reader. Review routes to the existing Open Smart Review. Bible World does not own persistence, scoring, XP, streak, Bible data, or review algorithms and does not introduce a second mastery store. Percentages are learning evidence, not spiritual maturity or divine approval.

Permanent evidence: `docs/V3_BIBLE_WORLD_CONTRACT.md`, `src/app/bible-world.js`, `src/features/bible-world/index.js`, `src/ui/bible-world.css`, `src/app/bootstrap.js`, `src/features/learn/index.js`, `scripts/validate-v3-bible-world.mjs`, `tests/v3-bible-world-edge.mjs`, `tests/v3-bible-world-smoke.mjs`, `.github/workflows/v3-regression.yml`.

## Verification chronology

- Frozen v3.67 was created only after exact bookkeeping SHA `d7b9385ddc814fe0b6587e92626bf6c65aefe5b5` passed full run `34541856135`; release and product refs were verified identical before #44 branched.
- Focused exact-SHA run `34542469395` passed modified-file syntax, the recovered 60%/Genesis-split edge contract, the real 390px Bible World browser route, Reader/Open Review handoffs, and the existing shell smoke test.
- Exact functional candidate `ce5d29cec689a31fa146400ec9f5f82b46b64bd7` passed complete accumulated run `34542639569`, including every prior architecture validator, edge/security regression, and browser/mobile regression plus permanent #44 coverage.

## #45 recovered boundary

The retained artwork assets already exist in the current tree: `assets/world-locked.webp` and `assets/world-revealed.webp`. Historical behavior layered the two 16:9 images and revealed the second image according to the rounded average of the eight Adaptive Learning mastery categories while stating that Scripture itself stays available.

#45 acceptance remains separate: `correct assets; responsive layout; missing-asset fallback`. The clean implementation should reuse the current Bible World projection, compute artwork reveal from the existing Adaptive mastery profile, render the retained assets directly in the Bible World presentation, and fail to a usable non-image presentation when either asset cannot load. The old direct `localStorage`, `MutationObserver`, `window.BQMedia`, and global media injector must not return.

## Next major milestone

Create one #44 bookkeeping candidate with the promoted inventory/status/handoff/timeline. Run a fresh complete exact-SHA bookkeeping gate. On green, freeze `release/v3.68-bible-world` at that exact bookkeeping SHA, verify refs, then branch #45 Bible World artwork from the frozen release and implement/verify its retained asset, responsive, and fallback contract.

## Release rule

Never freeze an untested bookkeeping SHA. Temporary verifier commits are never release SHAs.
