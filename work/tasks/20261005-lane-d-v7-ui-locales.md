# Lane D V7 interface localization

Owner: Lane D. Starting integration SHA: `9b874a5c6ca4b3039ab4c7534cb79150d413d238`.
Branch: `lane-d/v7-ui-locales-20261005`.
Scope: the 150 registered V7 UI keys, their existing localization composition and affected regression tests. No Scripture, content record, source-language, review/rights decision, schema, router, workflow or production changes.

## Result

Added 150 Tagalog and 150 Cebuano interface translations for Library discovery/provenance, curriculum authoring, assignment preparation/creation and publication controls. Dictionaries are immutable and merged through the existing localization owner. Registered missing V7 key counts are now English 0, Tagalog 0 and Cebuano 0. Proper names and established technical labels may remain shared across languages. This count does not claim every legacy or feature-local string belongs to the global V7 inventory.

## Evidence and limits

236 V7 tests and 5 affected inherited V6 localization/settings tests pass locally on Node 24.19.0. Checks exercise exact key coverage, placeholder parity/interpolation, regional-locale normalization, source-language notices, approved English fallback, and actual Library/assignment/publication renderers across English → Tagalog → Cebuano → English. Syntax and diff whitespace checks pass.

The existing exact-SHA V7 CI workflow is the pinned-toolchain build/PWA/performance evidence path; its result and integrated identity are recorded on the associated PR. Local render assertions are not narrow-viewport browser or native-speaker review evidence. Source text is not translated or newly approved. Release-candidate certification remains gated by shared P3/P4 completion; canonical phase status remains owned by Lane A.
