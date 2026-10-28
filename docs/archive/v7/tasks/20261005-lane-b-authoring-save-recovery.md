# Lane B — authoring mutation recovery

Starting integration: `cd1e38d32e2a1ccd59683b4211e999e06d8191e7` (PR #1210 saved-step editors integrated).

A successful step mutation followed by a failed readiness read previously restored the pre-save UI snapshot. Preserve the acknowledged saved step, clear old publication readiness and surface the existing localized error state. A fresh readiness check can recover independently. Account/congregation invalidation suppresses stale mutation results before further reads. Updating track/module/lesson metadata also clears readiness because those edits advance optimistic hierarchy IDs.

Verification: all 267 V7 Node tests and whitespace checks pass on Node 24.19.0. New regressions cover acknowledged saves with failed readiness reads and invalidation of publication requests after all three hierarchy edits. No schema, route or production changes. Browser/mobile and live-data journey evidence remain OPEN; local Chromium executable is absent.
