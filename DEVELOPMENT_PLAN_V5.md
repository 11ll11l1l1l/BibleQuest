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

V5 keeps one serialized runtime integration stream. Multiple analysis helpers may investigate, but only one coordinated change stream may alter overlapping runtime/data ownership at a time.

Each phase uses this sequence:

1. record/approve the architecture decision if the phase changes a contract;
2. add characterization/parity tests for the behavior being migrated;
3. introduce the new owner behind an explicit boundary;
4. migrate one route/domain slice at a time;
5. run old + new regression evidence;
6. remove the old owner only after no live route depends on it;
7. update `V5_ACTIVE_STATUS.md` and the V5 checklist in the same serialized stream.

No phase may obtain green status by deleting a valid security/privacy/behavior test without an explicit replacement proving the new contract.

---

# Phase 0 — Governance, baseline and architecture decisions

## Goal

Turn the cleaned V4 production tree into a controlled V5 architecture program before runtime changes begin.

## Work

- Establish `V5_ACTIVE_STATUS.md` as the only current V5 state authority.
- Establish this plan and `V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`.
- Create `docs/v5/adr/` and the ADR template/index.
- Record the exact cleaned-main/V4 fallback SHAs and immutable archive references.
- Run all inherited automated gates on the V5 branch before architectural implementation.
- Produce a route/domain ownership map: shell/router/session, Reader, Games, media, notifications, congregation/ministry, assignments, linked activities, admin, offline/PWA.
- Define compatibility/parity policy: V4 behavior remains the reference until a V5 ADR intentionally changes it.

## Exit gate

- V5 planning documents accepted.
- Exact Phase 0 SHA has accumulated baseline green.
- ADR-0001 and ADR-0002 accepted before Phase 1/2 implementation begins.

---

# Phase 1 — Real build system: Vite + typed module platform

## Why first

The lack of a build graph is the ceiling preventing safe large refactors. Reader/Games/media/offline changes should not be attempted as another layer of hand-wired browser scripts.

## Required architecture

- Add `package.json` and lockfile.
- Pin supported Node version for development and CI.
- Introduce Vite as the build/development server.
- Introduce TypeScript incrementally; existing JS may enter through `allowJs` during migration, but all new architecture contracts should be typed.
- Preserve stable external/deep routes during cutover.
- Produce deployable `dist/` output with deterministic release identity.
- Add source maps suitable for privacy-safe production diagnostics.
- Add CSS/asset handling and image optimization without changing visual behavior merely for migration.
- Add code splitting at route/domain boundaries where it produces real startup savings.
- Add lint/format/typecheck commands and fast unit test runner.
- Retain Playwright/deployed browser tests as higher-level gates.
- Add bundle/chunk/image budgets once the first production-equivalent bundle exists.

## Framework rule

Do not choose a UI framework by fashion. ADR-0001 must compare the smallest credible options against the existing DOM-heavy modules and migration risk. Vite + TypeScript is required; the component technology may be lightweight components/Web Components/Preact/etc. only after the spike demonstrates the best incremental migration path.

## Exit gate

The Vite-built application must match the current production route matrix, auth/session startup, deep linking, PWA installation behavior and critical flows before feature refactors continue.

---

# Phase 2 — Real Supabase/Postgres testing in CI

## Priority

This is V5's highest-priority risk-reduction change.

V4 proved SQL/security changes mainly through static tests and selected live/manual checks. V5 must execute database behavior on every relevant PR.

## Required architecture

- Check in a reproducible Supabase local configuration (`supabase/config.toml` or the supported equivalent).
- Run an ephemeral Supabase/Postgres stack in CI.
- Apply the full schema/migration chain from a clean database, not a hand-prepared snapshot only.
- Fail CI on migration ordering/idempotence/schema drift problems.
- Add deterministic seed identities/topology:
  - at least two populated congregations;
  - ordinary members in each;
  - multi-membership account where supported;
  - facilitator/leader/pastor/admin roles;
  - platform Owner/Admin identities where platform operations require them;
  - assignments/responses, presence, groups, couples, teams, rooms, notifications and media fixtures needed by policy tests.
- Add executable RLS matrix tests for anonymous, ordinary member, ministry role, admin/owner and cross-congregation access.
- Execute `SECURITY DEFINER`/`SECURITY INVOKER` functions under realistic caller roles.
- Assert grants/revokes and public/anon exposure explicitly.
- Test privileged functions for search-path safety and least privilege.
- Generate TypeScript DB types from the tested schema and fail on uncommitted type drift.
- Keep static SQL/security tests as fast guards, but never treat them as the sole proof of database authorization.

