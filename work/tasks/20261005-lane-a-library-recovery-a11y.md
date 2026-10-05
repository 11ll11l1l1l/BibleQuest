# Lane A — Library item recovery and accessibility evidence

Owner: V7 Lane A.
Starting SHA: `91552d6be63ee488319a4ca89786aa7c57118573`.
Target: `v7/development`.

## Outcome

Library item failures and account/congregation invalidation previously left only a Back action. Added localized Retry for the original item ID, hidden during loading, missing-ID and not-found states. Retry uses the existing service/backend authority; no cached content is restored after scope changes. Offline failures show the existing localized Library connection message. Disposal removes both handlers and suppresses retained callbacks.

Expanded the existing real built-artifact Library browser gate: keyboard entry from Learn, extra-large text/strong contrast/reduced motion, accessible control names, visible keyboard focus, warm-route offline Retry, reconnect denial and filter-preserving Back. English/Tagalog/Cebuano and 320/390/430px remain covered. Browser checks do not inject authenticated data or certify reviewed content.

## Verification

- New recovery regressions fail on the starting runtime; fixed implementation passes.
- All 333 V7 tests, build, typecheck, lint, format and diff whitespace pass locally on Node 24.19.0.
- Local browser initially unavailable because the installed Chromium cache was removed; browser download returned an invalid archive. The existing pinned CI gate is the browser verification authority for this tranche.
- Exact-source CI and integrated identity are recorded in the PR.

## Boundary

No schema, backend policy, production deployment or content review decision. Representative content approval and Past Teaching rights remain OPEN; final release candidate remains separate.
