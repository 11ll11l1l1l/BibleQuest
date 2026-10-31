# V8 private Library reading list

Baseline: remote integration `81597105837d897b90456940dd1426dc87053f93`, PR #1558. One executor; bounded Library continuity feature. Existing routes/provider/publication owners retained.

## Implementation

Library item pages offer Save for later / Remove from saved. A collapsed Library panel lists saved titles, opens current item lookup, removes links and refreshes. Return focus can restore the saved link and reopen its disclosure when the originating result is unavailable. The existing lazy Library module owns all UI; no new route, source/provider adapter or eager content import.

The private service stores ID/title/content type/saved timestamp only, scoped by the existing guest/account identity getter through privateStorage. Source prose, URLs, rights payloads, Scripture, private learner answers and reflection notes are excluded. Saving requires the existing published/reviewed/rights-valid contract; opening uses normal Library lookup again rather than displaying a cached article or authorizing a download. Old links can become unavailable and remain removable. This is a saved-link list, not offline reading or cloud sync.

Duplicate saves update metadata without duplicate entries. The 100-item bound rejects further additions with a clear removal instruction; oversized/unknown-version stored payloads are not overwritten. Failed writes retain previous saved data and show retryable recovery. Stale-owner controls cannot modify the old or new profile; context changes clear/refresh visible links. EN/TL/CEB labels and escaped titles are implemented, with constrained phone controls.

## Verification and remaining work

132/132 affected Library tests PASS, including six new tests for metadata-only persistence, save/reload/remove, publication/rights denials, external-link books, owner isolation, explicit capacity, future/oversized format preservation, write failure, panel routing/escaping/focus/localization/recovery and actual detail controls. Existing discovery/routing/recovery/rights/translation tests remain intact. One inherited bootstrap assertion required preserving its existing service/navigate property order; no test or gate was removed.

Application typecheck, production build, existing lint/format, changed browser-script syntax and diff whitespace PASS locally on Node 24.22.1. Existing built Library browser flow now saves a real public reading, reloads the list, reopens through item lookup and removes it before the practice handoff at existing locales/viewports. Browser/device execution and exact-head CI remain pending. No full-V8 release, source rights expansion, backend/provider write, cloud upload or notification claim.
