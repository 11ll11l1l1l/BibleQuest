# Lane D — P2 Library discovery

Starting integration: `bfc7a65baade9baa12c97ff110a09b7b47b550ba`.
Refreshed integration before publication: `4167cef1be50b2f99783051cc653bb53b3c146a8`.
Owner: persistent Lane D. Canonical phase/status authority remains `V7_ACTIVE_STATUS.md`.

## Implemented
- Cross-type title search and existing type filter.
- Controlled category/topic/tag selection with localized labels and explicit label-language fallback.
- Server-side taxonomy match through a separate inner relationship; full presentation taxonomy remains intact.
- Bounded taxonomy metadata (up to 200 terms; V7 representative catalog, not bulk ingest), existing 24-item pages, and accessible Load more.
- Duplicate-item suppression, double-request prevention, retry without losing visible results, stale-response suppression, and taxonomy clearing on context reset.
- Localized visible labels, loading/empty/offline/error states, clear filters, source-language markers, escaped metadata, and responsive focus/touch styling.
- In-session taxonomy return context is retained by the existing service. No new catalog/cache/auth/schema owner.

## Checks
- 62 combined V7 tests plus 2 focused taxonomy-label tests passed (64 total).
- Typecheck, production build, and diff whitespace passed on Node 24.19.0.
- Built Vite manifest includes the lazy Library stylesheet.
- Supabase query filters were exercised with the existing thenable client test double; no production V7 DDL or live-data acceptance.
- Chromium is absent here; browser/visual/a11y acceptance remains UNVERIFIED. No physical-device claim.
- Docs checked: Supabase joins/nesting `!inner` filters exclude unmatched parents; unfiltered presentation relationships remain left joins.

## Exact shared integration handoff to Lane A
`src/app/bootstrap.js` is a shared route owner; Lane D did not edit it.
1. In `navigateLibrary`, serialize `context.taxonomyId` as URL parameter `taxonomyId`.
2. Pass `initialTaxonomyId: libraryParams().get('taxonomyId') || ''` to the `library` page factory.
3. Include `taxonomyId: libraryParams().get('taxonomyId') || ''` in the `library-item` back destination.
4. Extend the existing encoded route/return test to verify taxonomy alongside query/type.
This closes taxonomy restoration across copied links/reloads, beyond current in-session preservation.

Remaining P2 acceptance: representative catalog content from A/B/C, live V7 development data, browser evidence, and the shared URL handoff. Do not mark those PASS from service tests.
Next eligible Lane D surface is P3 progress/private reflection/prayer/action state; reuse the integrated discipleship service/adapter and coordinate runner consumption without changing schema or private-state audiences.
