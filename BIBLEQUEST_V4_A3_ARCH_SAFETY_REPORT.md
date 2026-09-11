# BibleQuest v4 — A3 Architecture & Safety Report

Agent: `BQ-A3-V4-ARCHITECTURE-SAFETY`
Authority: analysis/reporting only
Central control: `BIBLEQUEST_V4_ANALYSIS_HUB.md`

A3 may update only this file. Do not modify product code, tests, workflows, branches, deployment, Supabase, Cloudflare, or the central hub.

## Latest inspected ref

- Branch: `main`
- Inspected product/documentation HEAD before this report write: `26afe16153b2f69307f9ab81cbdda3ef20c003fe`
- Inspection date: 2026-09-12 JST
- Evidence sources: direct repository inspection (`src/app/bootstrap.js`, `src/core/api.js`, `supabase/migrations/`, `.github/workflows/v3-regression.yml`, `index.html`), plus first-hand implementation/verification history from building and freezing Avatar Vault, Personal Mission, Calendar v1/v1.5, and visual tranche 18 on isolated `postrelease/*` branches this cycle (exact SHAs cited per finding below).
- No package manager or bundler is present (`package.json`: 404). The app is hand-authored native ESM (`<script type="module" src="src/app/bootstrap.js">`) served statically. This is a hard constraint on every A1/A2 recommendation that assumes build-time tooling (CSS pipelines, tree-shaking, image optimization, code-splitting beyond native dynamic `import()`).
- v3 material was treated as historical evidence only. `BIBLEQUEST_V4_ANALYSIS_HUB.md` is authoritative for this report.

## Executive finding

The current architecture is genuinely sound at the ownership level — one API/Supabase boundary (`src/core/api.js`), one feature-per-owner pattern (engine → app service → presentation), one router, RLS-first backend access, and a real exact-SHA verification pipeline (isolated `verify/*` branch → assert exact commit → full accumulated suite → freeze `release/*`). v4 should **preserve this skeleton** even while radically changing presentation. The real risks are not "the architecture is wrong" but four specific, reproducible weaknesses that will get *worse*, not better, as v4 adds more services and pages faster than v3 did:

1. **No compile-time or test-time protection against dependency-ordering bugs in `bootstrap.js`.** This is not theoretical — it caused two real, CI-verified production-blocking regressions this cycle alone (cited below), both from the same root cause.
2. **CI never executes real SQL against a live Postgres instance.** "Accumulated architecture validators" and "edge regressions" pass or fail based on static file/token checks and in-memory JS logic, not actual RLS/schema behavior. A migration can be syntactically fine, reference the correct tables, and still never have been proven to actually apply or enforce its policies.
3. **A recurring "stale future-state assertion" defect class in the validator scripts themselves** — validators encode assumptions like "row N must remain Not started" that become false the moment a later milestone ships, and nothing catches this except the next milestone's own gate failing.
4. **`bootstrap.js` and `src/core/api.js` are both growing, single, manually-maintained files** (bootstrap.js is already several hundred lines of hand-ordered `const` declarations; api.js is a single large object literal). Both are structurally sound today but will become the two highest-merge-conflict, highest-regression-risk files in the repo as v4 accelerates page-level work in parallel.

None of this blocks starting v4. It does mean A1's proposed migration ("compact v4 foundation, then redesign pages as page-specific compositions") is architecturally compatible with the current system **only if** the ownership boundaries below are respected page-by-page, and **only if** items 1 and 2 get a lightweight mitigation before the redesign pace increases.

## Boundary / feasibility matrix

