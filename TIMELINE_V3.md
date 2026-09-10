# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-11 JST

`FEATURE_INVENTORY_V3.md` remains authoritative.

## Current completion snapshot

- 100 total; **92 Regression-tested / 1 Verified / 0 Implemented / 7 Not started**
- Strict parity **93/100**; regression stability **92/100**
- Frozen v3.65 Reset/recovery: `ab3584906b3d017ea555416910f23e9414ed2ef8`, exact bookkeeping run `34535332838` green
- #42 functional: `22d054725ba983c4fe81fbd220688a3c12ee211c`, complete run `34539110697` green
- Lifecycle audit `34539369826` found only the #42 validator's pre-promotion `Not started` pin; corrected in the bookkeeping candidate.
- #43 Live Rooms follows v3.66 freeze.
- #15 and Kids #38–40 remain deferred.

## Recent frozen release line

- v3.62 Content Review — `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c`
- v3.63 Admin Console — `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`
- v3.64 Admin Operations — `56fe2469f9c27e925b92afa9b07d7c12998bb7b7`
- v3.65 Reset/recovery — `ab3584906b3d017ea555416910f23e9414ed2ef8`
- v3.66 Same-room Play Together — pending bookkeeping gate

## Recent milestone sequence

| Capability | State | Evidence |
|---:|---|---|
| #94 Reset/recovery | Regression-tested | survived #42 complete functional run `34539110697` |
| #42 Same-room Play Together | Verified | `22d054725ba983c4fe81fbd220688a3c12ee211c`, run `34539110697`; bookkeeping gate pending |
| #43 Live Rooms | Not started | next after v3.66 freeze |

## #42 chronology

Recovered the retained same-room contract from the old group-play path and kept #43 networking separate. The first partial feature SHA exposed service methods without a reachable clean Play UI, so it was rejected. The repaired writer generated the service/UI/tests/docs from frozen v3.65, and focused architecture/edge checks passed. GitHub App workflow-write restrictions required permanent regression wiring to be committed separately through the connected GitHub writer.

Exact candidate `22d054725ba983c4fe81fbd220688a3c12ee211c` then passed complete accumulated architecture, edge, and browser/mobile run `34539110697`. Promotion-safety audit `34539369826` found only the new validator's literal `Not started` pin. The bookkeeping candidate corrects that lifecycle assertion and promotes #94→Regression-tested and #42→Verified; because the SHA changes, it requires a fresh complete gate.

## #43 read-only boundary reminder

Acceptance is create/join/leave, reconnect, and no stale room state. Recover retained source/history and ownership before coding; do not extend #42 local pass-and-play into realtime networking.

## Next sequence

Verify #42 bookkeeping SHA → freeze v3.66 → verify refs → branch/recover #43 → implement/targeted/full verification.

## Release discipline

Production and `main` stay untouched; normal CI stays manual-only and temporary push triggers remain isolated.