## Tooling

Prefer Supabase CLI + SQL/pgTAP or a small SQL test harness executed against the local stack. Avoid mocks for RLS outcomes.

## Exit gate

A clean CI job can build the database from zero and prove all critical allow/deny cases, including genuine two-congregation isolation, without production credentials.

---

# Phase 3 — Core client architecture: state, data and feature boundaries

## Goal

Create a platform on which Reader/Games/media/Leader Center can be safely rewritten without rebuilding cross-cutting concerns per page.

## Required architecture

- Typed app shell/router contract.
- Typed session/auth context.
- Explicit active-congregation/tenant context separate from authentication identity.
- Centralized repository/data-access interfaces over Supabase/remote APIs.
- Domain services that do not depend on rendered DOM.
- UI components/views that do not own server authorization decisions.
- Standard async states: idle/loading/ready/empty/offline/error/unauthorized.
- Standard cancellation/stale-request protection.
- Shared error taxonomy and safe user-facing error mapping.
- Route-level lazy loading.
- Feature flags/compatibility adapters for incremental V4→V5 cutover.
- Explicit event/command boundaries for cross-feature coordination instead of importing mutable owners opportunistically.

## State rule

Do not replace the current tiny store with one giant global store. State should be owned at the narrowest durable scope: global session/tenant/config; route feature state; durable domain repositories; ephemeral component state.

## Exit gate

At least one low-risk feature is migrated end-to-end through the new shell/data/state contracts, proving the architecture before Reader/Games migration.

---

# Phase 4 — Reader architecture + true offline Bible

## Why together

Offline reading should be designed into the Reader's data contract, not bolted onto its existing monolithic renderer.

## Reader decomposition

Split current responsibilities into independently testable owners, for example:

- Reader route/controller;
- Scripture repository/content provider;
- translation/book/chapter navigation state;
- chapter/verse view components;
- search service/results;
- Verse Peek;
- Hebrew/Greek Context Lab bridge;
- Japanese furigana pipeline;
- Japanese vocabulary support;
- read/progress command owner;
- external/licensed translation adapter.

Preserve copyright behavior: licensed translations remain link/external modes unless redistribution rights are explicitly obtained.

## Offline Bible architecture

- Define versioned Scripture content manifests with translation/book/chapter identity, checksum/version and license metadata.
- Support deliberate downloads rather than blindly precaching the entire repository.
- Allow at minimum book-level and full-supported-translation offline packages where size/licensing allows.
- Use IndexedDB/Cache Storage according to content shape; do not force all Bible text into service-worker cache entries if a structured DB is better.
- Expose storage usage, update availability, download progress, remove/reclaim controls and corrupt-package recovery.
- Maintain reading position and supported local search offline.
- Make network/live translations visibly unavailable offline rather than silently substituting another text.
- Version service worker/application/content independently enough to safely update one without corrupting another.

## Exit gate

A physical/offline browser session can launch the installed app, open a previously downloaded supported translation/book, navigate chapters, use supported local Reader functionality, close/reopen the PWA and continue reading without network access.

---

# Phase 5 — Games engine and componentized Games UI

## Problem to remove

The current Games route is a large phase/switch-style renderer that couples game-specific markup, rewards, timers, local multiplayer and navigation. It is difficult to change one game without risking the whole route.

## Engine architecture

Create a game registry and common contracts for:

- game metadata/availability;
- content/question provider;
- deterministic session state;
- answer/action validation;
- scoring/rewards policy;
- timer/turn policy;
- progress/result contract;
- persistence adapter;
- accessibility announcements;
- local pass-and-play adapter;
- future realtime/team adapters.

Game logic should run independently of DOM rendering so sessions can be unit tested/replayed deterministically.

## UI migration

- One component/view module per game family.
- Shared launcher, question, feedback, result, scoreboard and progress primitives.
- Replace raw decorative emoji with the existing/expanded V4/V5 asset system where an intentional art asset exists.
- Keep text/accessible labels independent of visual icon choice.
- Lazy-load large recall/game content.
- Do not duplicate scoring logic between solo, pass-and-play and remote modes.

## Exit gate

Every existing game has parity tests; at least representative game engines pass deterministic unit tests; route/browser tests prove launcher→play→result→replay flows; no single renderer owns all game modes.

---

# Phase 6 — Media subsystem modernization

## Current constraint

The V4 Audio owner intentionally has one iframe and unloads the previous frame on every mount. That was a valid V4 safety boundary but blocks richer Videos behavior.

## V5 architecture

Create a media session platform with:

