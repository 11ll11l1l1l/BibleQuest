# BibleQuest V6 Development Plan

Updated: 2026-09-13 JST
Authority: `V6_ACTIVE_STATUS.md`
Integration branch: `v6/architecture-upgrade`
Starting baseline: **TBD — exact accepted V5 production SHA after V5 Phase 8**
Depends on: completed/certified V5 feature-completion release

## 1. V6 line in the sand

V5 finishes the product on the current architecture. **V6 replaces and strengthens the engine underneath that completed product.**

V6 is allowed to change build tooling, module boundaries, state ownership, app shell/router ownership, data/repository boundaries, database test infrastructure, service-worker/storage architecture, media ownership, notification delivery infrastructure, security/test tooling and feature internals.

V6 is not allowed to use architecture work as an excuse to re-open feature-completion scope. Leader Center, Admin Console completion, artwork cleanup, minimum push, baseline offline reading, active-congregation switching and the named V5 verification debt must already be complete when V6 begins.

The V5 production behavior/data/security contract is the V6 parity baseline unless an explicit V6 ADR deliberately supersedes it.

## 2. What the V6 engine means

The V6 engine is the reusable technical platform that V7 will later use for the full overhaul:

- deterministic build and deployment pipeline;
- typed app kernel and route/domain boundaries;
- real executable database/security test platform;
- explicit session/tenant/data ownership;
- component and design-token primitives;
- structured Reader/content/offline engine;
- deterministic Games engine;
- modern media session engine;
- notification/push/background-sync engine;
- observability, error taxonomy and performance budgets;
- motion/sound registry/preferences/unlock/accessibility infrastructure.

V6 should prove these systems on representative surfaces, but **not redesign every page**. V7 owns the full product overhaul.

## 3. Handoff from V5

Phase 0 cannot start until V5 Phase 8 closes.

Required V5 handoff evidence:

1. exact accepted V5 production SHA;
2. final `V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` status;
3. full accumulated V5 regression/security/browser/PWA evidence;
4. V4 and V5 rollback refs;
5. explicit known limitations that are architecture debt rather than unfinished features.

The V6 branch must be rebased/recreated from that V5 production SHA. The old V4 cleanup SHA is historical only and is not a valid V6 runtime baseline.

## 4. Execution model

V6 uses one serialized integration stream, even if multiple specialists investigate or prepare non-overlapping work.

For each architecture tranche:

1. write/accept an ADR when ownership or a durable contract changes;
2. add characterization/parity tests for the V5 behavior being migrated;
3. introduce the new engine boundary alongside the old owner where necessary;
4. migrate bounded slices;
5. run old/new parity and security evidence;
6. remove the old owner only after no live route depends on it;
7. update `V6_ACTIVE_STATUS.md` and the V6 checklist with exact evidence.

No valid security/privacy/behavior test may be removed merely to obtain green status.

---

# Phase 0 — V5 handoff, baseline, architecture authority

## Work

- Record the exact accepted V5 production SHA as V6 baseline.
- Rebase/create `v6/architecture-upgrade` from that SHA.
- Re-run inherited V5 regression/security/browser/PWA gates on the exact V6 baseline.
- Confirm ADR process under `docs/v6/adr/`.
- Accept ADR-0001 (build/client architecture) and ADR-0002 (real Supabase/Postgres CI) before dependent implementation.
- Produce a route/domain ownership map for shell/router/session, Reader, Games, media, notifications, ministry/admin, congregation/tenant, assignments, linked activities and offline/PWA.

## Exit gate

Exact V5 baseline is frozen, inherited evidence is green and the first engine ADRs are accepted.

---

# Phase 1 — Build engine

## Goal

Replace the hand-wired browser-script ceiling with a deterministic modern build without changing product behavior merely for migration.

## Required outcomes

- `package.json`, lockfile and pinned Node version;
- Vite dev/build pipeline;
- incremental TypeScript with `allowJs`/compatibility only as needed;
- deterministic `dist/` and embedded exact build identity;
- source maps suitable for privacy-safe diagnostics;
- CSS/assets/image pipeline;
- route/domain code splitting where useful;
- lint/format/typecheck/unit-test commands;
- bundle/chunk/image budgets after first production-equivalent build;
- preserved deep links, auth startup, PWA install and critical V5 routes.

## Exit gate

A Vite-built app matches the accepted V5 route/critical-flow matrix on one exact SHA.

---

# Phase 2 — Database verification engine

## Goal

Turn database authorization from largely static inspection into executable proof.

## Required outcomes

- checked-in reproducible local Supabase configuration;
- ephemeral Postgres/Supabase CI;
- clean migration replay from zero;
- migration order/idempotence/drift checks;
- deterministic fixtures with two congregations, multi-membership and meaningful role/account combinations;
- executable RLS allow/deny matrix;
- real `SECURITY DEFINER` / invoker function tests under realistic caller roles;
- grant/revoke and search-path assertions;
- generated TypeScript DB types with drift failure;
- static SQL checks retained as fast guards, not sole evidence.

## Exit gate

CI can rebuild the DB from zero and prove critical privacy/tenant cases without production credentials.

---

# Phase 3 — Application kernel: shell, state, data, tenant

## Goal

Create the shared engine that V7 can build on without re-solving cross-cutting concerns per page.

## Required outcomes

- typed app shell/router contract;
- typed session/auth context;
- explicit active-congregation context separate from identity;
- centralized repository/data interfaces over Supabase/remote APIs;
- domain services independent of rendered DOM;
- standard async states and stale-request cancellation;
- shared safe error taxonomy/mapping;
- route-level lazy loading;
- explicit event/command boundaries between features;
- state owned at narrow durable scope, not one giant global store.

