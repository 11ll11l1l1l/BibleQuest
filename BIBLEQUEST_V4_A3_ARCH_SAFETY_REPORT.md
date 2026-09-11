# BibleQuest v4 — A3 Architecture & Safety Report

Agent: `BQ-A3-V4-ARCHITECTURE-SAFETY`
Authority: analysis/reporting only
Central control: `BIBLEQUEST_V4_ANALYSIS_HUB.md`

A3 may update only this file. Do not modify product code, tests, workflows, branches, deployment, Supabase, Cloudflare, or the central hub.

## Latest inspected ref

- Branch: `main`
- Inspected HEAD before this report write: `8f16974f9c976f77299d1db365655794b853912b`
- Inspection date: 2026-09-12 JST
- Current HEAD is documentation-only (`docs(v4): populate A2 responsive and accessibility report`); the architecture/runtime evidence below was re-checked directly against this exact tree.
- Primary files re-checked: `src/app/bootstrap.js`, `src/core/api.js`, `src/app/session.js`, `src/core/storage.js`, `src/app/congregation-membership.js`, `src/app/offline-shell.js`, `offline-shell-sw.js`, `index.html`, plus the current A1/A2 v4 reports.
- v3 design constraints are historical only. Protected runtime/auth/privacy/backend/doctrinal boundaries remain architectural contracts unless a captain deliberately changes them.

## Executive finding

The current architecture gives v4 substantial page-level design freedom without requiring a rewrite. The safest seam is still presentation: each `src/features/<feature>/index.js` page can be structurally redesigned while continuing to call its existing `src/app/<feature>.js` service and the single router/API/session/storage owners.

The most important correction to the prior A3 report is that `bootstrap.js` does **not** lazily import route modules today. It statically imports all shipped feature pages and app services at module startup. `index.html` also eagerly links the global CSS chain. Therefore any v4 recommendation that relies on current route-level code-splitting is based on a false premise. If the captain later introduces lazy route modules or route-scoped CSS/assets, that is an explicit ARCHITECTURE/PWA change because the current offline-shell warmup only caches resources that were already loaded and visible to the Performance API.

The highest-priority v4 architecture enablers are:

1. Add a lightweight bootstrap dependency-order guard before accelerating cross-cutting service work.
2. Add real migration-apply/RLS validation rather than relying only on static/in-memory checks.
3. Treat route-level lazy loading as a deliberate architecture/PWA milestone, not as an assumed current capability.
4. Keep all v4 redesigns inside the existing router/session/storage/API/authorization owners unless the captain explicitly approves a boundary change.
5. Avoid adding a third layer of visual ownership; consolidate page styles while preserving one presentation owner per surface.

## Cross-cutting boundary matrix

| Boundary | FACT on `main` @ `8f16974f…` | Safe v4 seam | Crossing the boundary means |
|---|---|---|---|
| Routing/navigation | `src/app/router.js` remains the router; `bootstrap.js` owns the route map and route callbacks | Replace shell/page composition while invoking the same route callbacks | Adding/removing/renaming destinations or introducing a parallel router is FUNCTION/ARCHITECTURE affecting |
| Feature state/logic | app services are constructed in `bootstrap.js` and injected into feature pages | Redesign markup/composition around the existing service contract | Moving state rules into UI or duplicating a service creates parallel ownership |
| Auth/session | `src/app/session.js` owns auth lifecycle and publishes normalized session state | Redesign Account/Auth UI around session methods/state | Re-implementing auth state in a page or caching a second auth truth is SECURITY affecting |
| Browser persistence | `src/core/storage.js` owns portable, private, and auth namespaces under `biblequest.v3.*` | Visualize local/private/cloud distinctions more clearly | Renaming/migrating keys or combining private/portable state is FUNCTION/PRIVACY affecting |
| Supabase/API | `src/core/api.js` is the single client boundary and contains the publishable client configuration | Existing pages may call their injected service/API namespace exactly as today | Direct Supabase calls from redesigned feature UI are ARCHITECTURE/SECURITY affecting |
| Congregation authorization | `src/app/congregation-membership.js` owns role normalization and `can()` / `assert()` | Show role/permission state from this owner | Deriving leader/admin rights from display data or hidden UI alone is a security defect |
| Privacy split | private assignment response data and peer-visible completion presence remain separate API/backend concepts | Redesign leader/member presentation without merging the models | Combining private response content with peer visibility is PRIVACY/BACKEND affecting |
| PWA/offline | `src/app/offline-shell.js` registers `offline-shell-sw.js`; SW caches same-origin navigation/script/style/image/font responses | Redesign offline/install/error presentation around this owner | New lazy-loading/resource ownership must be reconciled with cache warmup/update behavior |
| CSS/page assembly | `index.html` eagerly links a large base + polish + phase-B chain | Consolidate one page at a time into an explicit v4 owner | Adding more overlay styles continues specificity/load-order debt |
| Bootstrap composition | all major services/pages are statically imported and services are manually instantiated in dependency order | Presentation-only redesigns can avoid touching this file | New cross-cutting services/dependencies can cause boot-time TDZ/order failures |

