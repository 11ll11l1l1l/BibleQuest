# BibleQuest V6 Official Active Status

Updated: 2026-09-13 JST
Status: **PLANNED / BLOCKED BY V5**
Official V6 integration branch: `v6/architecture-upgrade`
Required starting baseline: exact accepted V5 production SHA after V5 Phase 8
Authority when V6 activates: this file
Detailed plan: `DEVELOPMENT_PLAN_V6.md`
Acceptance inventory: `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`

## V6 product decision

V6 is the **engine / architecture upgrade**. It begins only after V5 feature completion is certified and promoted.

V6 may replace build tooling, module boundaries, app shell/router ownership, state ownership, data/repository boundaries, database test infrastructure, service-worker/storage strategy, media ownership, testing infrastructure and feature internals. It must preserve the completed V5 product's accepted user behavior, data, authorization/privacy outcomes and rollback capability unless an explicit V6 ADR deliberately changes a contract.

V6 is not another feature-completion version. Leader Center, Admin Console completion, minimum push, baseline offline reading, active-congregation switching, artwork cleanup and V5 verification debt must already be complete before V6 starts.

## Required handoff from V5

V6 may not begin from the old V4 cleanup SHA or an earlier V5 planning SHA. The only valid V6 baseline is the exact V5 production candidate that passes V5 Phase 8 and is accepted for production.

At V5 handoff, freeze and record:

- exact V5 production SHA;
- V5 regression/security/browser/PWA evidence;
- final feature acceptance checklist;
- known intentional limitations that V6 is expected to remove;
- V4/V5 rollback references.

## Mandatory V6 engine outcomes

1. **Build engine:** deterministic Node/Vite build, incremental TypeScript contracts, code splitting, asset/CSS pipeline and exact build identity.
2. **Database verification engine:** reproducible local Supabase/Postgres, full migration replay, executable RLS/grant/function tests and generated DB types.
3. **Application kernel:** typed shell/router/session/tenant contracts, clear state ownership, repository/data boundaries and standard async/error semantics.
4. **Reader/content engine:** decomposed Reader services/components plus full versioned downloadable/offline Scripture architecture, upgrading V5's baseline cache behavior.
5. **Games engine:** deterministic game/session contracts and componentized game UI, upgrading the completed V5 artwork state rather than redoing artwork cleanup.
6. **Media engine:** provider adapters, official player APIs, session lifecycle, queues/resume/PiP and controlled audible ownership.
7. **Notification/sync engine:** migrate V5's working push into a durable subscription/delivery platform and add safe background/offline mutation infrastructure.
8. **Ministry/admin migration:** move the completed V5 Leader Center/Admin flows onto the new kernel without losing role/privacy behavior.
9. **Tenant engine:** explicit active-congregation context and executable multi-tenant isolation across repositories/features, upgrading V5's minimum switcher/test topology.
10. **Auth/security hardening:** stronger privileged-session boundaries, dependency/security scanning, CSP and executable security coverage.
11. **Design/runtime platform:** component/design-token layer, i18n boundaries, observability, performance budgets, and a first-class motion/sound engine proven on reference surfaces.
12. **Integrated engine certification:** exact-SHA parity/security/database/browser/offline/performance certification and controlled promotion.

## V7 relationship

V7 is **PLANNED / BLOCKED BY V6**. V7 consumes the certified V6 engine and performs the full app overhaul. V6 should build reusable capabilities and reference implementations, not spend itself redesigning every page.

The V6 motion/sound system is an engine capability only: registry/tokens/preferences/unlock/accessibility and a few proof surfaces. Full-page-family rollout belongs to V7.

## Phase state

- Phase 0 — V5 handoff, engine authority, ADRs and exact baseline: BLOCKED BY V5.
- Phase 1 — Build engine: BLOCKED BY V5.
- Phase 2 — Real database verification engine: BLOCKED BY V5.
- Phase 3 — App kernel/state/data engine: BLOCKED BY V5.
- Phase 4 — Reader/content/offline engine: BLOCKED BY V5.
- Phase 5 — Games engine: BLOCKED BY V5.
- Phase 6 — Media engine: BLOCKED BY V5.
- Phase 7 — Notifications/background-sync engine: BLOCKED BY V5.
- Phase 8 — Ministry/admin migration: BLOCKED BY V5.
- Phase 9 — Tenant/multi-congregation engine: BLOCKED BY V5.
- Phase 10 — Auth/security hardening: BLOCKED BY V5.
- Phase 11 — Design/runtime/motion-sound platform: BLOCKED BY V5.
- Phase 12 — Engine certification/promotion: BLOCKED BY V5.

## Non-negotiable inherited contracts

- Server authorization remains authoritative.
- RLS/data isolation may not be weakened for migration convenience.
- Secrets/privileged credentials never enter client bundles.
- Copyright/licensing rules for Bible content remain in force.
- V5 accepted behavior is parity baseline unless a V6 ADR intentionally supersedes it.
- Field evidence is never fabricated; `WAIVED` is not `PASS`.
- Valid security/privacy tests are replaced only by equivalent-or-stronger evidence.
- V7 overhaul work is not pulled into V6 except for bounded reference implementations needed to prove engine capability.

## Activation gate

V6 becomes ACTIVE only when V5 Phase 8 is complete and the exact accepted V5 production SHA is written here as the V6 baseline. Until then, V6 runtime implementation must not proceed.