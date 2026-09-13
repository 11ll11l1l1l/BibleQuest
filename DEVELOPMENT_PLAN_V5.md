# BibleQuest V5 Development Plan

Updated: 2026-09-13 JST
Authority: `V5_ACTIVE_STATUS.md`
Integration branch: `v5/architecture-upgrade`
Starting baseline: cleaned `main` `ef5d46485f9e7138b969777d34de585cfd9ecbd1`

## 1. V5 line in the sand

V3 established/recovered broad product capability. V4 modernized presentation, repaired concrete gaps, strengthened privacy/release evidence, and intentionally avoided broad architecture replacement. V5 is the deliberate point where BibleQuest may change its architecture.

The objective is not a visual V4.1. It is to make the existing working product safer to evolve: executable database security tests, a real build system, typed module boundaries, decomposed Reader/Games, real offline reading, push delivery, a modern media platform, Leader Center, and genuine multi-congregation operation.

V5 is allowed to replace internal architecture without preserving old implementation shapes. It must preserve user data, authorization/privacy outcomes, accepted feature behavior, rollback ability and test evidence unless a documented V5 product decision explicitly changes them.

## 2. Repository evidence driving this plan

This program is grounded in current production code, not a generic wishlist:

- there is no `package.json`; the production app still has no standard Node/Vite build graph;
- `sw.js` is a retirement/network-pass-through worker that clears prior caches rather than providing an offline Scripture strategy;
- `.github/workflows/v4-section-i-security-privacy.yml` runs static/security text and JS edge tests but does not start Postgres/Supabase and execute migrations/RLS as real database behavior;
- `supabase/` already contains schema, migrations and Edge Functions, but there is no checked-in `supabase/config.toml` local-project definition;
- `src/features/reader/index.js` mixes loading, translation controls, chapter rendering, search, dialogs, furigana, vocabulary and event handling in one large mount/render owner;
- `src/features/games/index.js` contains a large phase-driven renderer and still emits raw emoji such as the Memory Meadow fox, detective mark, book/Scripture symbols and reward symbols despite the V4 asset system;
- `src/app/audio.js` owns exactly one iframe, destroys the previous player on every mount, sends YouTube commands using `postMessage`, and reports a maximum connected player count of one;
- `src/app/notification-center.js` is an in-app fetch/read-state inbox; no Web Push subscription/delivery owner exists;
- congregation membership already supports a user having a list of memberships, but there is no first-class active-tenant context/switcher/product workflow;
- `src/app/ministry-hub.js` explicitly marks the retained Leader Dashboard as unavailable/not migrated;
- the app contains many mature domain owners—assignments, presence, admin, couples, Journey Groups, Live Rooms, notifications, media—while the shared store is intentionally tiny and the bootstrap owner is large. V5 needs clearer typed boundaries before more cross-domain growth.

## 3. Execution model

V5 is one shared development program. A1-A4 may work in parallel only on demonstrably non-overlapping ownership areas; A5 serializes accepted changes into `v5/architecture-upgrade`. Worker changes use short-lived branches/PRs from the current integration HEAD and Issue #185 leases. Historical `lab/v5-*` branches are read-only evidence/idea sources, not competing product branches and not bulk-merge targets.

Each phase uses this sequence:

1. record/approve the architecture decision if the phase changes a contract;
2. add characterization/parity tests for the behavior being migrated;
3. introduce the new owner behind an explicit boundary;
4. migrate one bounded slice;
5. run old/new regression and applicable security/database/browser evidence;
6. remove the old owner only after no live route depends on it and parity is demonstrated;
7. update status/checklist only from exact evidence.

## 4. Phase 0 — architecture authority and baseline

Close the current bootstrap phase by:

- restoring the coordinated five-agent model as repository and scheduled-task authority;
- freezing the exact integration baseline and inherited green evidence;
- accepting/refining ADR-0001 (build/client architecture) and ADR-0002 (real database CI) from current evidence;
- producing route/domain ownership characterization;
- inventorying useful findings from the historical labs without selecting a lab as the product architecture.

## 5. Phase 1 — real build/toolchain

Introduce a deterministic package-manager install and lockfile, Vite production build, TypeScript-capable module boundaries, CSS/assets processing, route/code splitting, test entrypoints and production-artifact parity checks.

Exit when the Vite-built application matches the production route matrix, auth/session behavior, deep links, PWA install path and critical flows on exact CI evidence.

## 6. Phase 2 — real Supabase/Postgres CI

Add checked-in local Supabase configuration, zero-state migration replay, deterministic seed topology with at least two congregations, executable RLS/grant/revoke/SECURITY DEFINER assertions and generated DB types.

Exit when clean CI can construct the DB from zero and prove critical allow/deny behavior including cross-congregation isolation.

## 7. Phase 3 — core client architecture/state/data boundary

Establish explicit app/session/active-congregation state ownership, typed repository/data-service contracts and a clear composition root. Migrate at least one low-risk feature end-to-end through the new boundary before widening the migration.

## 8. Phase 4 — Reader + true offline Bible

Decompose Reader ownership into testable modules/components, introduce legal versioned downloadable Scripture packages, deliberate IndexedDB/cache/storage ownership, offline/read-through/recovery behavior and real browser/installed-PWA tests.

## 9. Phase 5 — Games engine + componentized Games UI

Create a real game/domain engine, componentize game UI/state, migrate every accepted game with parity tests, and replace raw emoji UI where real assets exist.

## 10. Phase 6 — media subsystem

Replace the one-frame/raw-command media ownership with explicit media provider/session lifecycle, one-audible-source control, teardown/recovery rules and navigation/interruption tests.

## 11. Phase 7 — push + service worker/background/offline sync

Add Web Push subscriptions/preferences, service-worker notification handling, in-app fallback, user/tenant-scoped offline mutation queues, idempotency/reconnect conflict rules and browser/PWA update recovery tests.

## 12. Phase 8 — Leader Center

Build a real Leader Center using existing assignment-review, membership and privacy-safe presence capabilities, with server-authoritative role/permission tests and no leakage of private reflection content.

## 13. Phase 9 — multi-congregation

Introduce explicit active-congregation context and safe product/tooling behavior across assignments, presence, community, admin and related domains. Prove deterministic two-congregation isolation.

## 14. Phase 10 — auth/admin/security hardening

Review auth/session/recovery/admin boundaries, RLS/functions/grants, secrets/logging/privacy and abuse/replay/rate-limit concerns where applicable. Preserve or strengthen existing protections.

## 15. Phase 11 — design system / i18n / observability / performance

Consolidate reusable component/design-system ownership, i18n/content boundaries, privacy-safe observability and build identity, performance budgets, route/bundle/image optimization, accessibility and responsive evidence.

## 16. Phase 12 — integrated certification and promotion

Freeze one exact V5 candidate SHA only after the integrated database/browser/security/offline/tenant matrix is green, deployed-preview/E2E evidence is complete, physical-device acceptance is recorded where required, and rollback/recovery evidence is ready.

Scheduled agents never deploy production or merge V5 runtime work to `main`. Production promotion remains a manual decision.