## Prioritized findings

### A3-V4-001 — CI still does not prove migration/RLS behavior against real Postgres

- Exact branch/SHA: `main` @ `8f16974f9c976f77299d1db365655794b853912b`; previously reproduced across v3/post-release migration work.
- Route/surface: every cloud-backed or congregation-shared surface: Account cloud state, Cloud Notes, Couples Cloud, Community/Groups, Live Rooms, Calendar sharing, Assignments, Notifications, Workspace, Team/Recognition/Admin.
- Evidence: repository architecture continues to use Supabase migrations/RLS while the established regression approach primarily validates static contracts, mocked/in-memory service behavior and browser UI. No evidence in the current tree establishes an ephemeral Postgres migration/RLS execution gate.
- Category: BACKEND / SECURITY
- Severity: HIGH
- FACT vs INFERENCE: FACT that runtime access is Supabase/RLS-based; FACT from prior verified investigation that migration apply is not proven by the normal static/browser gate. INFERENCE that v4 social/operational redesigns may increase schema-change pressure.
- Root cause: deployment-time schema/RLS behavior is outside the normal browser/static verification boundary.
- v4 implication: a redesigned shared/social/admin surface must not be allowed to smuggle a new table, field, permission or sharing model under “UX redesign.”
- Safe redesign seam: presentation and task organization may change freely if the same service/API contract is retained.
- True owner: `supabase/migrations/*`, `src/core/api.js`, feature app service, RLS policies/functions.
- Durable direction: add a scratch-Postgres migration-apply smoke and targeted RLS behavior checks before approving any v4 backend-affecting redesign.
- Dependency/order: architecture test enabler can land independently; must precede new backend-affecting v4 features.
- Validation: apply migrations from clean state; role/user matrix for representative own-row/congregation/denied cases; then normal edge/browser suite.
- Confidence: HIGH.

### A3-V4-002 — Manual bootstrap dependency order is a proven whole-app failure mode

- Exact branch/SHA: current structure re-confirmed on `main` @ `8f16974f…`; defect class previously reproduced during Calendar/Avatar work.
- Route/surface: global boot / every route.
- Evidence: `bootstrap.js` contains a long manually ordered sequence of `const service=createXService({dependencies})`; current Avatar Vault and Calendar correctly appear after `assignments`, but no static dependency-order contract protects future edits.
- Category: ARCHITECTURE / MAINTAINABILITY
- Severity: HIGH
- FACT vs INFERENCE: FACT that current composition is manually ordered; FACT that this defect class previously produced TDZ boot failures; INFERENCE that v4 cross-cutting shell/search/recent-state services would increase dependency edges.
- Root cause: composition order is encoded only by source position.
- v4 implication: page redesign itself is safe, but a new shell/theme/global context service should not be casually added during a visual tranche.
- Safe redesign seam: keep v4 page/shell presentation stateless or driven by existing injected state wherever possible.
- True owner: `src/app/bootstrap.js`.
- Durable direction: add a focused bootstrap-order/static dependency guard first; consider domain-grouped composition only as a later isolated architecture milestone.
- Dependency/order: guard before broad shared-service expansion.
- Validation: deliberately misorder a dependency in a test branch and prove the guard fails with a useful owner/name before browser smoke.
- Confidence: HIGH.

