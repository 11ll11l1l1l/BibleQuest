# Lane B — preserve saved step data while editing

Starting integration: `bedf18892ace4feb5c2728d0514557bdf21e0083`.

The authoring step editor previously initialized every edit to `{}`, empty Scripture references and no Library revision, even for existing saved steps. Re-saving could replace saved data. Each canonical step now has a collapsed editor with its own fixed position and the existing content, Scripture references and Library revision populated. Missing steps retain empty defaults. Dynamic JSON and attributes remain HTML escaped. No schema, permission or shared route changes.

Verification: 23 focused authoring/composition/revision tests and all 265 V7 tests pass on Node 24.19.0; diff whitespace passes. New regression checks saved values, all seven fixed step identities and hostile textarea content escaping. Browser/mobile acceptance remains OPEN.

Database blocker recovery: the earlier #1199/#1201 fixtures were repaired by Lane A and #1208 integrated publication/assignment authority and #1200. Final Database CI run 37266010995 passed; do not repeat or revert those fixes. Shared pair/lesson routes and test-target journey evidence remain next dependencies; no production DDL or real-user mutations performed.
