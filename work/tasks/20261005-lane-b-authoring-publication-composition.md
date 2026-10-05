# Lane B — authoring publication composition

Date: 2026-10-05 JST
Starting integration: `3e89d8cf110b233578685673a009d338c816ec97`.
Owned surface: curriculum-authoring feature-local page, publication handoff lifecycle, focused tests.
Excluded: schema/RLS, global routes, session/congregation ownership, production DDL.

## Completed

PR #1204 composes the authoring editor and existing publication handoff. Exact readiness request changes clear stale publication acknowledgements. Account/congregation invalidation and disposal suppress late success. Without an injected backend authority the composed feature remains preparation-only.

Refreshed the PR by merging current integration without force-writing shared development. The resulting combined runtime tree passed all 242 V7 Node tests on Node 24.19.0. The focused composition/publication/mentor/mentee suite passed 29 tests. Earlier PR head `7e5a1f493f9c58118005a44e75ea101d64b08bda` had successful Exact-SHA build/PWA/performance CI; refreshed-head CI is separate evidence and must be checked before integration. This is development evidence, not pinned-toolchain release certification.

## Exact remaining dependencies

Live checks on 2026-10-05: publication backend PR #1199 (`d167ceb14396e63ae377e7d1a1811aeecba35863`) and assignment backend PR #1201 (`00c724fca1a7f952ef437192293c7b6be803b4b4`) remain open with failed `local-database` checks. Their schema owners must resolve disposable database/RLS evidence. Lane B adapter PR #1200 stays unmerged until publication authority is integrated. Do not replace these boundaries with client write chains.

Next Lane B continuation: refresh/replay #1200 after #1199 is green and integrated, then exercise the documented P4-B author → publish → mentor assignment → mentee exact-revision/resume/completion journey against the shared routes and disposable test target. Global route wiring remains Lane A's integration responsibility. Browser/mobile, live backend, content review/import and final certification remain OPEN. No production changes or real-user mutations occurred.