### A3-V4-003 — Current runtime is eager, not route-lazy; previous A3 asset recommendation was incorrect

- Exact branch/SHA: `main` @ `8f16974f9c976f77299d1db365655794b853912b`.
- Route/surface: global startup, every route; particularly A1 game/art proposals and A2 responsive page-specific compositions.
- Evidence: `src/app/bootstrap.js` statically imports every listed feature page at top level; GitHub code search finds no route-module `import(...)` pattern. `index.html` eagerly links the complete CSS chain. The prior A3 report incorrectly stated route factories already used native dynamic import.
- Category: PERFORMANCE / PWA / ARCHITECTURE
- Severity: HIGH
- FACT vs INFERENCE: FACT.
- Root cause: incorrect prior assumption about module loading topology.
- v4 implication: real artwork referenced from route-specific CSS/markup may be browser-lazy depending on the CSS/DOM path, but JavaScript module loading itself is currently eager. Introducing native dynamic import to reduce startup cost changes offline/cache/update behavior and test assumptions.
- Safe redesign seam: v4 can still add optimized SVG/WebP assets and consolidate CSS without changing JS loading topology. Prefer modern image formats, explicit intrinsic sizing and browser-native lazy image loading where semantically safe.
- True owner: `src/app/bootstrap.js`, `index.html`, feature presentation modules/styles, `src/app/offline-shell.js`, `offline-shell-sw.js` if loading topology changes.
- Durable direction: do **not** introduce “lazy modules” as an incidental visual optimization. If startup cost becomes material, make route-level code/resource loading a dedicated architecture milestone with an offline manifest/warm strategy.
- Dependency/order: measure current startup/resource cost first; architecture milestone before converting routes to lazy imports.
- Validation: online first boot, first navigation to never-visited route, installed PWA, immediate-offline after install, visited-route offline, update from old cache, console/page errors, representative slow network.
- Confidence: HIGH.

### A3-V4-004 — Offline shell warmup only captures resources already loaded by the current page lifecycle

- Exact branch/SHA: `main` @ `8f16974f…`.
- Route/surface: PWA/offline across all routes.
- Evidence: `src/app/offline-shell.js` builds the warm list from current `performance.getEntriesByType('resource')` entries with initiators `script/link/css/img`, then sends those URLs to `offline-shell-sw.js`. The SW runtime-caches same-origin navigation/script/style/image/font requests after they are requested. It does not possess an authoritative route/resource manifest.
- Category: PWA / PERFORMANCE
- Severity: MEDIUM now; HIGH if v4 introduces lazy route modules/assets.
- FACT vs INFERENCE: FACT for current warm algorithm; INFERENCE regarding future lazy-loading failure mode until implemented.
- Root cause: cache warm ownership is observational rather than manifest-driven.
- v4 implication: A1/A2 proposals for route-scoped assets are safe only if “offline available immediately after install” is not silently assumed for resources that have never been requested.
- Safe redesign seam: presentation-only asset changes that remain in the current eager/visited-resource model; offline UI may be redesigned freely around existing state.
- True owner: `src/app/offline-shell.js`, `offline-shell-sw.js`.
- Durable direction: if route lazy-loading is adopted, explicitly define whether install pre-caches all critical route shells or whether routes become offline-capable after first visit, and expose that state honestly in UX.
- Dependency/order: depends on any future loading-topology decision.
- Validation: cold install → airplane mode → open representative deep routes; visited vs unvisited route matrix; cache version upgrade; failed asset fallback.
- Confidence: HIGH on architecture, MEDIUM on future user impact.

### A3-V4-005 — A1’s v4 shell redesign is safe only while route/state semantics stay outside the shell