- provider adapters (`YouTube`, native audio/video where applicable);
- official YouTube IFrame API integration rather than command-only `postMessage` guessing;
- multiple registered media instances/views while enforcing an explicit audible-session policy;
- central playback lifecycle/state events;
- queue/playlist support;
- continue-watching/resume position where privacy/product policy permits;
- foreground/background lifecycle handling;
- Picture-in-Picture where browser/provider support exists;
- teardown/resource limits so multiple players do not mean uncontrolled persistent iframes;
- accessibility/media-control semantics;
- analytics/telemetry limited to product-operational needs.

The server remains authoritative for media curation permissions.

## Cleanup

After Videos/Recordings fully use the new media platform and parity tests pass, remove the old dead `media-library` architectural owner and any duplicate playback path rather than preserving two competing implementations forever.

## Exit gate

Automated/browser tests prove provider initialization, switch/pause policy, queue/resume behavior, teardown, route changes and unsupported-provider failure. Only one source may be audible by default unless an explicit use case says otherwise.

---

# Phase 7 — Push notifications, background delivery and offline mutation infrastructure

## Push platform

Extend the existing Notification Center rather than replacing its inbox semantics:

- Web Push subscription lifecycle tied to authenticated user/device;
- VAPID/server-side delivery secret kept outside client code;
- push preference model per notification category;
- service-worker push + notification-click handlers;
- deep links into migrated BibleQuest destinations;
- invalid/expired subscription cleanup;
- rate limits/deduplication/idempotency;
- delivery audit metadata without storing sensitive payload contents unnecessarily;
- in-app Notification Center remains the durable fallback/source of truth.

Initial push-worthy events should come from existing domains: assignment due/assigned, leader/congregation announcements and encouragements. Additional event types require explicit product acceptance.

## Background/offline writes

Create a versioned IndexedDB outbox for carefully selected user-owned mutations such as local progress/notes/draft responses where safe. Define conflict/retry/idempotency policies.

Do **not** queue privileged destructive admin operations, role changes, password/email actions, or other actions whose authorization/freshness must be evaluated live.

## Exit gate

Push opt-in/out, delivery, click/deep-link and subscription removal are tested; offline-safe writes survive reload and reconcile predictably; privileged actions remain online/reauthorized.

---

# Phase 8 — Leader Center flagship

## Product position

Leader Center was explicitly skipped in V4. V5 restores it deliberately after the database/client foundations exist.

## Existing building blocks to consume

- congregation membership/role model;
- assignment publishing and response/review model;
- privacy-safe aggregate presence capabilities;
- Journey Groups/team/linked activity models;
- Notification Center and V5 push platform;
- media/content moderation where relevant.

## Initial Leader Center scope

- role-gated congregation dashboard;
- assignment publishing/review/follow-up queues;
- member/group activity summaries using privacy-safe aggregates rather than raw surveillance-like activity feeds;
- upcoming due items/events;
- leader announcements/notification publishing;
- Journey Group/team management entry points;
- moderation/review entry points where the role already has server authority;
- clear congregation context when a leader belongs to multiple congregations.

## Privacy rule

Leader Center must not create new raw-member surveillance merely because data exists. Every metric needs a ministry purpose, minimum necessary scope, RLS/server authorization and an executable tenant/privacy test.

## Exit gate

Member/facilitator/leader/pastor/admin role matrices are executable-tested in DB + browser tests, including denied controls and cross-congregation denial.

---

# Phase 9 — Genuine multi-congregation product/tooling

## Principle

Multi-congregation is first a tenancy/security architecture, then a product surface. The goal is not to create cross-church data leakage in the name of a directory.

## Required foundation

- deterministic two-congregation database fixtures from Phase 2;
- explicit active-congregation context in Phase 3;
- every tenant-sensitive repository call requires congregation context rather than inferring a convenient first membership;
- cross-tenant denial tests for assignments/responses, presence, groups, teams, couples where applicable, rooms, media, notifications and leader/admin surfaces.

## Product tooling

- congregation membership switcher for users with multiple memberships;
- invitation/join flow and membership management;
- congregation profile/settings and role administration under existing authorization rules;
- safe congregation provisioning process;
- explicit stale-state clearing on tenant switch;
- scoped notification/Leader Center behavior per active congregation.

## Optional inter-congregation direction

A public/partner congregation directory, shared events/resources or inter-congregation discovery should be a separate opt-in product decision/ADR. It is not required merely to call the data model multi-tenant.

## Exit gate

Two populated congregations can coexist in CI/staging; users with one or both memberships see only allowed tenant data; active-tenant switching clears stale state; every sensitive domain has explicit cross-congregation denial tests.

