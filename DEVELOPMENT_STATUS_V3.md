# BibleQuest v3 Development Status

Updated: 2026-09-10 JST

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity ledger. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase and production Cloudflare remain untouched.
- Development branch: `feature/v3-assignments`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary `push:` triggers are allowed only on isolated one-shot verification branches; trigger commits are never release candidates and verification branches are reset to the exact clean candidate after each run.
- Latest frozen checkpoint: `release/v3.45-congregation-recognition` at `483662cbad75ee98f0914ee66517b9eeb57f7f61`.
- Exact v3.45 bookkeeping run `34415308296` passed the complete accumulated suite against that SHA before freeze.

## Current progress

Inventory state after the complete #73 Assignments functional gate:

| State | Count |
|---|---:|
| Regression-tested | 72 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 27 |
| Total | 100 |

Strict implemented-or-better parity is **73/100**.

Official regression stability is **72/100**.

Current leading rows:
- #71 Leaderboards — Regression-tested; frozen in v3.44.
- #72 Congregation Recognition — Regression-tested after surviving the complete #73 suite; frozen in v3.45.
- #73 Assignments — Verified by corrected exact functional candidate `33871d45aec7111be95524333fe5210dceed71af` in run `34417012845`.
- #74 Advanced assignments — Not started.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred by user priority.

## Current architecture boundary

`ARCHITECTURE_V3.md` remains the detailed foundational architecture contract, but its trailing progress snapshot is historical. Current progress and post-v3.40 owner additions are authoritative in `FEATURE_INVENTORY_V3.md`, this status file, `DEVELOPMENT_HANDOFF_V3.md`, milestone contracts, and accumulated validators. The architecture narrative will be reconciled safely during the later full old-vs-new audit rather than risk truncating retained material through a full-file-only editing surface.

- `src/core/api.js` — sole browser Supabase/trusted-function/Realtime implementation boundary.
- `src/app/congregation-membership.js` — congregation membership and role capability boundary.
- `src/app/congregation-recognition.js` — sole #72 recognition owner.
- `src/app/assignments.js` — sole #73 assignment receive/open/start/complete/status-sync owner.
- `src/features/assignments/index.js` — #73 presentation/event forwarding only.
- Existing Router, Session, Reader, Progress, Lesson, Transform, Audio, Recordings, Games, Notes, Couples, Journey Group, Community, Presence, Team Center, Leaderboards and diagnostics owners remain unchanged.

## #72 Congregation Recognition — Regression-tested

- Exact functional candidate `516d2f2da33d73aea076b9cdd35225b8e68c0a27` passed run `34414579164`.
- Exact v3.45 bookkeeping candidate `483662cbad75ee98f0914ee66517b9eeb57f7f61` passed run `34415308296` and is frozen as `release/v3.45-congregation-recognition`.
- #72 survived the complete #73 functional suite and therefore advanced to Regression-tested.

## #73 Assignments — Verified

Recovered before implementation:
- legacy member-facing `assignment-center.js` lifecycle;
- live `bible_assignments` / `bible_assignment_progress` schema, RLS, grants and Realtime publication;
- authenticated retained `bq-assignment` Edge Function;
- later assignment target/schema hardening.

Verified v3 behavior:
- active RLS-visible assignments load by selected congregation;
- progress reads are explicitly restricted to the signed-in user;
- receive, open, started, completed, own submission and leader-feedback states are normalized by one application owner;
- Start/Complete mutations use only the retained authenticated `bq-assignment` function;
- browser code does not directly write assignment progress or trusted score events;
- completion preserves server idempotency and trusted award response;
- optional member submission is trimmed/bounded to 4000 characters;
- Realtime is a refresh signal only, with congregation/user-scoped subscriptions and idempotent teardown;
- ministry roles (`facilitator`, `leader`, `pastor`, `admin`) remain read-only in the #73 member surface; leader management belongs to later milestones;
- #74 Advanced assignments, #75 Assignment push workflow, #76–78 Ministry surfaces and #79 Linked activities remain outside #73;
- permanent architecture, edge and 390px browser/mobile coverage is accumulated in the normal workflow.

Functional verification evidence:
- Initial exact candidate `502e9fd86b96415d379d65295ba76ec3f117f9fd`, run `34416898681`: all architecture validators and all earlier edge regressions passed, then the new #73 edge fixture failed before browser execution.
- Root cause `V3-ASSIGNMENTS-EDGE-FIXTURE-001`: the fake API filtered a deliberately foreign-congregation test row before the owner could receive it, so the test expected a rejection from data it never delivered. This was a test-only fixture defect, not an application defect.
- Corrected exact candidate `33871d45aec7111be95524333fe5210dceed71af` passed the complete accumulated architecture, edge and Playwright/browser-mobile suite in run `34417012845`.
- The isolated functional verification branch was reset to that exact clean candidate after success.

## Next major milestone

1. Run the exact clean #73 promotion/bookkeeping candidate through the complete accumulated architecture, edge and browser/mobile suite on an isolated one-shot verification branch.
2. If green, reset the bookkeeping verification branch to the exact clean candidate and freeze `release/v3.46-assignments` at the same SHA.
3. Only after v3.46 is frozen, create `feature/v3-advanced-assignments` and recover #74 advanced-field/due-state/completion/permission contracts before implementation.
4. Keep #75 Assignment push and #79 Linked activities separate until their own milestones.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase and production Cloudflare remain unchanged throughout the rebuild.