- Exact branch/SHA: `main` @ `8f16974f…`.
- Route/surface: global shell/navigation.
- Evidence: current route callbacks and services are composed in `bootstrap.js`; the UI shell is mounted as presentation over that composition. A1 proposes route-aware title/context, account/avatar affordance and adaptive navigation; A2 proposes tablet/desktop rail treatment.
- Category: ARCHITECTURE / INTERACTION
- Severity: MEDIUM.
- FACT vs INFERENCE: FACT for current ownership; DESIGN INFERENCE for proposed shell.
- Root cause risk: modern shells often accumulate global data-fetching, route history, notification polling and duplicated auth state because they are visible everywhere.
- v4 implication: route-aware presentation is safe; a shell-owned second store/router/session is not.
- Safe redesign seam: shell may receive current route, navigation callbacks and already-owned state; it may render different mobile/tablet/desktop chrome without taking feature ownership.
- True owner: `src/ui/shell.js` + shell styles for presentation; `src/app/router.js` / route map for navigation semantics; `src/app/session.js` for auth truth.
- Durable direction: extend shell inputs only with explicit read-only view models/callbacks from existing owners. Any global search/recent-items/notification aggregation is a separate FUNCTION/ARCHITECTURE proposal.
- Dependency/order: A4 confirms top-level IA; A2 confirms responsive shell; A3 reviews any new state dependency.
- Validation: one shell instance, route highlighting/back behavior, auth transition/sign-out, deep-link boot, keyboard/screen reader, no duplicated polling/listeners.
- Confidence: HIGH.

### A3-V4-006 — Responsive split-pane/list-detail redesigns are feasible but must keep one state owner and one active semantic task

- Exact branch/SHA: `main` @ `8f16974f…`.
- Route/surface: Reader/Study, Notes, Calendar, Notifications, Ministry, Assignments, Workspace, Congregation, Content Review/Admin; tablet/desktop proposals from A2.
- Evidence: A2 recommends mobile list→detail patterns and tablet/desktop split panes. Current services are independent page owners injected through `bootstrap.js`; no evidence supports creating parallel “mobile service” and “desktop service” instances.
- Category: ARCHITECTURE / MAINTAINABILITY / SECURITY
- Severity: HIGH for operational/private surfaces, MEDIUM elsewhere.
- FACT vs INFERENCE: FACT for service ownership; design proposal under review for split panes.
- Root cause risk: rendering both list and detail as independently mounted owners can duplicate subscriptions, mutations, audio, timers or permission checks.
- v4 implication: different compositions by width are safe when they are two views of the same service state, not two feature runtimes.
- Safe redesign seam: one page owner/service instance; responsive DOM may show master/detail regions, but mutation/state actions continue through the same service.
- True owner: respective `src/features/*/index.js` + current `src/app/*` service.
- Durable direction: define shared page view state (selected item/detail id) in the existing feature/service or page composition owner; do not create separate mobile/desktop data owners. For leader/admin surfaces, keep permission context visible rather than hiding it in responsive disclosure without an accessible path.
- Dependency/order: A4 task/selection model before implementation; A2 visual responsive composition; A3 review if selected-item state becomes persistent/global.
- Validation: resize/orientation without duplicated mutation; same selected item after layout switch when appropriate; role matrix; keyboard/focus restoration; no duplicate network requests/subscriptions caused by both panes mounting separate runtimes.
- Confidence: HIGH.

### A3-V4-007 — Private/local/cloud distinctions are architectural, not merely labels to restyle

- Exact branch/SHA: `main` @ `8f16974f…`.
- Route/surface: Private Notes, Cloud Notes, Couples local/cloud, Personality/Psychometrics, Account/Backup/Recovery, Workspace.
- Evidence: `src/core/storage.js` physically separates portable keys, `private.*` keys and `auth.*` keys. Session/auth uses the dedicated auth storage adapter. A1/A2 correctly propose stronger trust/sync cues.
- Category: PRIVACY / SECURITY / UX BOUNDARY
- Severity: HIGH.
- FACT vs INFERENCE: FACT.
- Root cause risk: a v4 “unified notes/workspace” concept could accidentally turn a visual unification into storage/export/sync unification.
- v4 implication: interfaces may visually belong to one design family, but controls must continue to communicate and preserve where data lives and who can see it.
- Safe redesign seam: shared visual primitives, navigation and editor components; separate storage/cloud service actions remain explicit.
- True owner: `src/core/storage.js`, `src/app/private-notes.js`, `src/app/cloud-notes.js`, couples/personality services, backup/session owners.
- Durable direction: do not rename/migrate storage keys, auto-sync privateStorage, include private/auth namespaces in portable backup, or merge local/cloud save actions during a DESIGN/UX tranche.
- Dependency/order: A4 defines user-facing trust model; A1/A2 present it; any actual storage migration requires a separately approved functional milestone.
- Validation: backup export excludes private/auth keys; sign-out behavior; device-local data survives account changes as designed; cloud actions require authenticated state; privacy copy matches actual behavior.
- Confidence: HIGH.

