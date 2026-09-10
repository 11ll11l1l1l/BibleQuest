# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-11 JST

`FEATURE_INVENTORY_V3.md` remains authoritative.

## Current completion snapshot

- 100 total; **94 Regression-tested / 1 Verified / 0 Implemented / 5 Not started**
- Strict parity **95/100**; regression stability **94/100**
- Frozen v3.67 Live Rooms: `d7b9385ddc814fe0b6587e92626bf6c65aefe5b5`, exact bookkeeping run `34541856135` green
- #44 Bible World functional candidate: `ce5d29cec689a31fa146400ec9f5f82b46b64bd7`, complete run `34542639569` green
- #44 focused run `34542469395` green
- #45 Bible World artwork follows v3.68 freeze; retained assets already confirmed in the current tree
- #15 and Kids #38–40 remain deferred

## Recent frozen release line

- v3.62 Content Review — `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c`
- v3.63 Admin Console — `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`
- v3.64 Admin Operations — `56fe2469f9c27e925b92afa9b07d7c12998bb7b7`
- v3.65 Reset/recovery — `ab3584906b3d017ea555416910f23e9414ed2ef8`
- v3.66 Same-room Play Together — `4a5f4b428d637dc5552bcd8a66d99d9c669ae4db`
- v3.67 Live Rooms — `d7b9385ddc814fe0b6587e92626bf6c65aefe5b5`
- v3.68 Bible World — pending bookkeeping gate

## Recent milestone sequence

| Capability | State | Evidence |
|---:|---|---|
| #43 Live Rooms | Regression-tested | survived #44 complete functional run `34542639569` |
| #44 Bible World | Verified | `ce5d29cec689a31fa146400ec9f5f82b46b64bd7`, focused run `34542469395`, complete run `34542639569`; bookkeeping gate pending |
| #45 Bible World artwork | Not started | retained `world-locked.webp` / `world-revealed.webp`; responsive/fallback implementation next after v3.68 freeze |

## #44 chronology

After v3.67 froze at exact bookkeeping SHA `d7b9385ddc814fe0b6587e92626bf6c65aefe5b5`, #44 branched from that immutable release. Retained Journey Path and Bible World behavior were recovered before coding: nine story regions, Scripture never permanently locked, a 60% explored-marker threshold, the first region below 60% selected as the next marker, and the Genesis split formulas for Creation and Patriarchs.

The clean implementation reuses `src/app/adaptive-learning.js` as the sole eight-category mastery/evidence owner. `src/app/bible-world.js` projects that evidence into the nine-region World model and delegates Read to the existing Reader owner and Review to the existing Open Smart Review owner. The route is exposed from Learn, uses isolated responsive CSS, and owns no persistence, scoring, XP, streak, backend access, Bible data loading, or review algorithm.

Focused exact-SHA run `34542469395` passed syntax, edge formulas/thresholds, the real 390px Bible World route, content handoffs, and shell smoke. Exact functional candidate `ce5d29cec689a31fa146400ec9f5f82b46b64bd7` then passed the complete accumulated architecture, edge/security, and browser/mobile suite in run `34542639569`. This promotes #43 to Regression-tested and #44 to Verified. The changed bookkeeping tip still requires its own complete exact-SHA gate before v3.68 freeze.

## #45 read-only recovery

Historical commit `10cc63101cedbd0e90434068b4434cbc66ac3e9c` supplied the retained artwork pair `assets/world-locked.webp` and `assets/world-revealed.webp`. Both files are already present in the current v3 tree. Historical presentation layered them in a responsive 16:9 frame, revealing the second image according to the rounded average of the eight mastery categories while explicitly keeping Scripture available.

Clean #45 will reuse those assets and the current Bible World/Adaptive owners, add responsive layered art plus explicit missing-image fallback, and avoid the old global media injector, direct localStorage, MutationObserver, and `window.BQMedia` architecture.

## Next sequence

Finish #44 promotion bookkeeping → complete exact-SHA bookkeeping gate → freeze/verify v3.68 → branch #45 from v3.68 → implement/target/full/bookkeeping verify Bible World artwork.

## Release discipline

Production and `main` stay untouched; normal CI stays manual-only and temporary push triggers remain isolated.