---

# Phase 10 — Authentication, admin and security hardening

## Work

- Enable/verify leaked-password protection or document a supported replacement; V4 recorded it disabled as a post-release follow-up.
- Revisit privileged re-authentication for Owner/Admin destructive/recovery operations.
- Preserve/strengthen real session revocation tests.
- Typed/admin operation contracts and audit-event schema.
- Device/session visibility where supported without exposing token material.
- Evaluate MFA/passkeys for privileged roles; adopt only with recovery/support flows designed at the same time.
- Dependency/SCA scanning after package management exists.
- Content Security Policy compatible with the new build/media/push architecture.
- automated secret scanning/client-bundle checks.
- Supabase security-advisor findings triaged as release evidence rather than ignored noise.

## Exit gate

Critical auth/admin/RLS operations have executable database/server/browser tests; no secret appears in client artifacts/logs; known high-risk advisor findings are closed or explicitly accepted with rationale.

---

# Phase 11 — Design system, i18n, observability and performance consolidation

## Design-system architecture

V4 established the modern visual language. V5 turns repeated patterns into reusable, testable primitives rather than another visual overhaul for its own sake:

- buttons/inputs/dialogs/cards/status/empty/error/loading primitives;
- responsive layout primitives;
- icon/art registry;
- accessibility/focus/keyboard contracts;
- story/demo/test surface for components if the chosen stack supports it cheaply.

## i18n/content architecture

As features migrate, move user-facing strings into structured catalogs instead of scattering new strings through render code. Preserve Japanese/furigana and existing supported-language behavior. Keep Scripture content licensing/source metadata separate from UI translation catalogs.

## Observability

- release SHA/build version available in diagnostics;
- privacy-safe structured client error reporting;
- no Scripture/private notes/auth token content in telemetry by default;
- source-map-backed stack resolution under controlled access;
- health/diagnostic surface for SW version, content-pack version, remote connectivity and tenant/session state without exposing secrets.

## Performance

- route/chunk budgets;
- startup and route-interaction budgets;
- image/font budgets;
- long-task monitoring in CI/browser tests where stable;
- avoid preloading Bible/game/media payloads that are not needed for first render.

## Exit gate

Migrated routes use shared primitives/catalogs; accessibility and performance gates are version-neutral and enforced against built artifacts.

---

# Phase 12 — Integrated V5 certification and production promotion

## Candidate convergence

- Produce a V4→V5 parity/migration matrix for every live route and critical domain.
- Close all applicable acceptance checklist items.
- Freeze one exact V5 RC SHA.
- Apply database migrations from a clean database and from a V4-like upgrade state.
- Run unit/type/lint/build, DB integration/RLS, security/privacy, browser/mobile, whole-app, protected pages, push, offline Bible, media, Leader Center, multi-congregation and PWA/recovery gates on the exact candidate.
- Deploy exact candidate to authoritative Cloudflare preview/staging and verify build identity.
- Execute physical-device acceptance for areas emulation cannot prove, especially installed PWA/offline/push behavior.
- Promote only the exact certified candidate through PR.
- Verify canonical production exact-SHA identity and post-promotion browser/PWA/push/offline behavior.
- Retain V4 archive rollback until V5 production acceptance is complete.

## Evidence semantics

`PASS` means executed evidence. `WAIVED` means an explicit owner decision and is never rewritten as PASS. Static evidence may support but cannot substitute for real DB or physical-device evidence where the acceptance item requires it.

---

# Cross-phase engineering rules

1. **No architecture preservation for its own sake.** If V4 structure is the limiting factor, V5 may replace it.
2. **No big-bang rewrite.** Production parity is protected through adapters, characterization tests and one-owner-at-a-time migration.
3. **Database authorization is executable behavior.** Static SQL matching is never sufficient V5 release evidence for RLS.
4. **Tenant context is explicit.** No sensitive feature should guess which congregation is active.
5. **Server authority remains authoritative.** Client role checks are UX only.
6. **Offline is explicit.** Each domain declares what is cached/readable/writable offline and how conflicts recover.
7. **One media platform, one notification platform, one auth/session owner, one active-tenant owner.** Feature routes consume these; they do not recreate them.
8. **New dependencies require reason and ownership.** Vite/TypeScript/test tooling are justified platform dependencies; avoid framework sprawl.
9. **Every intentional breaking architecture change gets an ADR.** Historical implementation details need not be preserved, but decisions must be recoverable.
10. **Current status stays singular.** `V5_ACTIVE_STATUS.md` wins over old phase docs, issues or chat summaries.
