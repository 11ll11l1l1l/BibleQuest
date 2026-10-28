# Lane B — lesson hydration readiness

Starting integration: `91552d6be63ee488319a4ca89786aa7c57118573`.

The lesson deep-link page called the runner on mount and manual Reload before shared account/congregation hydration was ready, unlike the integrated overview and pairing guards. Route all page-owned loads through the existing readiness callback. Context notifications still invalidate visible scoped data immediately, then reload only when ready. A disposed page ignores queued context notifications.

The new regression fails on the baseline's initial mount read and covers pending mount, pending manual reload, automatic ready load, ready manual reload, sign-out and post-disposal callbacks. All 22 focused lesson runner/page/private-response tests pass locally on Node 24.19.0. No backend, schema, shared route or production changes; authenticated journey certification remains OPEN.
