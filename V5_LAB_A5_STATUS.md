# BibleQuest V5 Lab A5 — Greenfield Architecture Status

Updated: 2026-09-13 JST
Branch: `lab/v5-a5-greenfield`
Baseline origin: `1f504dec812f11453f82e30af61cdf3d6c547060`
Current lab code HEAD before this status update: `4485e0e9ebf2528d1726ea4b771641eb6fb47897`
Lab identity: `BQ-V5-A5-GREENFIELD`

## Hypothesis

A clean typed client runtime can replace the V4 bootstrap/router/view ownership while preserving valuable domain, security, privacy, data and product contracts. The experiment succeeds only if the new architecture reaches parity with less ownership coupling and measurable testability; greenfield freedom is not permission to silently drop features.

## Architecture blueprint

- `v5.html` is the isolated greenfield browser entry; production `index.html` remains untouched until parity evidence justifies cutover.
- Vite owns the lab build graph and production-style artifacts.
- `src/v5/app/` owns application composition only.
- `src/v5/platform/router/` owns URL parsing/navigation and typed route context.
- `src/v5/platform/session/` owns typed authentication/session state without becoming an authorization source.
- `src/v5/platform/congregation/` owns active-congregation context separately from identity.
- `src/v5/data/` owns repository contracts/adapters; feature views do not create backend clients or issue direct network requests.
- Server authorization/RLS remain authoritative; UI session/capability state is presentation/request context only.
- Route modules are lazy-loaded and cross-feature state is not collapsed into one global store.

## Implemented slices

### Tranche 1 — isolated typed shell/runtime boundary
Status: IMPLEMENTED, BUILD EVIDENCE PENDING

Isolated `v5.html`; Vite/TypeScript-capable configuration; typed route registry; framework-free router; shell seam; lazy routes; greenfield-only CSS; stale async render suppression; singular `aria-current` ownership.

### Tranche 2 — zero-dependency architecture gate
Status: IMPLEMENTED, EXACT-BRANCH CI PASS

`tests/v5-greenfield-architecture.mjs` protects the clean runtime ownership graph without requiring package installation.

### Tranche 3 — typed session + route-context vertical slice
Status: IMPLEMENTED, BUILD/BROWSER EVIDENCE PENDING

Typed session contracts/service, explicit unavailable-source behavior, route-context dependency injection and a lazy Account route. No production Supabase connection or sign-in is implemented.

### Tranche 4 — congregation context + protected read-only assignments boundary
Status: IMPLEMENTED, BACKEND PARITY/BUILD/BROWSER EVIDENCE PENDING

Separate congregation-context ownership, typed `AssignmentsRepository`, fail-closed unavailable adapter and lazy Tasks route. Tasks requires authenticated identity plus an active congregation before repository access.

### Tranche 5 — protected feature behavioral proof
Status: IMPLEMENTED, EXACT-BRANCH CI PASS

`tests/v5-assignments-behavior.mjs` imports the real Tasks view with deterministic fake session/congregation/repository services and proves signed-out/no-congregation fail-closed behavior, exact scope forwarding, context-switch stale-result suppression and route-cleanup suppression.

### Tranche 6 — characterized authorized assignment read boundary
Status: IMPLEMENTED, EXACT-BRANCH CI PASS

Characterized the accepted V4 read contract from `ASSIGNMENTS_V3.md`, `src/core/api.js` and `src/app/assignments.js`: active assignment SELECTs are scoped to the selected congregation; progress SELECTs are scoped to the signed-in user and visible assignment ids; RLS remains authoritative for assignment audience/scheduled visibility; malformed foreign-congregation assignment rows are rejected; progress for another user or an unknown assignment is never exposed to the member surface.

Added `src/v5/data/assignments/authorized-read.ts`, which converts that contract into a transport-independent repository boundary. It requires an injected authorized read port and contains no Supabase URL, publishable/service key, auth bypass or privileged backend path. It validates tenant scope, active rows, supported assignment types, timestamps and progress status before returning the narrow V5 `AssignmentSummary` model. Due-state calculation preserves completed/scheduled/overdue/open semantics.

Added `tests/v5-assignments-authorized-read.mjs` to prove exact congregation/user request scoping, foreign-row fail-closed behavior, peer/unknown progress suppression, invalid-status rejection and invalid caller-scope rejection before transport access. GitHub Actions run `34738937724` completed successfully on exact code head `4485e0e9ebf2528d1726ea4b771641eb6fb47897`, including the architecture gate, protected assignments behavior suite and authorized read contract suite.

## Parity matrix