| Boundary | Current owner | v4 redesign feasibility | Risk if violated |
|---|---|---|---|
| Backend/Supabase access | `src/core/api.js` (sole client boundary; every feature calls `api.<namespace>`, never `createClient` directly) | Fully compatible with any visual redesign. No v4 page should ever import a Supabase client directly. | Duplicate backend ownership, inconsistent auth/session handling, RLS bypassed by a different code path |
| Routing/navigation | `src/app/router.js` + the single route map in `bootstrap.js` | Compatible; v4 chrome (A1-V4-001) can be a pure presentation change on top of the same route map. Adding/removing routes is FUNCTION-AFFECTING, not DESIGN-ONLY. | Duplicate router/shell runtime (explicitly forbidden by the hub) |
| Feature state/logic | One `src/app/<feature>.js` service per feature, each independently testable | Compatible; v4 pages should still be "dumb" presentation calling an unchanged service, per A1's own framing | Logic duplicated into presentation layer, breaking the engine/service/UI split that makes the accumulated test suite possible |
| Congregation/ministry authorization | `src/app/congregation-membership.js` (`can()`/`assert()`, backed by `private.bible_role_in_congregation` in Postgres) | Any v4 surface that shows role-gated UI (Ministry Hub, Assignments, Content Review, Admin, Calendar sharing) must call this existing check, never re-derive role from a cached display field | A second, slightly different definition of "who counts as a leader" — a real privacy/authorization bug, not a visual one |
| Notification delivery | Database triggers only (e.g. `private.bible_calendar_event_notify`); `bible_notifications` has no client-side insert grant | v4 can redesign the Notification Center inbox UI freely; it must not add a new insert path from the client for any feature | A client-writable notifications table lets any authenticated user spoof notifications to other users |
| Private vs. peer-visible data | Physically separate tables/columns (e.g. `bible_assignment_progress` = private response text vs. `bible_assignment_response_presence` = peer-visible completion only, synced by a `security definer` trigger) | v4's "operational/trust" surface family (A1-V4-006) is safe to build on this as-is | Merging these back into one table "for a simpler v4 data model" would be a real privacy regression |
| Styling assembly | `index.html` globally loads all feature CSS + `*-visual-polish.css`/`*-phase-b.css` overlays before the app boots (A1-V4-002) | Migratable page-by-page. Each page's CSS can be replaced/consolidated independently as long as the file is still linked from `index.html` and selectors keep targeting the same `data-*`/class hooks the service-produced markup already uses | A partial migration that leaves two competing stylesheets targeting the same selector with different specificity — exactly the failure mode A1 is trying to avoid |
| Service instantiation order | Hand-ordered `const` declarations in `bootstrap.js`, no dependency graph, no lazy binding | Adding a v4-only presentation service (e.g. a shared "app shell state" or "theme" service) is safe *only if* its position in the file is deliberately checked against every service it reads from | Temporal-dead-zone `ReferenceError` at boot — see finding A3-V4-002, reproduced twice this cycle |
| Verification pipeline | Isolated `verify/*` branch per candidate, exact-SHA assertion, full accumulated suite, then `release/*` freeze | Works for any change class including pure DESIGN-ONLY, but is heavyweight (branch + workflow edit + poll + restore + freeze) for changes that only touch CSS/markup with zero logic risk | Skipping the gate "because it's just CSS" is how the two dependency-ordering regressions below would have reached `release/*` undetected if they hadn't happened to also touch a service file |

## Prioritized findings

### A3-V4-001 — CI never proves a migration actually works against real Postgres

- Exact branch/SHA: reproduced first while investigating `feature/v3-psychometrics` → `release/v3.54-psychometrics` bookkeeping, then again on `postrelease/v3-avatar-vault` and `postrelease/v3-calendar` this cycle; general pattern confirmed by reading `.github/workflows/v3-regression.yml` on `main` @ `26afe1615`.
- Route/surface: every feature with a `supabase/migrations/*.sql` file — currently Avatar Vault, Calendar (personal + v1.5 congregation-sharing), Assignment Private Responses, and any prior feature with RLS.
- Evidence: the accumulated regression workflow runs `scripts/validate-v3-*.mjs` (static file/token checks) and `tests/v3-*-edge.mjs` (in-memory JS unit tests against mocked `api` objects) and Playwright browser tests against the statically-served app. None of these steps connect to a Postgres instance, run `supabase db push`, or execute the migration SQL. I confirmed this directly: a migration that granted column-level `UPDATE` privileges on a column that was **never actually created** (a real defect in an earlier `bible_congregation_members` migration) passed every CI gate for weeks, because nothing in CI ever ran the SQL that would have failed on that grant statement.
- Category: ARCHITECTURE / TEST COVERAGE GAP
- Severity: HIGH
- Problem: "the accumulated suite is green" is not evidence that a migration is syntactically valid, applies cleanly to the current production schema, or that its RLS policies behave as written. The only real check today is a human (or agent) reading the SQL.
- Why this matters more for v4 than it did for v3: v3's schema was mostly stable by the time of the production release; v4's stated design freedom ("page structure and information hierarchy may be reconsidered") will likely generate new congregation-shared/social surfaces (the hub explicitly lists Community, Couples, Live Rooms, Calendar as redesign targets), each a candidate for new tables/RLS. The current gap means v4 could ship several plausible-looking migrations in a row with nobody discovering a broken policy until it's live.
- Recommended v4 direction: add one lightweight CI job that spins up an ephemeral Postgres (e.g. via a service container) and runs every migration in order against a scratch database as a pure syntax/apply smoke test — not full RLS behavioral testing, just "does `supabase db push`-equivalent SQL actually execute cleanly end to end." This is additive to the existing pipeline, not a replacement.
- Change class: ARCHITECTURE-AFFECTING (CI-only; no product runtime change).
- True owner: `.github/workflows/v3-regression.yml` (or a new sibling workflow) + `supabase/migrations/`.
- Dependencies: none functional; needs captain/ops decision on CI minutes budget for a Postgres service container.
- Proof needed after implementation: intentionally break a migration in a test PR and confirm the new job fails; confirm it does not fail on the current, already-deployed migration history.
- Confidence: HIGH (directly reproduced, not inferred).

