# BibleQuest v3 Client Diagnostics Contract

## Recovery target

Inventory row #95 restores the user-facing distinction between a feature/module failure and a connection failure. The retained stable codes are `BQ-NET-001` (browser offline), `BQ-NET-002` (host unreachable), `BQ-MOD-001` (feature/module failure while the host is reachable), and `BQ-UNK-001` (insufficient evidence).

The recovered sources are `client-diagnostics.js`, `runtime-recovery.js`, `ERROR_CODES.md`, `tests/diagnostic-codes-static.mjs`, and `tests/diagnostic-doc-static.mjs`. Their global listeners, watchdog, DOM injection, direct Supabase writes, and compatibility globals are reference-only.

## Single owner and composition

`src/core/client-diagnostics.js` is the sole owner of diagnostic codes, module-versus-network classification, probe-result caching, and safe immutable diagnostic views.

- `src/core/api.js` remains the only service-access implementation and owns the cache-busting same-origin connectivity probe.
- `src/app/operational-recovery.js` remains the only active recovery-state and Retry/Home lifecycle owner.
- `src/ui/shell.js` renders owner-supplied diagnostic presentation and forwards no diagnostic decisions.
- `src/app/bootstrap.js` composes Diagnostics into Recovery through the existing injected best-effort reporting seam.

## Required behavior

1. `navigator.onLine === false` classifies as `BQ-NET-001` without issuing a probe.
2. Browser-online state is not sufficient evidence. A route/module failure runs a same-origin, cache-busting probe through `src/core/api.js`.
3. A failed/throwing probe classifies as `BQ-NET-002`; a successful probe classifies the route failure as `BQ-MOD-001`.
4. Unknown non-module failures without connectivity evidence classify as `BQ-UNK-001`.
5. Successful probe results are cached briefly to avoid repeated recovery traffic; callers may explicitly force a fresh probe.
6. Public diagnostics are immutable and contain only stable code, category, title, safe message, route, reachability, and timestamp. Arbitrary error text, stack, email, token, URL, and credential data are excluded.
7. An async classification/reporting failure cannot produce an unhandled rejection or replace a newer recovery view.
8. Recovery UI displays the stable code and whether the host probe succeeded while retaining Retry, Home, the shell, and primary navigation.
9. The diagnostic path has no persistence, remote error-table write, account/session requirement, Progress, Lesson, reward, doctrinal, provenance, or congregation side effect.

## Explicit exclusions

- No global `error`, `unhandledrejection`, online/offline listener, main-thread watchdog, DOM injector, global `window.BQDiagnostics`, fetch override, script reinjection, or MutationObserver.
- No `bible_client_errors` write or other backend logging is included in #95. A later explicit requirement may compose remote reporting through the API owner.
- #97–99 PWA/install/offline behavior and #100 backup/reset remain separate milestones.

## Verification gate

Before #95 becomes Verified:

1. architecture validation confirms one classifier and API-owned probe;
2. edge regression covers offline, reachable module failure, unreachable host, unknown failure, cache/forced refresh, immutable safe output, and async reporting failure isolation;
3. real 390px browser regression proves diagnostic code/reachability presentation composes with #96 Retry/Home recovery without losing the shell;
4. the complete accumulated suite passes on the exact functional candidate;
5. the independent bookkeeping candidate passes the same complete suite before `release/v3.31-client-diagnostics` is frozen.
