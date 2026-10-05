# Lane A — Library filters through language reload

Baseline: `7dba4170d97e590d986661648e9a6e8520ae92a1`, `v7/development`.

The real shell language selector reloads the app. Library Search and Clear previously changed service/form state without changing the route, so a reload restored older deep-link filters. The expanded built-artifact Chromium check reproduced `abiding` reverting to `prayer` at 320 px; two affected unit regressions also failed on baseline.

Search and Clear now use the existing Library browse navigation callback. The destination page owns the read, preserving query/type/taxonomy in the encoded route without duplicate requests or new storage. Retry still repeats the last submitted request rather than draft form fields. Clear removes old route filters.

The existing Library browser gate now uses the actual shell language control through en/tl/ceb, checks translated heading/error/Retry, preserves submitted filters over language changes and reloads, excludes unsent drafts, and verifies Clear remains clear after reload. Locale initialization only seeds empty storage, allowing the real control's persisted choice to survive reload.

Local verification: the complete Library browser matrix passes at 320/390/430 px in all three starting locales on Chromium 140 / Playwright 1.55.0; all 339 V7 tests, build, typecheck, lint, formatting and whitespace checks pass on Node 24.19.0. The PR carries pinned exact-source CI and final integration identity. This remains signed-out browser evidence; published content, authenticated roles, physical-device and final release acceptance remain OPEN.
