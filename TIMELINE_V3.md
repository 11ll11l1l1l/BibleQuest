# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-11 JST

`FEATURE_INVENTORY_V3.md` remains authoritative.

## Current completion snapshot

- 100 total; **91 Regression-tested / 1 Verified / 0 Implemented / 8 Not started**
- Strict parity **92/100**; regression stability **91/100**
- Frozen v3.64: `56fe2469f9c27e925b92afa9b07d7c12998bb7b7`, run `34532823188`
- #94 functional: `b3c15b34da0958a136920dc970b24531e3e06e45`, full run `34534183203` green
- #42 Same-room Play Together follows v3.65 freeze.
- #15 and Kids #38–40 remain deferred.

## Recent frozen release line

- v3.62 Content Review — `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c`
- v3.63 Admin Console — `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`
- v3.64 Admin Operations — `56fe2469f9c27e925b92afa9b07d7c12998bb7b7`
- v3.65 Reset/recovery — pending bookkeeping gate

## Recent milestone sequence

| Capability | State | Evidence |
|---:|---|---|
| #93 Admin operations | Regression-tested | survived #94 full run |
| #94 Reset/recovery | Verified | `b3c15b34...`, run `34534183203` |
| #42 Same-room Play Together | Not started | next after freeze |

## #94 functional chronology

Recovered standalone `/reset`, reused #9 Account/API ownership, preserved separation from #100/#96/#93, and added permanent architecture/edge/browser coverage. The validator exposed missing #94 invocation in the accumulated workflow; wiring was corrected without runtime acceptance changes. Candidate `b3c15b34da0958a136920dc970b24531e3e06e45` then passed complete run `34534183203`. Bookkeeping now needs its own exact-SHA gate.

## #42 read-only boundary reminder

Acceptance is 2–6 players, rotating turns, scoreboard, finish. Recover retained source/history and Games ownership before coding; #43 Live Rooms stays separate.

## Next sequence

Verify #94 bookkeeping SHA → freeze v3.65 → verify refs → branch/recover #42 → implement/targeted/full verification.

## Release discipline

Production and `main` stay untouched; normal CI stays manual-only and temporary push triggers remain isolated.
