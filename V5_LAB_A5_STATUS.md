# BibleQuest V5 Lab A5 — Greenfield Architecture Status

Updated: 2026-09-13 JST
Branch: `lab/v5-a5-greenfield`
Baseline origin: `1f504dec812f11453f82e30af61cdf3d6c547060`
Current lab HEAD before this status update: `3e3276efba4a297957cb27d55439cc7f4db9b334`
Lab identity: `BQ-V5-A5-GREENFIELD`

## Hypothesis

A clean typed client runtime can replace the V4 bootstrap/router/view ownership while preserving valuable domain, security, privacy, data and product contracts. The experiment is successful only if the new architecture reaches parity with less ownership coupling and measurable testability; greenfield freedom is not permission to silently drop features.

## Architecture blueprint

- `v5.html` is the isolated greenfield browser entry; production `index.html` remains untouched until parity evidence justifies any cutover.
- Vite owns the lab build graph and production-style artifacts.
- `src/v5/app/` owns application composition only.
- `src/v5/platform/router/` owns URL parsing/navigation and exposes typed route snapshots plus typed route context.
- `src/v5/platform/session/` owns typed auth/session state through a source/service boundary without becoming an authorization source.
- `src/v5/platform/congregation/` owns active-congregation context separately from authentication identity.
- `src/v5/data/` owns feature repository contracts/adapters; feature views do not create backend clients or issue direct network requests.
- Feature views consume platform/data services by dependency injection rather than importing mutable singletons.
- Server authorization/RLS remain authoritative; UI session/capability state is presentation only.
- Route modules are lazy-loaded from a typed route registry.
- Cross-feature state is not placed into one giant global store.

## Implemented slices

### Tranche 1 — isolated typed shell/runtime boundary
Status: IMPLEMENTED, BUILD EVIDENCE PENDING

Isolated `v5.html`; Vite/TypeScript-capable configuration; typed route contract/registry; framework-free router; typed shell seam; lazy Home/Not Found; primary-route placeholders; greenfield-only CSS; stale async render suppression; singular `aria-current` ownership.

### Tranche 2 — zero-dependency architecture contract gate
Status: IMPLEMENTED, EXACT-BRANCH CI PASS

Added `tests/v5-greenfield-architecture.mjs` plus `npm run test:architecture:v5`. This is an architecture guard, not browser/security parity proof.

### Tranche 3 — typed session + route-context vertical slice
Status: IMPLEMENTED, BUILD/BROWSER EVIDENCE PENDING

Added typed `SessionSnapshot`, `SessionSource` and `SessionService` contracts; a narrow session service with boot/read/subscribe/dispose ownership; explicit unavailable-source behavior for the isolated lab; typed `RouteContext`; shell-level dependency injection; and a lazy Account route that renders session states without owning authorization. The lab does not connect production Supabase or implement sign-in yet.

### Tranche 4 — congregation context + protected read-only assignments boundary
Status: IMPLEMENTED, BACKEND PARITY/BUILD/BROWSER EVIDENCE PENDING

Added a congregation-context service contract independent of session identity, a typed read-only `AssignmentsRepository`, an explicit fail-closed unavailable adapter, and a lazy Tasks route. The Tasks view refuses repository access unless the session is authenticated and an active congregation is selected. It contains no direct `fetch`, Supabase client, service-role credential path or local fabricated protected-data fallback. Repository results are rendered only after the current request remains live; route cleanup invalidates stale async results.

### Tranche 5 — dependency-free protected feature behavioral proof
Status: IMPLEMENTED, EXACT-BRANCH CI PASS

Added `tests/v5-assignments-behavior.mjs`, executed through Node 22 native TypeScript stripping, to exercise the real `src/v5/features/assignments/view.ts` module with deterministic fake session/congregation/repository services and a minimal fake DOM. The suite asserts: remote-unavailable fail-closed behavior, signed-out fail-closed behavior, missing-congregation fail-closed behavior, exact user/congregation scoping for authorized reads, suppression of stale results after congregation changes, and cleanup/unsubscribe suppression of late results.

Added `.github/workflows/v5-lab-a5-greenfield.yml` as a lab-only, read-only-permission evidence workflow. It runs the architecture contract and assignments behavior suites on the draft lab PR using Node 22.12 without production secrets or package installation. It does not deploy or contact Supabase.

## Parity matrix