### A3-V4-002 — `bootstrap.js`'s manual service ordering has already caused two real regressions this cycle

- Exact branch/SHA: `postrelease/v3-calendar` (first functional gate failure, run `34599782019`, root-caused via GitHub's check-run annotations API since job logs are blob-hosted and unreachable from a sandboxed inspector) and `postrelease/v3-avatar-vault-v2` (caught locally before CI, same defect class).
- Route/surface: `src/app/bootstrap.js`, all routes indirectly (a boot-time crash here breaks the entire app shell, not just one page).
- Evidence: in both cases, a new service (`calendar`, then `avatarVault`) was instantiated with `const x = createXService({ ...,  assignments })` **before** `const assignments = createAssignmentsService(...)` had been declared later in the same file. Because `bootstrap.js` uses `const`/`let` throughout, this is a temporal-dead-zone `ReferenceError` at module evaluation time — it doesn't throw inside a try/catch anywhere; it aborts `start()` before the shell ever renders. The first occurrence took down `tests/v3-shell-smoke.mjs` (the very first smoke test in the accumulated suite) with a generic "shell never rendered" timeout, which does not obviously point at the real cause.
- Category: ARCHITECTURE / RELIABILITY
- Severity: HIGH
- Problem: there is no mechanism — lint rule, unit test, or dependency graph — that catches "service A is instantiated before the service B it depends on" except the full browser-smoke step of the CI pipeline, which fails opaquely (a shell-render timeout, not a pointer to the actual line).
- Why this will get worse in v4: v4's stated direction adds shared cross-cutting concerns (a shell/theme service, possibly a shared "app state" for the new chrome in A1-V4-001) on top of an already-large hand-ordered file. Every new dependency edge is another chance to reintroduce this exact bug, and the failure signature (shell timeout) will keep looking unrelated to its actual cause.
- Recommended v4 direction: two independent, low-risk mitigations, either is sufficient and both are cheap:
  1. A pure static test (`tests/v3-bootstrap-order-edge.mjs` or similar) that parses `bootstrap.js`'s `const X=create...Service({...})` declarations and asserts every identifier referenced inside a call's argument object was declared on an earlier line. This is a few dozen lines of regex/string-index logic, no new runtime dependency.
  2. Alternatively, restructure `bootstrap.js`'s service block as a small ordered array of `[name, factory]` pairs resolved by a trivial dependency-injection helper that throws a clear, named error ("calendar requires assignments, which is not yet defined") instead of a bare `ReferenceError`. This is a larger change and should be scoped as its own dependency-safe milestone, not bundled into a visual tranche.
- Change class: ARCHITECTURE-AFFECTING. Not a visual change; should not be attempted inside a DESIGN-ONLY v4 page tranche.
- True owner: `src/app/bootstrap.js`.
- Dependencies: none; independent of any specific page redesign.
- Proof needed: introduce a deliberately misordered service in a test branch and confirm the new check (option 1) or clearer error (option 2) catches it before the browser-smoke step.
- Confidence: HIGH (directly reproduced twice, not inferred).

### A3-V4-003 — Validator scripts encode "must still be true right now" assertions that expire on their own

- Exact branch/SHA: documented pattern first named in `DEVELOPMENT_STATUS_V3.md`'s defect ledger as "the same defect class as the documented #80/#81 fix"; reproduced again this cycle in `scripts/validate-v3-avatar-vault.mjs`, which asserted `Inventory #83 Innovation suite must remain Not started during #82` and had to be narrowed the moment #83 shipped.
- Route/surface: `scripts/validate-v3-*.mjs`, i.e. the architecture-boundary layer of the accumulated test suite itself.
- Evidence: several validators assert not just "this feature's own contract holds" but "a *different*, later feature's inventory row is still in state X" — a snapshot of the world at the time the validator was written, not an invariant. Every time the referenced later feature actually ships, its own gate fails against an assertion that was never about its own correctness.
- Category: TEST DESIGN / PROCESS
- Severity: MEDIUM
- Problem: this is not a bug in any single validator; it's a recurring authoring pattern that will keep costing one wasted gate-run + root-cause cycle per milestone, indefinitely, unless the pattern itself changes.
- Recommended v4 direction: validators should assert a feature's own contract and, where cross-feature ordering genuinely matters (e.g. "the inventory ledger's summary counts must match its rows," which is a real invariant, not a snapshot), assert the *relationship* rather than a specific frozen value. Reserve "must still be Not started" phrasing for cases where the hub/captain has explicitly deferred that specific row, and drop it once the row is picked up.
- Change class: ARCHITECTURE-AFFECTING (test-suite only).
- True owner: `scripts/validate-v3-*.mjs` collectively; no single file owns this pattern.
- Dependencies: none.
- Confidence: MEDIUM (pattern confirmed twice; not yet proven to recur a third time, but the mechanism that produces it is unchanged).

### A3-V4-004 — No build step means A1's asset/performance rules need one addition: an explicit "what loads on first boot" convention

- Exact branch/SHA: `main` @ `26afe1615`; confirmed via absence of `package.json` and the single static `<script type="module">` entry point in `index.html`.
- Route/surface: global; especially relevant to A1-V4-005 (game art) and A1-V4-010 (page-specific backgrounds/illustration).
- Evidence: `index.html` currently links every feature's CSS file unconditionally, and there is no bundler to code-split, defer, or lazy-load per-route assets. Feature *JavaScript* already gets this for free via native dynamic `import()` inside route factories in `bootstrap.js` (confirmed pattern: pages are imported and instantiated lazily by route, not all upfront) — but CSS and any new raster/SVG art referenced from `index.html` or eagerly-imported modules does not.
- Category: PERFORMANCE / ARCHITECTURE
- Severity: MEDIUM
- Problem: A1's own asset rules ("avoid loading page-specific heavy artwork on first boot if the route is not visible") are correct in principle but currently unenforceable for CSS/art without a stated convention, since nothing prevents a new feature's stylesheet or hero image from being added to the global `<head>` link chain the same way every prior tranche was.
- Recommended v4 direction: adopt one explicit rule for v4 pages — global/shell CSS and assets stay eagerly linked in `index.html`; **page-specific** decorative art (illustrations, hero images, game-mode art) is only referenced from within that page's own lazily-imported module (e.g. set as a CSS custom property or `background-image` from JS after the route mounts), never from a global stylesheet link. This requires no new tooling, just a convention plus a static check (an extension of the existing `*-static.mjs` test pattern already used for visual-polish tranches) that flags any new `<link>` added to `index.html` for a route-specific asset.
- Change class: ARCHITECTURE-AFFECTING for the convention/test; DESIGN-ONLY for individual pages that follow it.
- True owner: `index.html` + each feature's presentation module.
- Dependencies: A1's asset strategy; A2 first-load performance budget.
- Confidence: MEDIUM (the gap is confirmed; the specific mitigation is a proposal, not something already validated in this codebase).

### A3-V4-005 — `bootstrap.js` and `src/core/api.js` are correct today but are becoming the two highest-risk single files in the repo

- Exact branch/SHA: `main` @ `26afe1615`.
- Route/surface: global composition (`bootstrap.js`) and the entire backend boundary (`api.js`).
- Evidence: every feature added this cycle (Avatar Vault, Personal Mission, Calendar, Calendar v1.5) required an edit to both files — a new `import`, a new `const` instantiation in a specific position, a new route-map entry, and (for `api.js`) a new namespace object appended to one large `Object.freeze({...})` export. Both files are already large enough that finding the correct insertion point requires reading most of the file first, and both are exactly the files A3-V4-002's ordering bug lives in.
- Category: ARCHITECTURE / MAINTAINABILITY
- Severity: MEDIUM
- Problem: this is not urgent, but it is the single clearest predictor of where v4's *page-level* parallel work (many pages redesigned across possibly-parallel tranches, per the hub's own model) will produce merge conflicts and ordering bugs, precisely because every page still funnels through these two shared files no matter how independent its visual redesign is.
- Recommended v4 direction: not an immediate rewrite. As a **dependency-safe, non-visual follow-up milestone** (explicitly not bundled into any page redesign), consider splitting `bootstrap.js`'s service instantiation into a handful of domain-grouped modules (e.g. "learning services," "community services," "ministry/admin services") that `bootstrap.js` composes, and splitting `api.js`'s namespaces similarly. This is purely organizational and should not change any owner's public shape.
- Change class: ARCHITECTURE-AFFECTING.
- True owner: `src/app/bootstrap.js`, `src/core/api.js`.
- Dependencies: should follow, not precede, A3-V4-002's mitigation (fixing the ordering-safety net first makes any later split safer to verify).
- Confidence: MEDIUM (a maintainability projection, not a currently-reproduced failure).

