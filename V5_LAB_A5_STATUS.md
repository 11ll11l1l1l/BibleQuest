# BibleQuest V5 Lab A5 — Greenfield Architecture Status

Updated: 2026-09-13 JST
Branch: `lab/v5-a5-greenfield`
Baseline origin: `1f504dec812f11453f82e30af61cdf3d6c547060`
Current lab HEAD before this status update: `b89be1003c4ad612e0f7e2aec6c32d122c6803d1`
Lab identity: `BQ-V5-A5-GREENFIELD`

## Hypothesis

A clean typed client runtime can replace the V4 bootstrap/router/view ownership while preserving valuable domain, security, privacy, data and product contracts. The experiment is successful only if the new architecture reaches parity with less ownership coupling and measurable testability; greenfield freedom is not permission to silently drop features.

## Architecture blueprint

- `v5.html` is the isolated greenfield browser entry; production `index.html` remains untouched until parity evidence justifies any cutover.
- Vite owns the lab build graph and production-style artifacts.
- `src/v5/app/` owns application composition only.
- `src/v5/platform/router/` owns URL parsing/navigation and exposes typed route snapshots.
- `src/v5/platform/session/` will own typed auth/session state without becoming an authorization source.
- `src/v5/platform/data/` will define repositories over existing protected backend contracts rather than exposing ad-hoc remote calls to views.
- `src/v5/features/*` owns route/domain UI and feature-local state.
- Server authorization/RLS remain authoritative; UI capability checks are presentation only.
- Route modules are lazy-loaded from a typed route registry.
- Cross-feature state is not placed into one giant global store.

## Implemented slices

### Tranche 1 — isolated typed shell/runtime boundary
Status: IMPLEMENTED, BUILD EVIDENCE PENDING

Implemented: isolated `v5.html`; Vite/TypeScript-capable configuration; typed route contract/registry; framework-free router; typed shell seam; lazy Home/Not Found; primary-route placeholders; greenfield-only CSS; stale async render suppression; singular `aria-current` ownership.

### Tranche 2 — zero-dependency architecture contract gate
Status: IMPLEMENTED, EXACT-BRANCH EXECUTION PENDING

Added `tests/v5-greenfield-architecture.mjs` plus `npm run test:architecture:v5`. The gate intentionally needs only Node, so architecture isolation can be checked even when npm registry access is unavailable. It asserts exact dependency pins, isolated Vite output/entry, separation from V4 bootstrap/CSS ownership, lazy Home/Not Found route modules, stale-render and active-route accessibility seams, and absence of service-role/direct-Supabase-client patterns in the current shell/route entry surface.

This is an architecture guard, not browser/security parity proof. It does not substitute for typecheck/build/browser/PWA/RLS evidence.

## Parity matrix

| Area | V4 accepted behavior | Greenfield state | Status |
| --- | --- | --- | --- |
| Boot | `index.html` -> `src/app/bootstrap.js` | isolated `v5.html` -> `src/v5/main.ts` | PROTOTYPE |
| Router/deep link | hash routes, unknown -> not-found | typed hash router, unknown -> not-found | PARTIAL |
| App shell | V4 shell/nav/bootstrap owner | new shell owner, minimal nav | PARTIAL |
| Session/auth | existing session owner | contract not migrated | MISSING |
| Home | production feature | minimal architectural proof route | NOT PARITY |
| Reader | production feature | registered placeholder only | MISSING |
| Games | production feature | registered placeholder only | MISSING |
| Community/ministry/admin | production features | registered placeholder / not migrated | MISSING |
| Media | production feature | not migrated | MISSING |
| Offline/PWA | production install/runtime behavior | no greenfield SW contract yet | MISSING |
| Supabase/RLS | protected production contracts | reused by policy, no new client repository yet | PRESERVED/UNUSED |
| Accessibility | production baseline | semantic shell, 44px controls, focus handoff, reduced-motion handling; browser proof pending | PARTIAL |
| Architecture regression gate | none specific to greenfield | zero-dependency Node contract checker | PARTIAL |

## Tests and evidence

- Lab branch baseline remains derived from accepted planning SHA `1f504dec812f11453f82e30af61cdf3d6c547060`.
- Current greenfield shell sources were re-read before this tranche.
- `npm install --package-lock-only --ignore-scripts --no-audit --no-fund` was retried and timed out after 45 seconds because registry/network resolution remains unavailable in the execution environment. No lockfile/install/build/typecheck result is claimed.
- The new architecture-checker logic was executed successfully in a reconstructed local fixture representing its asserted contracts: `V5 greenfield architecture contracts: PASS`. Because a full repository checkout was not available in the execution container, this is checker-smoke evidence, not an exact-branch test execution claim.
- Exact source review confirms the branch still uses isolated `v5.html`, isolated `dist-v5`, lazy Home/Not Found route imports, render-version stale-result suppression, one active `aria-current` owner, and greenfield-only CSS.

## Failures / unresolved evidence

- No lockfile because dependency resolution timed out again.
- No exact-branch `npm run test:architecture:v5`, `npm ci`, typecheck, Vite build, browser run, PWA test or deployed-preview result is yet claimed green.
- Home is only an architecture proof, not feature parity.
- Session, repository/data, offline/PWA and protected feature surfaces remain unmigrated.

## Architecture decisions learned

1. A separate experimental browser entry remains the safest way to test greenfield ownership without an all-at-once production replacement.
2. Route modules should stay lazy by construction instead of reproducing the V4 bootstrap import graph.
3. V4 CSS override accumulation should not be copied into the new runtime.
4. Shell loading/error/focus/navigation ownership can be isolated without owning auth, permissions or persistence.
5. Async route loads need explicit stale-result suppression from the beginning.
6. A zero-dependency architecture gate is valuable because it protects ownership boundaries independently of package-manager availability, but it must remain narrower than behavioral/browser/security tests.

## Known debt

- exact shipped-route inventory still needs representation in a typed parity registry;
- auth/session and active-congregation context are not modeled;
- no repository/data boundary exists;
- no offline/cache update model exists;
- no deterministic build identity or bundle budget exists;
- dependency lock/build evidence remains blocked by transient network resolution;
- architecture checker still needs exact-branch execution in CI or a real checkout.

## Next 3 tasks

1. Obtain deterministic dependency lock/typecheck/build evidence when package resolution is available; run `test:architecture:v5` against the exact branch in the same environment.
2. Add a typed session boundary plus read-only repository contract and migrate one meaningful existing feature slice end-to-end without bypassing backend authorization.
3. Expand the route parity registry to the authoritative shipped surface inventory and add behavioral router/shell regression tests for deep-link/not-found/rapid-navigation cases.

## Viability

**VIABLE — CONTINUE.**

The package-manager blocker is environmental, not architectural. The lab now has an executable, dependency-independent guard for its most important ownership boundaries, but superiority over incremental migration still cannot be judged until one meaningful data-backed feature reaches parity and build/browser evidence is green.