### A3-V4-008 — Role-aware operational redesign must not treat hidden UI as authorization

- Exact branch/SHA: `main` @ `8f16974f…`.
- Route/surface: Ministry Hub, Assignments, Team Center, Congregation, Content Review/Moderation/Reporting, Calendar sharing, Recognition/Admin.
- Evidence: `src/app/congregation-membership.js` normalizes roles and owns `can(congregationId,'read'|'ministry'|'admin')` and `assert()`. It explicitly treats unknown roles as unsupported/denied. A1/A2 propose major hierarchy changes for these dense surfaces.
- Category: SECURITY / PRIVACY
- Severity: CRITICAL if implementation moves authorization into UI; otherwise INFO for design-only work.
- FACT vs INFERENCE: FACT for authorization owner; design risk is INFERENCE.
- Root cause risk: mobile disclosure, simplified leader dashboards or “cleaner” role-specific screens can tempt implementations to omit unavailable actions client-side without preserving service/backend checks.
- v4 implication: hiding a control is UX; permission to execute remains in membership/service/RLS layers.
- Safe redesign seam: derive visible capability cues from existing membership state; keep action handlers going through existing services and backend policies.
- True owner: `src/app/congregation-membership.js`, each feature service, `src/core/api.js`, backend RLS/functions.
- Durable direction: no duplicated role tables/constants inside feature UIs. Unknown/new roles remain denied until the true owner supports them.
- Dependency/order: A4 leader/member flow; A1/A2 presentation; A3/security review before any permission-semantic change.
- Validation: member/facilitator/leader/pastor/admin/unknown role matrix; direct action invocation without button visibility; RLS denial; permission-denied recovery/focus.
- Confidence: HIGH.

### A3-V4-009 — The stylesheet redesign should consolidate ownership, not merely replace `visual-polish` with `v4-polish`

- Exact branch/SHA: `main` @ `8f16974f…`.
- Route/surface: all pages.
- Evidence: `index.html` eagerly links dozens of feature CSS files plus multiple `*-visual-polish.css` and `*-phase-b.css` overlays. A1 flags this as CRITICAL design-system debt; A2 needs new responsive primitives.
- Category: MAINTAINABILITY / PERFORMANCE
- Severity: HIGH.
- FACT vs INFERENCE: FACT for current loading/ownership.
- Root cause: successive visual tranches accumulated additional global styles instead of replacing an owner.
- v4 implication: substantial redesign is feasible, but another global overlay layer would make responsive/accessibility work brittle and increase unused first-load CSS.
- Safe redesign seam: migrate one surface/family at a time to an explicit v4 stylesheet/component contract while removing/superseding that surface’s obsolete overlay ownership in the same bounded tranche.
- True owner: `index.html`, `src/ui/app.css`/future v4 primitives, individual feature CSS owners.
- Durable direction: shared tokens/primitives + one clear page-family/page owner; no uncontrolled `!important`, no hidden-overflow masking, no duplicate mobile/desktop rule families for the same responsibility.
- Dependency/order: establish foundation primitives first; migrate shell and highest-priority pages; validate before removing legacy rules.
- Validation: computed-style/load-order regression, all states including error/disabled/locked, width matrix, no orphaned classes/assets, first-load CSS/resource budget.
- Confidence: HIGH.

## Explicit safety review of A1/A2 design proposals

