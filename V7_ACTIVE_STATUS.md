# BibleQuest V7 Active Status

Updated: 2026-10-04 JST

Phase: **P1 — shared foundation ACTIVE**. P0 scope/contracts were frozen in the integrated P0 contract change.
Development branch: `v7/development`.
Production baseline: V6 `7997d60e6069aa406ec005c32e33e46fee39bc12` on `main`.
Canonical roadmap: `DEVELOPMENT_PLAN_V7.md`.
Operational rules: `work/RULEBOOK.md`.
Deferred V8 scope: `DEVELOPMENT_PLAN_V8.md`.

## Persistent lane command

The user may issue only:

- `Continue V7 lane A`
- `Continue V7 lane B`
- `Continue V7 lane C`
- `Continue V7 lane D`

That is sufficient instruction regardless of whether V7 is currently in P0, P1, P2, P3, P4 or P5. The user does **not** need to issue a separate integration, merge, phase-advance or release-preparation command.

The executor must resolve the live phase and same-letter assignment from this file plus `DEVELOPMENT_PLAN_V7.md`. Do **not** ask the user which phase to continue and do **not** stop merely because the lane has reached an integration boundary.

## Automatic integration protocol

Integration is part of every `Continue V7 lane X` command.

### Normal lane responsibility

Every persistent lane A–D must integrate its **own completed bounded work** before stopping whenever the following are true:

1. the lane implementation/evidence is complete;
2. its affected checks are green or valid same-SHA evidence already exists;
3. the change does not require unresolved behavioral reconciliation with another lane;
4. the target remains `v7/development` and V7 has not entered a frozen release-candidate state.

A lane may not end with only `ready for integration`, `waiting for merge`, `integration needed`, or equivalent status if it can safely perform that integration itself.

Before integrating, fetch the live `v7/development` HEAD. If the integration head moved since the lane started, refresh/rebase the lane onto that live head, resolve conflicts **inside the lane's owned surface**, rerun only the checks affected by the refresh/conflict, and integrate against the refreshed head. Never force-update `v7/development` to bypass concurrent work.

After successful integration, verify the integrated commit/tree is reachable from the current `v7/development` head, then continue into the next eligible same-letter assignment when allowed by the phase gates.

### Lane A — standing integration coordinator

Lane A has an additional persistent responsibility across all V7 phases. Every `Continue V7 lane A` starts by checking whether completed work from any lane is waiting on one of these integration-only conditions:

- shared router/navigation wiring;
- shared schema/generated-contract reconciliation;
- cross-lane merge conflict that cannot be resolved entirely inside the originating lane's owned surface;
- canonical `V7_ACTIVE_STATUS.md` phase-gate reconciliation;
- phase transition after the exit gate is objectively satisfied;
- P5 exact-SHA candidate assembly, freeze and promotion preparation.

Lane A must drain those integration responsibilities first, in dependency order, before resuming its own feature/evidence assignment. This is internal work; the user does not need to say `integrate`.

When integrating another lane's completed work, Lane A must preserve that lane's intended behavior, use the live integration head, run the affected combined checks, and avoid unrelated refactors. Mechanical conflicts may be resolved directly. Behavioral conflicts must be reconciled against the accepted V7 contracts rather than choosing one implementation arbitrarily.

### Fallback when a non-A lane encounters an integration-only blocker

Lanes B–D should first integrate their own work as described above. If the only remaining blocker is a shared/cross-lane integration task reserved to Lane A, they must preserve their completed artifact and may perform safe non-overlapping next work where the roadmap permits. They must not undo or duplicate another lane's implementation.

This condition does **not** require a new user command type. The next normal `Continue V7 lane A` automatically picks up that integration duty. If the user continues B/C/D again before A, that lane should keep doing useful eligible work rather than repeatedly restating the same integration wait.

### Optimistic serialization rule

There is no permanent manual merge queue and no user-operated lock. Serialization is achieved by repository state:

1. read the live `v7/development` HEAD immediately before integration;
2. integrate only onto that head;
3. if the head changed before the write completes, refresh/rebase and retry safely;
4. never force a stale lane over the current integration head;
5. after merge, verify reachability and affected combined checks.

This preserves the rulebook's one-integration-owner-at-a-time principle without creating a separate integration chat or requiring integration commands from the user.