| Area | Greenfield state | Status |
| --- | --- | --- |
| Boot/router/shell | isolated typed runtime and lazy router | PARTIAL |
| Session/auth | typed source/service; no production sign-in | PARTIAL |
| Congregation context | separate typed context; no production membership adapter | PARTIAL |
| Account | read-only session-state slice | PARTIAL |
| Assignments feature | protected view + deterministic behavior tests | PARTIAL |
| Assignments read data | authorized transport-independent repository contract characterized; no real backend connection | PARTIAL ARCHITECTURE / NO REAL DATA PARITY |
| Home | architecture proof only | NOT PARITY |
| Reader | placeholder only | MISSING |
| Games | placeholder only | MISSING |
| Community/ministry/admin | not migrated | MISSING |
| Media | not migrated | MISSING |
| Offline/PWA | no greenfield SW contract | MISSING |
| Supabase/RLS | accepted authority preserved; not yet executed by greenfield lab | PRESERVED/UNPROVEN |
| Accessibility | semantic shell/status states; browser proof pending | PARTIAL |

## Tests and evidence

- Branch lineage remains derived from accepted planning SHA `1f504dec812f11453f82e30af61cdf3d6c547060`.
- Earlier exact code head `3e3276efba4a297957cb27d55439cc7f4db9b334` passed run `34736628661` for architecture and protected-view behavior.
- Exact code head `4485e0e9ebf2528d1726ea4b771641eb6fb47897` passed lab run `34738937724`.
- `Greenfield architecture contracts`: PASS.
- `Protected assignments behavior`: PASS.
- `Authorized assignments read contract`: PASS.
- V4 Section I security/privacy workflow also completed successfully on that code head; other inherited workflows were still running and are not counted as pass here.
- No production Supabase URL/key, service-role secret, RLS bypass or backend mutation was introduced in the new V5 adapter.
- Draft PR #191 remains `[LAB ONLY][DO NOT MERGE]` and draft-only.

## Failures / unresolved evidence

- No deterministic dependency lock, `npm ci`, TypeScript compiler pass, Vite production build, browser run, PWA proof or deployed-preview result is claimed green.
- The current session and congregation adapters remain unavailable by design.
- The authorized assignment repository has an abstract authorized read port only; no real Supabase/local-RLS transport is wired yet.
- Real RLS execution and multi-tenant backend isolation remain unproven in this lab.
- Assignment mutations, publishing, response review and realtime refresh are not migrated.
- Reader, Games, media, offline/PWA and most protected surfaces remain unmigrated.

## Architecture decisions learned

1. Route-context dependency injection can carry narrow platform/repository contracts without recreating a global mutable store.
2. Authentication identity and active congregation should remain separate owners; protected feature data requires both.
3. Views can remain transport-agnostic and still prove authorization-safe request gating.
4. The V4 assignments contract confirms that backend RLS, not the browser, owns audience/scheduled visibility; greenfield should preserve that boundary instead of reconstructing audience authorization client-side.
5. A narrow authorized-read port preserves selected-congregation and current-user scoping while keeping transport implementation replaceable.
6. Foreign congregation assignment rows should fail closed, while irrelevant peer/unknown progress rows are suppressed because the member surface must never expose them.
7. Dependency-free Node 22 tests provide useful architecture/behavior evidence while package installation is unavailable, but they do not replace real DB/browser/build proof.

## Known debt

- no real local/ephemeral Supabase adapter behind the authorized read port;
- no executable RLS evidence for greenfield requests;
- exact shipped-route inventory still needs a typed parity registry;
- production auth/membership/congregation-selection workflows are not connected;
- assignment mutations/ministry/realtime behavior remain unmigrated;
- no offline/cache update model;
- no deterministic build identity or bundle budget;
- browser accessibility and route behavior remain unproven.

## Next 3 tasks

1. Implement a local/ephemeral Supabase-backed `AuthorizedAssignmentsReadPort` only after proving it uses ordinary authenticated caller context and cannot carry service-role credentials; add real RLS tenant-isolation evidence if infrastructure is available.
2. Obtain deterministic dependency lock/typecheck/build/browser evidence and repair real type/runtime failures instead of relying only on Node strip-types execution.
3. Characterize and migrate assignment realtime as refresh-signal-only behavior, preserving congregation/user subscription scoping and idempotent cleanup without treating realtime payloads as authoritative state.

## Viability

**VIABLE — CONTINUE.**

The greenfield path now preserves the accepted assignment read security contract in a cleaner typed repository boundary without copying the V4 API owner or embedding privileged configuration, and that boundary has exact-head CI evidence. This strengthens the case that the frontend can be rebuilt around smaller ownership seams. Superiority over disciplined incremental migration remains unproven until the lab demonstrates deterministic build/browser evidence and at least one real RLS-protected backend read with tenant-isolation proof.