- **A1 new shell / A2 adaptive bottom-nav→rail:** SAFE if only presentation changes. UNSAFE if it creates a second route store, owns auth truth, or silently changes destinations. True owners remain router/route map/session.
- **A1 grouped Learn hub / compact doctrinal/source trust section:** SAFE to regroup and visually compress navigation. Do not alter doctrinal/source policy content or hide provenance behind an inaccessible/non-semantic disclosure. Any policy rewrite needs doctrinal owner/captain review.
- **A1 game-specific identity/art:** SAFE as presentation. If game HUD redesign changes scoring, timing, retry, rewards, lock state or game selection semantics, it becomes FUNCTION-AFFECTING and stays with the game service/engine.
- **A2 tablet/desktop split panes:** SAFE when both panes are one view of the existing owner. Do not instantiate duplicate feature services or listeners per pane.
- **A2 mobile list→detail operational flows:** SAFE structurally. Security/privacy context, destructive confirmations and role checks cannot be dropped merely because secondary metadata is collapsed.
- **A2 preserving 125% XL text:** SAFE and encouraged; fix layout owners rather than reducing accessibility preference. No architecture change is necessary unless semantic order is changed.
- **A1/A2 page-specific heavy assets:** SAFE with explicit asset budgets and native image optimization. Do not assume current route-level code splitting; a lazy-module plan is a separate PWA/architecture proposal.
- **Any new social/share/search/recent/global inbox feature:** FUNCTION/ARCHITECTURE/BACKEND affecting until proven otherwise. Do not implement it as shell UI sugar.

## Per-surface feasibility matrix

| Surface/family | Redesign freedom | Protected owner/boundary | Main v4 architecture caution |
|---|---|---|---|
| Home | HIGH | Home page + existing progress/daily/media callbacks | Personalized/conditional modules must use existing state or an explicitly approved owner; do not invent shell-global state |
| Global shell/navigation | HIGH | `src/ui/shell.js`; router/session remain external | No second router/session/store; route destination changes are functional |
| Learn hub | HIGH | Learn page + existing callbacks | Doctrinal/source policy stays protected; regrouping is presentation/IA only |
| Reader/source/translation | HIGH | reader service + Bible/source owners | Do not move translation/source truth into visual component; keep editorial width changes presentation-only |
| Study/Deep Questions/Story/Wisdom | HIGH | existing app service/engine per feature | Step/scene redesign must not change lesson/progress rules without separate functional approval |
| Adaptive/Open Review | HIGH | adaptive/review services | Confidence/mastery/scoring meaning is functional, not decoration |
| Bible World | HIGH | Bible World service | Map/world composition may change; unlock/progression rules remain service-owned |
| Daily Journey/Mission | HIGH | daily mission/mission/progress services | Stage/reward exactly-once behavior cannot move into UI animation state |
| Progress | HIGH | progress owner/storage | New charts may derive existing data; new metrics/persistence are functional |
| Transform/Personality/Psychometrics | HIGH visual, MEDIUM structural | private storage/session/engines | Privacy/result semantics must not be gamified or reinterpreted by UI |
| Games/Kids | HIGH | game launcher/engines/progress | One runtime/service owner; no separate responsive/game copies; assets must not alter rules |
| Avatar Vault | HIGH | avatar service/private storage/API | Unlock/ownership state is functional; grid/collection composition is free |
| Calendar | HIGH | calendar service/API/assignments/congregation | Sharing/recurrence/assignment synthesis are functional/backend; agenda/month presentation is free |
| Private Notes | HIGH | private-notes + `privateStorage` | Device-only property must remain true and visible |
| Cloud Notes | HIGH | cloud-notes + API/session | Sync/auth/error semantics remain owner-controlled |
| Couples local/cloud | HIGH | separate local/cloud services | Warm visual unification must not merge visibility/storage contracts |
| Community/Groups/Encouragements | HIGH | community/group services/API | New sharing/activity concepts may require backend/RLS review |
| Live Rooms | HIGH | live-room service/API | Participant/session lifecycle must remain one owner; avoid duplicate presence runtime |
| Media/Recordings | HIGH | recordings/media/audio manager | One player/audio lifecycle; responsive players must not create parallel audio owners |
| Ministry Hub | HIGH visual/IA | membership + ministry service | Role visibility is not authorization |
| Assignments | HIGH visual/IA | assignment service/API/RLS | Private responses vs peer completion must remain separate; leader/member actions role-checked |
| Notifications | HIGH visual | notification service/API/backend triggers | Do not add client-side notification creation to support redesigned inbox |
| Workspace | HIGH | workspace + cloud notes/reader/storage/congregation | Composition can combine modules, but data owners stay distinct |
| Team/Leaderboards/Recognition | HIGH | respective services + membership/API | Competition vs ministry UI can diverge; role/data visibility stays backend-owned |
| Congregation | HIGH | membership/API/RLS | Member directory/role administration is security-sensitive |
| Content Review/Moderation/Reporting | HIGH visual | moderation/review/reporting services + role/RLS | Decision/provenance/destructive action semantics must remain explicit |
| Account/Auth/Recovery | HIGH visual, MEDIUM structural | session/account/auth storage | Do not create a second auth state or weaken session verification |
| Tutorial | HIGH | tutorial service + router callbacks | Coach marks must reference the one real shell/route DOM, not duplicate controls |
| Accessibility | HIGH | accessibility service/CSS | Preference semantics must survive layout redesign; do not “fix” layouts by weakening settings |
| More hub | HIGH | More page + router callbacks | Categorization is free; hiding/removing destinations is functional IA change |
| Offline/loading/error/denied | HIGH visual | recovery/offline/session/feature owners | State UI can modernize; recovery/auth/permission truth must come from existing owners |