| Area | V4 accepted behavior | Greenfield state | Status |
| --- | --- | --- | --- |
| Boot | `index.html` -> `src/app/bootstrap.js` | isolated `v5.html` -> `src/v5/main.ts` | PROTOTYPE |
| Router/deep link | hash routes, unknown -> not-found | typed hash router, unknown -> not-found | PARTIAL |
| App shell | V4 shell/nav/bootstrap owner | new shell owner + typed route context | PARTIAL |
| Session/auth | production session/auth owner | typed source/service boundary + unavailable lab adapter; no sign-in | PARTIAL |
| Congregation context | selected membership drives protected features | separate typed context boundary + unavailable lab adapter | PARTIAL |
| Account | production account surface | read-only session-state slice | PARTIAL |
| Assignments | protected congregation-scoped assignments and progress | lazy read-only repository/view boundary + deterministic behavior tests; backend adapter intentionally unavailable | PARTIAL ARCHITECTURE / BEHAVIOR-GATED / NO DATA PARITY |
| Home | production feature | minimal architectural proof route | NOT PARITY |
| Reader | production feature | registered placeholder only | MISSING |
| Games | production feature | registered placeholder only | MISSING |
| Community/ministry/admin | production features | registered placeholder / not migrated | MISSING |
| Media | production feature | not migrated | MISSING |
| Offline/PWA | production install/runtime behavior | no greenfield SW contract yet | MISSING |
| Supabase/RLS | protected production contracts | policy preserved; no production client connection | PRESERVED/UNUSED |
| Accessibility | production baseline | semantic shell, focus handoff, reduced motion, Account live status, Tasks status/error states; browser proof pending | PARTIAL |

## Tests and evidence

- Branch lineage remains derived from accepted planning SHA `1f504dec812f11453f82e30af61cdf3d6c547060`.
- Exact tested code head is `3e3276efba4a297957cb27d55439cc7f4db9b334`.
- GitHub Actions run `34736628661`, job `dependency-free-contracts`, completed successfully on that exact head with Node 22.12.
- `Greenfield architecture contracts` step: PASS.
- `Protected assignments behavior` step: PASS.
- `tests/v5-assignments-behavior.mjs` imports the real greenfield assignments view rather than reimplementing its decision logic. It uses only deterministic fake boundaries and does not require credentials/network/backend access.
- The lab CI workflow has `permissions: contents: read`, is branch-gated to `lab/v5-a5-greenfield` for pull-request execution, and contains no deployment or secret-consuming step.
- No production Supabase URL/key, service-role secret, RLS bypass or backend mutation was introduced.
- Draft PR #191 remains `[LAB ONLY][DO NOT MERGE]` and draft-only for CI evidence.
- Other inherited PR workflows were still running when this status was updated; they are not counted as passed here.

## Failures / unresolved evidence

- Local git checkout/execution remains blocked in this automation environment by DNS failure resolving `github.com`; exact-head behavioral proof therefore comes from GitHub Actions, not the local container.
- No lockfile because dependency resolution previously timed out.
- No exact-branch `npm ci`, TypeScript typecheck, Vite build, browser run, PWA test or deployed-preview result is claimed green for this tranche.
- The current session and congregation adapters intentionally report unavailable; production auth/membership wiring is not implemented.
- The assignments repository intentionally fails closed; no real protected-data request is claimed successful.
- Existing V4 assignment mutation, publisher, response-review and realtime behavior are not migrated.
- Reader, Games, offline/PWA and most protected feature surfaces remain unmigrated.

## Architecture decisions learned

1. Route-context dependency injection can carry narrow platform and repository contracts without recreating a global mutable app store.
2. Authentication identity and active-congregation context should be separate owners; protected feature data requires both.
3. A feature view can prove authorization-safe request gating without owning Supabase or credentials.
4. The repository boundary is the correct place for a future Supabase/RPC adapter; views should not know transport details.
5. An unavailable adapter is preferable to invented local protected data because it keeps missing backend parity visible and fail-closed.
6. Protected route cleanup needs request-version invalidation in addition to subscription cleanup so stale async results cannot render after navigation/context changes.
7. Node 22 native TypeScript stripping provides a useful zero-dependency test path for leaf TypeScript modules whose runtime imports are dependency-free; this can protect architecture behavior even while npm resolution is unavailable.
8. Lab-only CI can provide exact-head behavioral evidence without introducing deployment authority, backend credentials or production coupling.

## Known debt

- exact shipped-route inventory still needs representation in a typed parity registry;
- production auth adapter, membership loader and congregation selection workflow are not connected;
- no real Supabase/RPC assignments adapter exists and its exact V4 server contract must be characterized before implementation;
- assignment detail/mutations/ministry review/privacy behavior remain unmigrated;
- no offline/cache update model exists;
- no deterministic build identity or bundle budget exists;
- dependency lock/build evidence remains blocked by package-resolution availability;
- browser-level accessibility and route behavior remain unproven;
- real RLS/backend authorization remains unproven in this lab.

## Next 3 tasks

1. Characterize the accepted V4 assignments API/RLS contract and implement a transport adapter only if it can preserve selected-congregation scoping and server authorization without embedding privileged configuration.
2. Obtain deterministic dependency lock/typecheck/build/browser evidence and repair any real type/runtime failures; then connect an isolated local/ephemeral protected read before considering functional data parity.
3. Extend the same deterministic behavior-test pattern to active-congregation/session transitions once a real local transport adapter exists, including unauthorized/error mapping and tenant-switch cancellation.

## Viability

**VIABLE — CONTINUE.**

The lab now demonstrates separate router/shell, session, congregation-context and protected repository/view owners plus exact-head CI-passing behavioral tests that directly import the new protected feature view. This is stronger evidence that the greenfield architecture is testable without recreating V4 monoliths. Superiority over incremental migration remains unproven until deterministic build/browser evidence and at least one real RLS-protected backend read reach parity.