## Feasibility notes on A1's specific proposals

- **A1-V4-001 (new shell/chrome)** — architecturally safe. The shell is presentation over the existing router/route-map; a full chrome redesign touches no backend/service boundary as long as no new routes are silently added/removed as a side effect (that would be FUNCTION-AFFECTING, needs A4/captain sign-off per the hub's own rule).
- **A1-V4-002 (CSS foundation migration, page-by-page)** — architecturally safe and directly compatible with the existing `visual-polish`-tranche verification pattern already proven this cycle (isolated branch, static contract test, functional gate, freeze). Recommend the v4 foundation migration reuse that exact pipeline rather than inventing a new one.
- **A1-V4-006 (separate "operational/trust" design language for Account/Ministry/Assignments/Workspace/Congregation/Content-Review/Admin)** — strongly endorsed from a security/trust standpoint; this boundary already exists at the ownership level (each is its own service behind `api.js`) and redesigning their presentation does not require touching RLS or authorization, provided role-gated UI continues to call the existing `congregation.can()`/`assert()` checks rather than re-deriving role from cached display data.
- **Any v4 proposal that adds a new social/sharing surface** (Community, Couples, Live Rooms redesigns are explicitly in scope per the hub) should budget for a new migration + RLS review using the exact-SHA verification pipeline already established, and should be the first beneficiary of A3-V4-001's proposed CI Postgres smoke test if that lands first.

## Noise rejected

- Not flagging the lack of a bundler as something that must be fixed before v4 can proceed — it's a real constraint (A3-V4-004), not a blocker, and introducing one now would itself be an ARCHITECTURE-AFFECTING change requiring explicit captain approval, not a byproduct of a visual redesign.
- Not recommending a full dependency-injection framework or rewrite of `bootstrap.js`/`api.js` — the lightweight mitigations in A3-V4-002/A3-V4-005 are proportionate to the actual, observed failure mode.
- Not treating every CSS file as a security concern; the `*-visual-polish.css` layering A1 criticizes on design grounds (A1-V4-002) is not itself an architecture-safety problem — it is verifiably decorative-only today (a static test enforces no `display`/`transform`/`transition`/layout properties in polish-tranche files), which is precisely why it is *safe* to migrate page-by-page rather than urgent to fix all at once.

## Cross-agent handoff

### A1 — Design System
The CSS-migration pipeline your report calls for already has a proven, working template from this cycle's visual-polish tranches (isolated branch → static contract test asserting no layout/motion properties → functional gate → freeze). Reuse it verbatim for the v4 foundation migration rather than designing a new verification approach.

### A2 — Responsive/Accessibility
Please validate that A3-V4-004's "page-specific assets load only from within their own lazily-imported module" convention doesn't fight against your first-load/perceived-performance recommendations — in particular, confirm it doesn't introduce a visible flash-of-unstyled-content for page-specific hero art on first navigation, at 320–430px.

### A4 — UX Flows
A3-V4-002 and A3-V4-005 are both about *reliability of shipping*, not user-facing flow — no action needed from A4 unless a proposed IA change would require a genuinely new cross-cutting service (e.g. a global "recently viewed" or "search" feature spanning many pages), in which case flag it back to A3 before implementation so it can be sequenced after the ordering-safety mitigation.