## Continuation loop

For any `Continue V7 lane X` command, execute this loop:

1. fetch live `v7/development` and this status;
2. resolve the current lane assignment;
3. for Lane A, first drain pending shared/cross-lane integration duties;
4. continue or finish the lane's assigned work;
5. run the smallest affected checks;
6. integrate the lane's own completed bounded work automatically;
7. reconcile the phase exit gate if applicable;
8. if the next same-letter assignment is eligible, continue directly into it;
9. repeat until the execution window ends, a genuine human/external boundary is reached, or V7 is complete.

Finishing a task, reaching a merge boundary, or completing a phase is not by itself a reason to stop.

If the requested lane's assignment in the current phase is already complete:

1. check whether its completed work is actually integrated; if not, integrate it first;
2. check whether the next same-letter assignment is eligible;
3. if eligible, continue directly into that next phase assignment in the same run;
4. if the entire current phase exit gate is already satisfied but this file has not yet advanced, reconcile the phase transition safely and continue;
5. if a real shared prerequisite is still open, do bounded non-overlapping work that helps close it or preserve the exact blocker without pretending the next phase is ready.

A lane may cross more than one completed phase in one continuation run. Finishing a phase is not, by itself, a reason to stop and wait for another user instruction.

A–D are persistent identities. P3-E is supplemental only and does not alter A–D continuation. V7 continuation stops at completed V7 and never silently enters V8.

## Persistent A–D progression

| Lane | P0 | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|---|
| **A** | Domain/data contracts | DB/RLS/generated contracts | Books MVP | Pairing + relationship security | Library UX/a11y evidence | Browser/mobile/a11y release evidence |
| **B** | UX/information architecture | Library core | Devotionals MVP | Tracks/modules/lessons authoring | ONE 2 ONE journey evidence | Backend/RLS/security release evidence |
| **C** | Security/privacy/tenancy | Discipleship core | Past Teachings MVP | Mentee lesson runner | Backend/RLS/privacy hardening | Build/PWA/offline/performance release evidence |
| **D** | Acceptance/content/provenance | Taxonomy/provenance/localization | Library discovery | Progress/reflection/prayer/action | Cross-cutting regression | Content/provenance/localization release evidence |

The live phase/eligibility gates below determine which cell is executable. The table is a durable lookup, not permission to skip prerequisites.

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

P0 exit accepted in the serialized freeze: narrowed scope, Library/ONE 2 ONE data and security contracts, eight proposed unique route keys with entry/return behavior, acceptance/provenance evidence rows, and V8 exclusions are aligned across P0-A/B/C/D. P1 changes must follow these frozen contracts.

## P0 completion record

- Integrated contract set: `docs/v7/V7_DATA_ARCHITECTURE.md`, `docs/v7/P0_B_NAVIGATION_INFORMATION_ARCHITECTURE.md`, `docs/v7/V7_SECURITY_TENANCY_CONTRACT.md`, and `docs/v7/V7_ACCEPTANCE_AND_CONTENT_CONTRACT.md`.
- V7 scope: Library plus structured ONE 2 ONE; Conversation Decks, new group realtime/chat, central Drive media pipeline/full moderation, full Ilocano rollout, bulk content, Couples expansion, recommendations beyond MVP, and unrelated redesign are V8.
- P1 begins only from this integrated contract set. Runtime routes, database schema, authorization changes, and feature evidence remain unimplemented/open.

## Planned V7 phases after P0

- **P1 — Shared foundation:** database/RLS, Library core, discipleship core, taxonomy/provenance/localization foundation. Minimum four parallel lanes; serialized integration.
- **P2 — Library MVP:** Books, Devotionals, Past Teachings and Library discovery. Four parallel lanes.
- **P3 — ONE 2 ONE MVP:** pairing/security, authoring, lesson runner, progress/private state and QR/deep-link/V6 bridges. At least four lanes; five preferred.
- **P4 — Integrated hardening:** Library UX/a11y, ONE 2 ONE journeys, backend/RLS/privacy and cross-cutting regression. Four independent evidence lanes.
- **P5 — Exact-SHA release:** four evidence lanes followed by one serialized candidate owner and production promotion.

After P1 contracts are frozen, independent P2 Library and P3 ONE 2 ONE work may overlap where ownership is genuinely disjoint. Integration onto `v7/development` remains serialized by the automatic protocol above.