## Highest-priority architectural enablers for v4

1. **Bootstrap-order regression guard** — cheapest protection against an already-proven whole-app failure class.
2. **Migration/RLS execution evidence** — required before any v4 feature changes backend sharing/privacy semantics.
3. **Explicit resource-loading/PWA contract** — correct the false assumption of existing route-level lazy imports before optimizing startup.
4. **One v4 stylesheet owner per migrated surface/family** — prevents a new overlay layer and makes A1/A2 structural redesign sustainable.
5. **Single-owner responsive state rule** — tablet/desktop split panes and mobile list/detail are views of one existing service, never parallel runtimes.
6. **Trust-boundary acceptance matrices** — local/private/cloud and member/leader/admin variants should be part of post-redesign regression evidence.

## Required validation after implementation tranches

- exact-SHA clean-tree assertion and accumulated architecture/static suite;
- shell boot and every changed route with console/page-error capture;
- auth/session/sign-out transitions where Account or shell changes;
- private/local/cloud persistence and backup/export boundaries where Notes/Workspace/Transform/Couples change;
- member/facilitator/leader/pastor/admin/unknown authorization matrix for operational surfaces;
- backend migration-apply + RLS behavior for any schema/policy change;
- PWA normal-browser + installed + cold/offline/update/cache checks, especially if loading topology changes;
- no duplicate subscriptions/audio/timers/network mutations after responsive split-pane/list-detail implementation;
- first-load JS/CSS/image request/byte measurement after major art/foundation work;
- 320/360/390/412/430 plus tablet/desktop and accessibility/reduced-motion tests from A2;
- feature-specific functional flow tests from A4.

## Cross-agent handoffs

### A1 — Design System
Proceed with substantial page-level redesign. Keep the v4 foundation compact and migrate real owners instead of adding another global polish overlay. For art-heavy pages, assume JavaScript modules are currently eager; optimize assets themselves first. A dedicated lazy-loading architecture should be proposed separately if measurements justify it.

### A2 — Responsive/Accessibility
Your split-pane and mobile list/detail proposals are architecturally feasible. Please treat each responsive composition as one feature runtime/service owner and include duplicate-subscription/mutation checks in validation. The offline shell has no authoritative route manifest, so any future route-lazy proposal needs a visited/unvisited offline matrix.

### A4 — UX Flows
Flag any recommendation that introduces cross-route state such as global search, recently viewed, unified drafts, persistent selected-item context, consolidated inbox/activity or new sharing. These are not merely IA improvements; A3 must place them in an existing owner or identify a deliberate new service before implementation.

## Noise rejected

- No recommendation to adopt a framework, bundler or full dependency-injection container merely because v4 is a redesign.
- No recommendation to move authorization, doctrinal policy, storage or backend access into presentation components for convenience.
- No recommendation to pre-emptively refactor every service before page redesign begins.
- No claim that current PWA is broken solely because it lacks a route manifest; the risk becomes material if loading topology is changed.
- No attempt to treat visual sameness as an architecture defect unless it creates duplicate ownership or load-order brittleness.