## Exit gate

At least one low-risk V5 feature is migrated end-to-end through the new kernel with parity evidence.

---

# Phase 4 — Reader/content/offline engine

V5 already provides baseline offline re-open behavior. V6 replaces that minimum with a real content engine.

## Required outcomes

- decompose Reader controller, content provider, navigation state, search, verse/context helpers, Japanese pipelines, progress command owner and external/licensed adapters;
- versioned Scripture manifests with checksums/version/license metadata;
- deliberate book/full-translation downloads where licensing permits;
- IndexedDB/Cache Storage chosen by content shape;
- storage usage/update/remove/recovery controls;
- offline reading position and supported local search;
- explicit unavailable state for live/licensed translations offline;
- independently versioned app/service-worker/content migrations.

## Exit gate

Installed app can launch offline, read downloaded supported content, navigate and recover after close/reopen without corrupting state.

---

# Phase 5 — Games engine

V5 artwork completion is the visual baseline. V6 removes the monolithic game runtime.

## Required outcomes

- game registry and metadata contract;
- deterministic session/action/scoring/timer/result contracts;
- persistence and accessibility adapters;
- local pass-and-play adapter and future remote/team seam;
- game logic testable without DOM;
- component/view module per game family;
- shared launcher/question/feedback/result/score primitives;
- no duplicated scoring logic across play modes.

## Exit gate

Existing games have parity/browser coverage and representative engines replay deterministically in unit tests.

---

# Phase 6 — Media engine

## Required outcomes

- provider adapters (YouTube/native media as applicable);
- official provider APIs rather than raw command guessing;
- multiple registered media instances with explicit audible-session policy;
- central lifecycle/state events;
- queue/playlist/resume support;
- PiP where supported;
- route/background teardown/resource limits;
- accessibility/media-control semantics;
- server-authoritative curation permissions.

## Exit gate

Provider init/switch/pause/queue/resume/teardown/route-change failure cases are browser-tested.

---

# Phase 7 — Notification, push and background-sync engine

V5 already has minimum real push. V6 turns it into a durable platform.

## Required outcomes

- robust authenticated device subscription lifecycle;
- category preference model and invalid subscription cleanup;
- service-worker delivery/click/deep-link handling;
- idempotency/dedup/rate controls;
- operational delivery metadata without sensitive payload logging;
- in-app inbox remains durable source of truth;
- versioned IndexedDB outbox for carefully selected user-owned safe writes;
- explicit retry/conflict/idempotency rules;
- privileged destructive/admin/auth actions never queued offline.

## Exit gate

Push and safe offline writes survive reload/network recovery predictably while privileged actions remain live-authorized.

---

# Phase 8 — Ministry/admin migration to the engine

V5 already has a working Leader Center and completed Admin Console. V6 migrates them onto the new kernel and typed data/security boundaries.

## Required outcomes

- Leader Center route/data/state migration with role/privacy parity;
- assignment/review/presence/group/team composition through typed repositories;
- Admin Console privileged actions remain server-authoritative and re-auth-safe;
- privacy-safe aggregate activity only; no new surveillance-like raw feeds;
- executable role and cross-congregation DB/browser matrices.

## Exit gate

V5 ministry/admin behavior survives the new engine with equivalent-or-stronger privacy/security evidence.

---

# Phase 9 — Tenant/multi-congregation engine

V5 provides a minimum switcher and real Gate C topology. V6 makes tenant context systemic.

## Required outcomes

- every tenant-sensitive repository call requires explicit congregation context;
- stale state cleared on tenant switch;
- deterministic two-congregation fixtures across assignments, responses, presence, groups, teams, rooms, media, notifications and ministry/admin surfaces;
- safe membership/join/provisioning/role tooling under server authorization;
- no feature silently falls back to first membership.

## Exit gate

Cross-tenant denial and tenant switching are executable-tested across every sensitive domain.

---

# Phase 10 — Auth/admin/security hardening

## Required outcomes

- privileged re-auth/session-freshness review;
- session revocation tests;
- leaked-password/MFA/passkey evaluation where appropriate;
- CSP and unsafe-DOM audit;
- dependency/security scanning;
- secret/logging/privacy review;
- least-privilege Edge Function and database function review.

## Exit gate

Security matrix is green with no unresolved high-severity architecture regression.

---

# Phase 11 — Design/runtime platform, observability, performance, motion/sound engine

This phase builds **capabilities**, not the V7 full rollout.

## Required outcomes

- reusable component/design-token layer;
- structured i18n/content boundaries;
- privacy-safe runtime error/diagnostic pipeline and exact release identity;
- route/bundle/image/performance budgets;
- motion tokens and preset registry;
- sound-event registry with user preference, reduced-motion handling and gesture-unlock policy;
- haptic/audio capability abstraction where supported;
- proof on 2-3 representative surfaces spanning playful and restrained product families.

## Exit gate

The engine is documented, testable, preference-respecting and proven on reference surfaces without app-wide rollout.

---

# Phase 12 — Integrated V6 engine certification and promotion

## Required evidence

- full V5→V6 parity matrix;
- clean-install and upgrade-path database migration tests;
- real RLS/security matrix;
- browser/mobile/PWA/offline/media/tenant coverage;
- build identity and performance budgets;
- motion/sound preference/accessibility matrix on reference surfaces;
- exact-SHA RC freeze and rollback plan.

## Exit gate

One exact V6 candidate is accepted and promoted. Its production SHA becomes the only valid starting baseline for V7.

## V7 handoff

V7 receives a completed engine plus documented component, routing, data, offline, media, notification, tenant, motion and sound APIs. V7 may then perform the full page-by-page overhaul without inventing another technical foundation.