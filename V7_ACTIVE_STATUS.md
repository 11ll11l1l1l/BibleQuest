# BibleQuest V7 Active Status

Updated: 2026-10-04 JST

Phase: **P0 — scope freeze and contracts ACTIVE**.
Development branch: `v7/development`.
Production baseline: V6 `7997d60e6069aa406ec005c32e33e46fee39bc12` on `main`.
Canonical roadmap: `DEVELOPMENT_PLAN_V7.md`.
Operational rules: `work/RULEBOOK.md`.
Deferred V8 scope: `DEVELOPMENT_PLAN_V8.md`.

## Current V7 objective

**BibleQuest V7 = Library + structured ONE 2 ONE discipleship.**

The previous full-product-overhaul V7 plan is retired. V7 no longer includes Conversation Deck/realtime groups, central Drive/media pipeline, full media moderation, full Ilocano rollout, bulk content ingestion, Couples expansion or another whole-app visual overhaul. Those goals are explicitly deferred to V8.

`docs/v7/V7_FREE_MEDIA_FILE_STORAGE.md` is historical planning input only and is not an active V7 requirement.

## P0 parallel lanes

Four independent Phase-0 chat lanes are authorized. Each lane must use the live `v7/development` head at task start, stay inside its owned contract surface and hand off durable output for serialized integration.

### P0-A — Domain and data contracts

Own Library entities/relationships, content taxonomy/data requirements, ONE 2 ONE relationship/curriculum/progress contracts and minimum media-reference interfaces.

Excludes central Drive/media storage, realtime groups and V8 implementation.

### P0-B — UX and information architecture

Own Library journeys/routes, Books/Devotionals/Past Teachings browse/detail flows, mentor/mentee journeys, lesson sequence and mobile-first route/surface map.

Excludes unrelated V6 product redesign.

### P0-C — Security, privacy and tenancy

Own mentor/mentee and author/leader permission matrix, congregation scoping, reflection/progress privacy and protected deep-link/session requirements.

Preserve existing V6 backend authority, RLS and tenant isolation.

### P0-D — Acceptance, content and provenance

Own V7 acceptance/evidence matrix, source/license/provenance requirements, representative content policy, i18n readiness and the V8 non-goal transfer manifest.

## P0 exit gate

Phase 0 is complete only when:

- V7 scope and V8 deferrals are unambiguous;
- shared domain/data/security contracts are agreed;
- route/user-journey contracts are agreed;
- acceptance/evidence requirements exist before implementation;
- no V7 feature depends on an undefined V8 realtime/media/Ilocano-rollout system.

Do not mark P0 complete merely because four documents or plans exist. Integrate/reconcile conflicting contracts once, then record the accepted outcome here.

## Planned V7 phases after P0

- **P1 — Shared foundation:** database/RLS, Library core, discipleship core, taxonomy/provenance/localization foundation. Minimum four parallel lanes; serialized integration.
- **P2 — Library MVP:** Books, Devotionals, Past Teachings and Library discovery. Four parallel lanes.
- **P3 — ONE 2 ONE MVP:** pairing/security, authoring, lesson runner, progress/private state and QR/deep-link/V6 bridges. At least four lanes; five preferred.
- **P4 — Integrated hardening:** Library UX/a11y, ONE 2 ONE journeys, backend/RLS/privacy and cross-cutting regression. Four independent evidence lanes.
- **P5 — Exact-SHA release:** four evidence lanes followed by one serialized candidate owner and production promotion.

After P1 contracts are frozen, independent P2 Library and P3 ONE 2 ONE work may overlap where ownership is genuinely disjoint. Integration onto `v7/development` remains serialized.

## Rulebook constraints in force

- Exact starting SHA per lane.
- One concrete outcome and explicit owned/excluded surface per chat.
- One owner for shared schema/migrations/generated DB contracts, global router/navigation wiring, service worker/deployment configuration and canonical status edits.
- No broad historical repository audit at task start.
- No unrelated refactors or V8 scope creep.
- Targeted affected checks during implementation; accumulated checks at integration/release boundaries.
- Refresh a task branch from live integration before merge; stale green CI is not current integration evidence.
- Static/browser/backend/device evidence remain distinct; unperformed evidence stays OPEN/UNVERIFIED.
- Existing V6 evidence is inherited unless V7 changes its inputs or reveals an actual regression.

## Repository baseline and cleanup

Repository preparation is complete. The V1–V6 lessons are consolidated in `work/RULEBOOK.md` and `work/LESSONS_LEARNED.md`. Runtime, tests, deployment workflows, migrations, released V6 build configuration and rollback evidence remain preserved.

The V6 owner-waived physical acceptance rows remain recorded in the original V6 acceptance authority; V7 does not rewrite them as PASS.

## Immediate next action

Complete and reconcile P0-A/P0-B/P0-C/P0-D against the narrowed roadmap. Then freeze the accepted Phase-0 contracts and dispatch P1-A through P1-D from one exact integration SHA.
