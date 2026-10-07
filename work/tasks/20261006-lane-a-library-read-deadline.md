# Lane A — bounded Library read recovery

Starting SHA: `2d3a81ea7e665b496f6e8cd0c37306372c6d509d`.
Target: `v7/development`.

Browse/detail/pagination reads previously waited forever when a repository promise stalled. The existing Library service now applies a ten-second read deadline, clears completed timers, and promptly settles superseded/reset operations. Late underlying results are discarded; cancellation does not restore old-context content. Existing localized error/Retry presentation remains the UI owner. Pagination failure preserves the displayed items and cursor for Retry.

Five deterministic mocked-clock regressions fail on the starting runtime and pass with the fix. All 339 V7 tests, build, typecheck, lint, formatting and whitespace pass locally on Node 24.19.0. Existing exact-source CI remains pinned browser/build/PWA/accessibility evidence; final CI identity and integration are recorded in the PR.

This change bounds client read waiting; it does not cancel a server query or perform mutations. No schema, authorization, editorial/content approval or production promotion. Representative reviewed-content and final release certification remain OPEN.