## Rulebook constraints in force

- Exact starting SHA per lane.
- One concrete outcome and explicit owned/excluded surface per chat.
- Persistent lane letter across phase transitions; the executor resolves the phase automatically.
- Integration is internal to `Continue V7 lane X`; no separate user integration command is required.
- Each lane integrates its own safe bounded completed work; Lane A owns cross-lane/shared reconciliation and phase advancement.
- One owner at a time for shared schema/migrations/generated DB contracts, global router/navigation wiring, service worker/deployment configuration and canonical status edits.
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

P1 is active. P1-C's discipleship service boundary and P1-D's content foundation are integrated on `v7/development`. Lane A's additive Library/ONE 2 ONE schema, RLS coverage, generated database types/checksum, and generated-type CI comparison are integrated in commit `f35ac3aa761a158c219aa74379b2a0fc08594825`; exact head `2a1e8402aa6fa1590fb8a1d8e8a800d26968e449` passed V5/V4 disposable migration replay, V7 RLS/privilege tests, function lint, and type integrity checks. Lane A's read-only V6 reuse/schema inventory is in `docs/v7/P1_A_V6_REUSE_AND_SCHEMA_INVENTORY.md`. V6 assignments and ministry broadcasts do not satisfy pair-private messaging; keep that contract gap open. The connected Supabase project has no development branch, so no V7 DDL has been applied; validate migrations only on isolated disposable databases. Lanes B–D continue their assigned P1 foundation work. Shared schema/generated contracts remain serialized under Lane A.
## Lane A — Library lifecycle integration (2026-10-04)

Library service is now composed through the existing API repository factory. Account authentication/identity/remote-availability changes reset its state; congregation selection, membership reload and clear invalidate pending reads and cached results. Page disposal removes the session subscription. This closes Lane B’s Library reset handoff without adding a second tenant owner.

Verification: 44 V7/active-congregation tests, 10 affected V6 bootstrap/settings tests, congregation edge regression, bootstrap syntax and diff whitespace passed locally on Node 24.19.0. This is development verification, not pinned-toolchain release certification. P1 remains active: shared route wiring and the discipleship database adapter remain incomplete; P2-A is not yet eligible. No V7 DDL was applied to the connected production project.

## Lane A — Library route foundation (2026-10-04)

Learn now launches the lazy `library` route. Library item selection reaches the ratified `library-item` route with an encoded ID; return navigation restores search/type context. The shared detail foundation displays escaped published metadata, source, attribution and permitted uses, and clears its content on context reset. The router preserves query parameters without changing existing route keys. Type-specific article/book content and representative catalog publication remain P2 work.

Verification: 33 V7 tests, 4 affected V6 routing/lazy-loading tests, Learn composition regression, build, typecheck and diff whitespace passed locally on Node 24.19.0. Browser smoke was attempted but Chromium is absent; browser/visual acceptance remains UNVERIFIED. Live data acceptance remains open because production V7 DDL is not applied. P1 still needs discipleship database/route integration; do not mark P2 eligible yet.

## Lane A — ONE 2 ONE entry/read foundation (2026-10-04)

Grow now launches the lazy ratified `one-to-one` landing page through Lane C's existing service. `src/app/discipleship-pair-repository.js` supplies bounded pair list/get reads against `v7_mentor_pairs`, with explicit congregation and participant filters and authenticated-user revalidation. Existing RLS remains authority. The landing clears results and invalidates pending responses on account/congregation transitions; it provides account, congregation selection, reload and return controls. It does not expose pair-thread, curriculum or lesson actions before their adapters exist.

Verification: 43 V7 tests after refresh onto `ec84335d` and 3 affected V6 lazy/bootstrap tests passed; build, typecheck and diff whitespace passed on Node 24.19.0. Adapter queries were exercised with a thenable Supabase test double, including account mismatch, injected/malformed IDs, database errors, response scope denial and late-response suppression. Browser and live backend evidence remain UNVERIFIED; no V7 DDL or real-user mutations occurred.

P1 remains active: Lane C can compose these pair reads with its remaining curriculum/progress/private-response adapter. Global pair/track/module/lesson route wiring follows that completed adapter. Library foundations are integrated; P2-A remains gated by the shared P1 exit.
