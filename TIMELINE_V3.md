# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-11 JST

`FEATURE_INVENTORY_V3.md` remains authoritative.

## Current completion snapshot

- 100 total; **95 Regression-tested / 1 Verified / 0 Implemented / 4 Not started**
- Strict parity **96/100**; regression stability **95/100**
- Frozen v3.68 Bible World: `e8753e8694eb4e7ab690829b1a497dae92776d64`, exact bookkeeping run `34543395077` green
- #45 Bible World artwork functional candidate: `4e0c80a9c86d5118bf2982b3b1240ae4e0899678`
- #45 focused run `34544046955` green; complete functional run `34544135975` green
- #15 Japanese furigana, #38 Kids Memory Match, and #40 Kids Bible Who Am I are reopened
- #39 Hiragana Match remains deferred

## Recent frozen release line

- v3.62 Content Review — `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c`
- v3.63 Admin Console — `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`
- v3.64 Admin Operations — `56fe2469f9c27e925b92afa9b07d7c12998bb7b7`
- v3.65 Reset/recovery — `ab3584906b3d017ea555416910f23e9414ed2ef8`
- v3.66 Same-room Play Together — `4a5f4b428d637dc5552bcd8a66d99d9c669ae4db`
- v3.67 Live Rooms — `d7b9385ddc814fe0b6587e92626bf6c65aefe5b5`
- v3.68 Bible World — `e8753e8694eb4e7ab690829b1a497dae92776d64`, bookkeeping run `34543395077` green
- v3.69 Bible World artwork — pending bookkeeping gate

## Recent milestone sequence

| Capability | State | Evidence |
|---:|---|---|
| #44 Bible World | Regression-tested | survived #45 complete functional run `34544135975` |
| #45 Bible World artwork | Verified | `4e0c80a9c86d5118bf2982b3b1240ae4e0899678`; focused run `34544046955`; complete run `34544135975` |
| #15 Japanese furigana | Not started | priority reopened; exact old-version contract recovery required |
| #38 Kids Memory Match | Not started | priority reopened; exact old-version contract recovery required |
| #39 Hiragana Match | Not started | explicitly deferred |
| #40 Kids Bible Who Am I | Not started | priority reopened; exact old-version contract recovery required |

## #44 freeze completion

The corrected #44 promotion candidate `e8753e8694eb4e7ab690829b1a497dae92776d64` restored the required durable `Defect / root-cause ledger` heading after the prior bookkeeping-only failure. Exact-SHA complete bookkeeping run `34543395077` passed the accumulated architecture, edge/security, and browser/mobile suite. The verifier was reset to the clean candidate and `release/v3.68-bible-world` was frozen at that exact SHA.

## #45 chronology

#45 branched from frozen v3.68. The retained `assets/world-locked.webp` and `assets/world-revealed.webp` pair was integrated directly into the existing Bible World presentation. The reveal percentage is the rounded mean of the eight existing Adaptive Learning mastery categories after clamping, and the images are layered in a responsive 16:9 frame. Artwork never gates a Scripture region or creates a new progression owner.

The page now degrades to a usable textual artwork fallback if either retained image fails to load, while the region map and Reader/Open Review routes remain available. Reduced-motion removes the reveal animation. The clean implementation does not resurrect direct localStorage, `MutationObserver`, `window.BQMedia`, or the old global media injector.

Focused exact-SHA run `34544046955` passed #45 syntax/architecture, edge, browser/mobile, fallback, and shell coverage. The same exact functional candidate `4e0c80a9c86d5118bf2982b3b1240ae4e0899678` then passed complete accumulated run `34544135975`. This promotes #44 to Regression-tested and #45 to Verified.

## Reopened completion path

After the #45 bookkeeping gate and v3.69 freeze, the active unfinished pool is #15, #38, and #40; #39 remains deferred. #38 is the preferred next investigation because Games lifecycle/launcher ownership is already verified, but implementation must not begin until retained source/history/tests establish the exact old Memory Match contract and confirm no missing dependency.

## Next sequence

Create #45 bookkeeping candidate → complete exact-SHA bookkeeping gate → freeze/verify v3.69 → recover #38 retained contract and dependency boundary → implement/target/full/bookkeeping verify → continue #15/#40 in dependency-safe order. Do not implement #39 unless it is explicitly reopened.

## Release discipline

Production and `main` stay untouched; normal CI stays manual-only and temporary push triggers remain isolated.