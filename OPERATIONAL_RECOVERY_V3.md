# BibleQuest v3 Operational Recovery Contract

## Recovery target

Inventory row #96 restores the clean basic operational boundary: a feature render, mount, or cleanup failure must not destroy the BibleQuest shell. The user receives an explicit Retry action and a Home action while normal navigation remains available.

The recovered sources are `bq2.js`, `operational-hardening.js`, and `runtime-recovery.js`. They establish the user-visible recovery behavior, but their global wrappers, DOM interception, script reinjection, and mixed diagnostic responsibilities are reference material only.

## Single owner

`src/app/operational-recovery.js` is the sole owner of active recovery state, failure capture, retry/home action lifecycle, and safe public recovery copy.

- `src/app/router.js` remains the only navigation/history owner.
- `src/ui/shell.js` renders recovery presentation and forwards button events only.
- `src/app/bootstrap.js` composes the route operation, recovery owner, shell, store, and router.
- `src/core/storage.js`, Progress, Lesson, session, and feature services remain unchanged.

## Required behavior

1. Synchronous route construction, page mount, and prior-page cleanup failures are contained inside the existing shell.
2. Recovery state contains one active failure only. A newer failure replaces an older one deterministically.
3. Retry re-runs the failed route through the existing router. Home navigates through the existing router; recovery never edits location/history directly.
4. Recovery clears before an action runs. If that action fails again, the new failure is captured and presented without an unhandled rejection.
5. A successful route render clears stale recovery state.
6. Recovery UI keeps the primary shell/navigation mounted, uses an alert status, provides Retry and Home controls, remains usable at 390px, and does not overflow horizontally.
7. The public recovery view does not expose stacks, credentials, tokens, or arbitrary technical error text.
8. Reporting is an injected best-effort callback. Reporting failure cannot break recovery.
9. Recovery has no browser persistence, remote/API call, XP, streak, Lesson, doctrinal, provenance, membership, or account side effect.

## Explicit exclusions

- #95 Client diagnostics remains a separate future milestone; #96 does not invent a diagnostic taxonomy, error database, or backend reporter.
- No `window.onerror`, `unhandledrejection`, `MutationObserver`, DOM surveillance, global wrapper, fetch override, script reinjection, or `window.BQ*` compatibility runtime is introduced.
- No alternate router, shell, store, feature registry, persistence path, or service owner is introduced.
- Startup failures before the v3 shell exists, offline/PWA recovery, backup/import/reset, and production deployment remain separate inventory work.

## Verification gate

Before #96 becomes Verified:

1. architecture validation confirms one recovery owner and preserves router/shell ownership;
2. edge regression covers capture, replacement, clear, Retry, Home, repeated failure, and reporting failure;
3. browser regression proves render, mount, and cleanup failures keep the shell alive and recover at 390px;
4. the complete accumulated v3 regression suite passes on the exact clean functional candidate;
5. the independent bookkeeping candidate then passes the complete suite before `release/v3.30-operational-recovery` is frozen.
