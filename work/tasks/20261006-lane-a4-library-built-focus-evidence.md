# Lane A4 — Library built-browser focus evidence

Baseline: `d8de07086f813c8bbbc996c734f92c83e2a248fc`, `v7/development`.

Owned surface: deterministic Library keyboard/focus and live-region semantics in the existing real built-artifact Chromium smoke. No injected Library service, fabricated publication, authenticated role, backend, content decision, deployment, or human assistive-technology claim is introduced.

The Library browser smoke already exercised signed-out detail entry, offline Retry/reconnect, filter-preserving Back, narrow widths and locale loops. This tranche makes the existing focus/status contracts observable in that same built artifact:

- signed-out browse errors expose `role="alert"` with assertive live-region semantics;
- keyboard browse Retry returns focus to the persistent Library status region and preserves the submitted query/content type;
- an item-ID detail route focuses the persistent detail status region;
- offline and backend item errors expose `role="alert"` with assertive live-region semantics;
- keyboard item Retry and reconnect Retry return focus to the persistent detail status region while Retry remains available;
- returning from an item whose originating card cannot exist in the signed-out result set settles the browse request, preserves query/content-type filters, and focuses the persistent Library status region.

The missing-ID detail route remains a content/error contract only and does not claim explicit entry focus.

These assertions run at 320, 390 and 430 px for en, tl and ceb inside the existing `V7 Library narrow, locale and keyboard smoke` workflow step.

This remains automated signed-out Chromium evidence. Published representative Library items, populated taxonomy/pagination success, named screen-reader/browser observation, contrast measurement, physical-device/installed-PWA observation, authenticated role journeys, deployed identity, and final release-candidate certification remain governed by `docs/v7/P5_A_BROWSER_MOBILE_ACCESSIBILITY_EVIDENCE_PREP.md` and are not claimed here.
