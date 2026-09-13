# BibleQuest V5 Lab A5 — Greenfield Architecture Status

Updated: 2026-09-13 JST
Branch: `lab/v5-a5-greenfield`
Baseline origin: `1f504dec812f11453f82e30af61cdf3d6c547060`
Current lab HEAD before this status update: `b3a0542648dc575b9a50e1b0ab781f829e686264`
Lab identity: `BQ-V5-A5-GREENFIELD`

## Hypothesis

A clean typed client runtime can replace the V4 bootstrap/router/view ownership while preserving valuable domain, security, privacy, data and product contracts. The experiment is successful only if the new architecture reaches parity with less ownership coupling and measurable testability; greenfield freedom is not permission to silently drop features.

## Architecture blueprint

- `v5.html` is the isolated greenfield browser entry; production `index.html` remains untouched until parity evidence justifies any cutover.
- Vite owns the lab build graph and production-style artifacts.
- `src/v5/app/` owns application composition only.
- `src/v5/platform/router/` owns URL parsing/navigation and exposes typed route snapshots plus typed route context.
- `src/v5/platform/session/` owns typed auth/session state through a source/service boundary without becoming an authorization source.
- Feature views consume platform services by dependency injection rather than importing mutable singletons.
- Server authorization/RLS remain authoritative; UI session/capability state is presentation only.
- Route modules are lazy-loaded from a typed route registry.
- Cross-feature state is not placed into one giant global store.

## Implemented slices

### Tranche 1 — isolated typed shell/runtime boundary
Status: IMPLEMENTED, BUILD EVIDENCE PENDING

Isolated `v5.html`; Vite/TypeScript-capable configuration; typed route contract/registry; framework-free router; typed shell seam; lazy Home/Not Found; primary-route placeholders; greenfield-only CSS; stale async render suppression; singular `aria-current` ownership.

### Tranche 2 — zero-dependency architecture contract gate
Status: IMPLEMENTED, EXACT-BRANCH EXECUTION PENDING

Added `tests/v5-greenfield-architecture.mjs` plus `npm run test:architecture:v5`. This is an architecture guard, not browser/security parity proof.

### Tranche 3 — typed session + route-context vertical slice
Status: IMPLEMENTED, BUILD/BROWSER EVIDENCE PENDING

Added typed `SessionSnapshot`, `SessionSource` and `SessionService` contracts; a narrow session service with boot/read/subscribe/dispose ownership; explicit unavailable-source behavior for the isolated lab; typed `RouteContext`; shell-level dependency injection; and a lazy Account route that renders session states without owning authorization. The lab does not connect production Supabase or implement sign-in yet.

## Parity matrix

| Area | V4 accepted behavior | Greenfield state | Status |
| --- | --- | --- | --- |
| Boot | `index.html` -> `src/app/bootstrap.js` | isolated `v5.html` -> `src/v5/main.ts` | PROTOTYPE |
| Router/deep link | hash routes, unknown -> not-found | typed hash router, unknown -> not-found | PARTIAL |
| App shell | V4 shell/nav/bootstrap owner | new shell owner + typed route context | PARTIAL |
| Session/auth | production session/auth owner | typed source/service boundary + unavailable lab adapter; no sign-in | PARTIAL |
| Account | production account surface | read-only session-state slice | PARTIAL |
| Home | production feature | minimal architectural proof route | NOT PARITY |
| Reader | production feature | registered placeholder only | MISSING |
| Games | production feature | registered placeholder only | MISSING |
| Community/ministry/admin | production features | registered placeholder / not migrated | MISSING |
| Media | production feature | not migrated | MISSING |
| Offline/PWA | production install/runtime behavior | no greenfield SW contract yet | MISSING |
| Supabase/RLS | protected production contracts | policy preserved; no production client connection | PRESERVED/UNUSED |
| Accessibility | production baseline | semantic shell, focus handoff, reduced motion, Account live session status; browser proof pending | PARTIAL |

## Tests and evidence

- Branch lineage remains derived from accepted planning SHA `1f504dec812f11453f82e30af61cdf3d6c547060`.
- V4 `src/app/session.js` was inspected as behavioral evidence before defining the new contract. The lab preserved the important separation between identity/session state and server authorization, but did not copy the old owner.
- No production Supabase URL/key, service-role secret, RLS bypass or backend mutation was introduced.
- Exact-branch package install/typecheck/build/browser evidence remains pending because prior package resolution repeatedly timed out.
- Draft PR #191 remains `[LAB ONLY][DO NOT MERGE]` and draft-only for CI evidence.

## Failures / unresolved evidence

- No lockfile because dependency resolution previously timed out.
- No exact-branch `npm ci`, typecheck, Vite build, browser run, PWA test or deployed-preview result is claimed green for this tranche.
- The current session source intentionally reports unavailable; production auth wiring is not yet implemented.
- Account is a read-only architectural slice, not feature parity.
- Reader, Games, data repositories beyond session, offline/PWA and protected feature surfaces remain unmigrated.

## Architecture decisions learned

1. Route-context dependency injection gives feature modules access to narrow platform contracts without recreating a global mutable app store.
2. Session state can be modeled as an explicit source/service boundary independent of Supabase client details and independent of authorization decisions.
3. A greenfield route can consume session state without owning authentication mechanics or backend permissions.
4. The isolated unavailable adapter is safer than embedding production configuration merely to make the experimental UI appear connected.
5. Session lifecycle belongs at app composition/shell scope; route views only subscribe and clean up their own listeners.

## Known debt

- exact shipped-route inventory still needs representation in a typed parity registry;
- production auth adapter and active-congregation context are not modeled;
- no general repository/data-access boundary exists beyond the session source contract;
- no offline/cache update model exists;
- no deterministic build identity or bundle budget exists;
- dependency lock/build evidence remains blocked by package-resolution availability;
- architecture checker should be expanded to guard typed session/route-context ownership and executed against the exact branch.

## Next 3 tasks

1. Obtain deterministic dependency lock/typecheck/build evidence and run `test:architecture:v5` against the exact branch; repair any real type-contract failures rather than weakening checks.
2. Introduce one read-only protected-data repository behind the route context and migrate one meaningful existing feature slice without bypassing backend authorization/RLS.
3. Add active-congregation context separately from authentication identity and expand behavioral tests for session transitions, route cleanup and rapid navigation.

## Viability

**VIABLE — CONTINUE.**

The greenfield architecture now demonstrates shell/router/session/view separation without copying the V4 bootstrap/session owner or connecting privileged backend state. Superiority over incremental migration is still unproven until a real protected data-backed feature and deterministic build/browser evidence are green.
