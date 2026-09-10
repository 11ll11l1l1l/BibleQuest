# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after #43 Live Rooms functional verification.

Live GitHub refs and exact executed evidence are authoritative; recover them first.

## Frozen baseline

- Repo: `11ll11l1l1l/BibleQuest`.
- Latest frozen: `release/v3.66-same-room-play-together` at `4a5f4b428d637dc5552bcd8a66d99d9c669ae4db`.
- v3.66 exact bookkeeping verification run `34539753714`: **success**.
- `main`, production v2, Cloudflare, data and Supabase remain untouched.
- Normal v3 Actions are dispatch-only; temporary push triggers stay isolated and are reset after use.

## Current #43 state

- Active branch: `feature/v3-live-rooms`.
- Green functional candidate: `29db077fd134aa9b3b7044e9fda7c86306cd680d`.
- Focused run `34541198770`: **success** for exact focused candidate syntax, #43 architecture, and lifecycle edge checks.
- Complete functional run `34541326308`: **success** for exact SHA `29db077fd134aa9b3b7044e9fda7c86306cd680d` across accumulated architecture, edge/security, and browser/mobile suites.
- Promoted bookkeeping state: **93 Regression-tested / 1 Verified / 0 Implemented / 6 Not started**; strict parity **94/100**, regression stability **93/100**.
- #42 Same-room Play Together is Regression-tested; #43 Live Rooms is Verified.
- A fresh complete bookkeeping gate is still required before v3.67 freeze.

## #43 verified boundary

Live Rooms is an authenticated, congregation-backed realtime lifecycle feature. `src/app/live-rooms.js` is the single room lifecycle/state owner; `src/core/api.js` remains the only browser Supabase owner; Congregation Membership remains the membership/role authority; `src/features/live-rooms/index.js` is presentation/event forwarding only.

Recovered parity includes create, join, disconnect/reconnect, participant refresh, explicit leave cleanup, host end, ended/missing-room rejection, and no stale room state. Reconnect reloads canonical server room state, revalidates membership, idempotently rejoins the participant, replaces participant state, and resubscribes. Explicit Leave and host End clear in-memory room, participant, connection, and realtime subscription state.

The retained backend already supplies `bible_shared_sessions`, `bible_session_participants`, realtime publication, participant hardening, and Pastor create/update RLS parity. No production Supabase migration/function deployment was required or performed. Legacy Live Room game/scoring modes are adjacent functionality and were not silently folded into inventory #43.

Permanent evidence: `docs/V3_LIVE_ROOMS_CONTRACT.md`, `src/app/live-rooms.js`, `src/features/live-rooms/index.js`, `src/core/api.js`, `src/app/bootstrap.js`, `src/features/community/index.js`, `scripts/validate-v3-live-rooms.mjs`, `tests/v3-live-rooms-edge.mjs`, `tests/v3-live-rooms-smoke.mjs`, `.github/workflows/v3-regression.yml`.

## Reproduced defects and permanent handling

- During focused service testing, switching authenticated identity could retain the previous account's cached congregation memberships. Root cause: membership cache was not keyed to the authenticated user. The owner now tracks `membershipUserId` and reloads on identity change; the edge regression covers this stale-state path.
- The initial #43 architecture validator expected a bootstrap `liveRooms.disconnect` token even though route-level component teardown owns disconnect and pagehide correctly uses full `liveRooms.clear`. The validator was aligned with the actual one-owner lifecycle contract rather than adding duplicate teardown wiring.
- Candidate `29db077fd134aa9b3b7044e9fda7c86306cd680d` passed complete functional run `34541326308`.

## #44 recovered read-only boundary

Bible World is next after v3.67 freeze. Retained evidence shows nine biblical-story regions and explicitly states Scripture is never permanently locked. Journey Path marks a region explored at **60%** evidence and selects the first region below 60% as the next marker. The old World region screen routes into Read, Review, and Characters & Places. In clean v3, `src/app/adaptive-learning.js` already owns the eight-category mastery/evidence profile matching the retained category model and is the dependency-safe source to reuse rather than recreating mastery state.

Inventory #44 acceptance is `render path; unlock thresholds; route into content`. #45 Bible World artwork is separate (`correct assets; responsive layout; missing-asset fallback`) and must not be silently absorbed. #15 Japanese furigana and Kids #38–40 remain explicitly deferred.

## Exact next executable sequence

1. Finish promotion/bookkeeping files on `feature/v3-live-rooms` and establish one exact bookkeeping candidate SHA.
2. Run an isolated exact-SHA complete bookkeeping gate; do not transfer PASS from functional SHA `29db077...`.
3. On green, reset verifier to the clean bookkeeping candidate and freeze `release/v3.67-live-rooms` at that exact SHA.
4. Verify release/product refs equal the successful bookkeeping SHA.
5. Branch `feature/v3-bible-world` from frozen v3.67.
6. Reconfirm #44 ownership against Adaptive Learning/Reader/Open Review and retained World source, then implement the smallest clean #44 path without #45 artwork scope creep.

## Non-negotiable safety

Rebuild-and-verify; one owner per responsibility; no PASS transfer across changed SHAs; no production or `main` mutation without explicit authorization.
