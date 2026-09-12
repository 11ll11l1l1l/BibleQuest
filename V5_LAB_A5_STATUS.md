# BibleQuest V5 Lab A5 — Greenfield Architecture Status

Updated: 2026-09-13 JST
Branch: `lab/v5-a5-greenfield`
Baseline origin: `1f504dec812f11453f82e30af61cdf3d6c547060`
Lab identity: `BQ-V5-A5-GREENFIELD`

## Hypothesis

A clean typed client runtime can replace the V4 bootstrap/router/view ownership while preserving valuable domain, security, privacy, data and product contracts. The experiment is successful only if the new architecture reaches parity with less ownership coupling and measurable testability; greenfield freedom is not permission to silently drop features.

## Architecture blueprint

The lab will use these ownership rules:

- `v5.html` is the isolated greenfield browser entry during the experiment; production `index.html` remains untouched until parity evidence justifies any cutover.
- Vite owns the lab build graph and production-style artifacts.
- `src/v5/app/` owns application composition only.
- `src/v5/platform/router/` owns URL parsing/navigation and exposes typed route snapshots.
- `src/v5/platform/session/` will own typed auth/session state without becoming an authorization source.
- `src/v5/platform/data/` will define repositories over existing protected backend contracts rather than exposing ad-hoc remote calls to views.
- `src/v5/features/*` owns route/domain UI and feature-local state.
- server authorization/RLS remain authoritative; UI capability checks are presentation only.
- route modules are lazy-loaded from a typed route registry.
- cross-feature state is not placed into one giant global store.

## Implemented slices

### Tranche 1 — isolated typed shell/runtime boundary

Status: IN PROGRESS

Implemented in this tranche:

- dedicated `v5.html` greenfield entry, leaving V4 `index.html` unchanged;
- Vite + TypeScript-capable lab build configuration;
- typed route contract and route registry;
- framework-free greenfield router with one URL owner;
- typed app-shell composition seam;
- lazy-loaded Home and Not Found route modules;
- greenfield-only CSS foundation with no dependency on the V4 override stack.

This first slice deliberately has no Supabase writes and no privileged backend behavior. It proves shell/build/router ownership before auth/data migration.

## Parity matrix

| Area | V4 accepted behavior | Greenfield state | Status |
| --- | --- | --- | --- |
| Boot | `index.html` -> `src/app/bootstrap.js` | isolated `v5.html` -> `src/v5/main.ts` | PROTOTYPE |
| Router/deep link | hash routes, unknown -> not-found | typed hash router, unknown -> not-found | PARTIAL |
| App shell | V4 shell/nav/bootstrap owner | new shell owner, minimal nav | PARTIAL |
| Session/auth | existing session owner | contract not migrated | MISSING |
| Home | production feature | minimal architectural proof route | NOT PARITY |
| Reader | production feature | not migrated | MISSING |
| Games | production feature | not migrated | MISSING |
| Media | production feature | not migrated | MISSING |
| Community/ministry/admin | production features | not migrated | MISSING |
| Offline/PWA | production install/runtime behavior | no greenfield SW contract yet | MISSING |
| Supabase/RLS | protected production contracts | reused by policy, no new client repository yet | PRESERVED/UNUSED |
| Accessibility | production baseline | shell semantics only; browser proof pending | PARTIAL |

## Tests and evidence

- Baseline lab branch verified at `1f504dec812f11453f82e30af61cdf3d6c547060` before writes.
- V4 entry structure inspected: production still loads a large ordered CSS stack and boots through `src/app/bootstrap.js`.
- Existing router contract inspected: hash-based route normalization, history/hash listeners, and unknown-route fallback are accepted behaviors to preserve or deliberately supersede.
- Build/typecheck execution is required after package installation; do not count configuration presence as a passing build.

## Failures / unresolved evidence

- No lockfile has been generated yet.
- No `npm ci`, `npm run typecheck`, `npm run build`, browser test, PWA test or deployed preview is yet claimed green for this lab.
- Home is only a vertical architecture proof, not accepted feature parity.
- Session, repository/data, offline/PWA and protected feature surfaces remain unmigrated.

## Architecture decisions learned

1. A separate experimental browser entry is the safest way to test greenfield ownership without turning the experiment into an all-at-once production replacement.
2. The current route semantics are small enough to preserve behavior while replacing implementation ownership.
3. Greenfield route modules should be lazy by construction rather than reproducing the current bootstrap import graph.
4. V4 CSS override accumulation should not be copied into the new runtime; feature styles should be imported by the modules that own them.

## Known debt

- exact route inventory still needs to be represented in a typed parity registry before broad migration;
- auth/session and active-congregation context are not yet modeled;
- no repository/data boundary exists yet;
- no offline/cache update model exists yet;
- no deterministic build identity or bundle budget exists yet.

## Next 3 tasks

1. Generate/commit deterministic dependency lock evidence and run typecheck/build; correct the greenfield shell until both pass.
2. Add a typed session boundary plus a read-only repository contract and migrate one meaningful existing feature slice end-to-end without bypassing current backend authorization.
3. Expand the route parity registry to the authoritative shipped surface inventory and add router/shell regression tests including deep-link/not-found behavior.

## Viability

**VIABLE — CONTINUE.**

There is not yet evidence that the greenfield approach is superior to incremental migration, but the first ownership seams can be isolated without changing V4 production code or protected backend contracts. Reassess after one meaningful data-backed feature reaches parity and the greenfield build/browser evidence is green.
