# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-11 JST

`FEATURE_INVENTORY_V3.md` remains authoritative.

## Current completion snapshot

- 100 total; **96 Regression-tested / 1 Verified / 0 Implemented / 3 Not started**
- Strict parity **97/100**; regression stability **96/100**
- Frozen v3.69 Bible World artwork: `368b4e905c94ede38e733585d151891c7bdca96b`, exact bookkeeping run `34544649744` green
- #38 Kids Memory Match functional candidate: `918762b11d3487d07880449bb37264da1e33ace3`
- #38 first full run `34546689660` failed and was root-caused; corrected complete functional run `34546962603` green
- #15 Japanese furigana and #40 Kids Bible Who Am I remain reopened
- #39 Hiragana Match remains deferred

## Recent frozen release line

- v3.62 Content Review — `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c`
- v3.63 Admin Console — `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`
- v3.64 Admin Operations — `56fe2469f9c27e925b92afa9b07d7c12998bb7b7`
- v3.65 Reset/recovery — `ab3584906b3d017ea555416910f23e9414ed2ef8`
- v3.66 Same-room Play Together — `4a5f4b428d637dc5552bcd8a66d99d9c669ae4db`
- v3.67 Live Rooms — `d7b9385ddc814fe0b6587e92626bf6c65aefe5b5`
- v3.68 Bible World — `e8753e8694eb4e7ab690829b1a497dae92776d64`, bookkeeping run `34543395077` green
- v3.69 Bible World artwork — `368b4e905c94ede38e733585d151891c7bdca96b`, bookkeeping run `34544649744` green
- v3.70 Kids Memory Match — pending bookkeeping gate

## Recent milestone sequence

| Capability | State | Evidence |
|---:|---|---|
| #45 Bible World artwork | Regression-tested | survived #38 complete functional run `34546962603` |
| #38 Kids Memory Match | Verified | `918762b11d3487d07880449bb37264da1e33ace3`; complete run `34546962603` |
| #15 Japanese furigana | Not started | priority reopened; exact old-version contract recovery required |
| #39 Hiragana Match | Not started | explicitly deferred |
| #40 Kids Bible Who Am I | Not started | priority reopened; exact old-version contract recovery required |

## #45 freeze completion

#45 bookkeeping candidate `368b4e905c94ede38e733585d151891c7bdca96b` passed complete exact-SHA bookkeeping run `34544649744`. The verifier was reset to the clean bookkeeping candidate and `release/v3.69-bible-world-artwork` was frozen at that exact SHA.

## #38 chronology

#38 branched from frozen v3.69. The retained Memory Meadow behavior was rebuilt under the existing Games owner: 6 pairs / 3 columns below 420px, 8 pairs / 4 columns at 420px and above, 350 ms match delay, 650 ms mismatch delay, board locking while resolving, unique round identity, safe replay/leave lifecycle, and deterministic stars/coins with zero XP through the existing Progress owner.

The first complete candidate `cebcea607c1219955583e800f18fa3ab0a18e9cf` passed accumulated architecture but failed edge regression in run `34546689660`. Existing Content Moderation coverage exposed an ownership/integration defect: Memory Meadow required Progress balance-state capability during Games construction even when Memory Meadow was never launched. Runtime fix `b29e1166a84f4609a818724f62afaa51ec49de25` deferred that balance read/validation until launch while retaining Progress as the sole reward owner.

The corrected exact functional candidate `918762b11d3487d07880449bb37264da1e33ace3` passed the complete accumulated architecture, edge/security, and browser/mobile suite in run `34546962603`. This promotes #45 to Regression-tested and #38 to Verified.

## Remaining completion path

After the #38 bookkeeping gate and v3.70 freeze, the active unfinished pool is #15 and #40; #39 remains deferred. Read-only contract/dependency recovery for both may occur while the bookkeeping gate runs, but implementation must branch only from the successful frozen v3.70 SHA.

## Next sequence

Create #38 bookkeeping candidate → complete exact-SHA bookkeeping gate → freeze/verify v3.70 → select dependency-safe #40 or #15 from recovered repository evidence → implement/target/full/bookkeeping verify → continue the other reopened row. Do not implement #39 unless it is explicitly reopened.

## Release discipline

Production and `main` stay untouched; normal CI stays manual-only and temporary push triggers remain isolated.