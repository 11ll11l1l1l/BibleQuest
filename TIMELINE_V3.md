# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-11 JST

`FEATURE_INVENTORY_V3.md` remains authoritative.

## Current completion snapshot

- 100 total; **93 Regression-tested / 1 Verified / 0 Implemented / 6 Not started**
- Strict parity **94/100**; regression stability **93/100**
- Frozen v3.66 Same-room Play Together: `4a5f4b428d637dc5552bcd8a66d99d9c669ae4db`, exact bookkeeping run `34539753714` green
- #43 Live Rooms functional candidate: `29db077fd134aa9b3b7044e9fda7c86306cd680d`, complete run `34541326308` green
- #43 focused run `34541198770` green; account-switch stale-membership cache defect reproduced and permanently covered
- #44 Bible World follows v3.67 freeze; #45 artwork remains separate
- #15 and Kids #38–40 remain deferred

## Recent frozen release line

- v3.62 Content Review — `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c`
- v3.63 Admin Console — `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`
- v3.64 Admin Operations — `56fe2469f9c27e925b92afa9b07d7c12998bb7b7`
- v3.65 Reset/recovery — `ab3584906b3d017ea555416910f23e9414ed2ef8`
- v3.66 Same-room Play Together — `4a5f4b428d637dc5552bcd8a66d99d9c669ae4db`
- v3.67 Live Rooms — pending bookkeeping gate

## Recent milestone sequence

| Capability | State | Evidence |
|---:|---|---|
| #42 Same-room Play Together | Regression-tested | survived #43 complete functional run `34541326308` |
| #43 Live Rooms | Verified | `29db077fd134aa9b3b7044e9fda7c86306cd680d`, focused run `34541198770`, complete run `34541326308`; bookkeeping gate pending |
| #44 Bible World | Not started | next after v3.67 freeze; retained 60% explored-marker threshold and Read/Review/Characters & Places routing recovered read-only |
| #45 Bible World artwork | Not started | separate asset/responsive/fallback milestone |

## #43 chronology

After v3.66 froze, #43 was branched from exact release SHA `4a5f4b428d637dc5552bcd8a66d99d9c669ae4db`. Retained Live Rooms source, Supabase migrations/RLS, Congregation Membership authority, and existing API architecture were recovered before coding. The scope was kept to inventory acceptance: create/join/leave, reconnect, realtime room/participant refresh, host end, and no stale room state; legacy quiz/poll/hunt/discussion scoring was not folded in.

A clean Live Rooms lifecycle owner, route/UI, API boundary, Community entry, contract document, validator, edge regression, and browser/mobile regression were added. Focused testing reproduced a stale-account condition where congregation membership cache could survive authenticated identity changes. The service was corrected to key membership cache to the current user, and the edge regression now protects that path. The validator was also aligned with the actual teardown ownership boundary instead of requiring duplicate bootstrap disconnect wiring.

Focused exact-SHA run `34541198770` passed syntax, #43 architecture, and lifecycle edge checks. Functional candidate `29db077fd134aa9b3b7044e9fda7c86306cd680d` then passed the complete accumulated architecture, edge/security, and browser/mobile gate in run `34541326308`. This promotes #42 to Regression-tested and #43 to Verified. The changed bookkeeping tip must still pass a complete exact-SHA bookkeeping gate before v3.67 freeze.

## #44 read-only recovery

Retained Journey Path code defines nine biblical-story markers. A marker is considered explored at 60% evidence; the first marker below 60% is the next path marker. Scripture itself is explicitly never locked. Retained Bible World exposes the regions and routes each region into Read, Review, and Characters & Places. The clean Adaptive Learning owner already contains the matching eight-category mastery profile and should be reused instead of creating a second mastery store.

## Next sequence

Finish #43 bookkeeping candidate → complete exact-SHA bookkeeping gate → freeze/verify v3.67 → branch #44 from v3.67 → recover/implement/target/full verify Bible World.

## Release discipline

Production and `main` stay untouched; normal CI stays manual-only and temporary push triggers remain isolated.
