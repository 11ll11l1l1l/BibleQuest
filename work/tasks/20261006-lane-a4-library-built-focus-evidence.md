# Lane A4 — Library built-browser focus evidence

Baseline: `3a024a6436b16652f42fab956e1bef7b52da5839`, `v7/development`.

Owned surface: deterministic Library keyboard/focus behavior in the existing real built-artifact Chromium smoke. No injected Library service, fabricated publication, authenticated role, backend, content decision, deployment, or human assistive-technology claim is introduced.

The Library browser smoke already exercised signed-out detail entry, offline Retry/reconnect, filter-preserving Back, narrow widths and locale loops. This tranche makes the focus contract observable in that same built artifact:

- direct Library detail entry must focus the persistent detail status region;
- offline detail failure retains that detail focus anchor;
- keyboard Retry and reconnect Retry must return focus to the persistent detail status region while the retry state remains visible;
- returning from an item whose originating card cannot exist in the signed-out result set must settle the browse request and focus the persistent Library status region, while preserving the query and content-type filters.

These assertions run at 320, 390 and 430 px for en, tl and ceb inside the existing `V7 Library narrow, locale and keyboard smoke` workflow step.

This remains automated signed-out Chromium evidence. Published representative Library items, populated taxonomy/pagination success, named screen-reader/browser observation, contrast measurement, physical-device/installed-PWA observation, authenticated role journeys, deployed identity, and final release-candidate certification remain governed by `docs/v7/P5_A_BROWSER_MOBILE_ACCESSIBILITY_EVIDENCE_PREP.md` and are not claimed here.
