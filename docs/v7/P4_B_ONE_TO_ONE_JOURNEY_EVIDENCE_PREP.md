# P4-B ONE 2 ONE journey evidence preparation

Status: preparation only. This document does **not** claim P3 exit or P4 browser/mobile certification.

Lane B has now integrated the feature-local pieces needed to preserve exact identity across the intended journey:

1. curriculum draft authoring and canonical seven-step editing;
2. read-only publication readiness;
3. exact immutable publication request handoff;
4. a publication-request handoff panel that emits the prepared payload without publishing;
5. active mentor-pair and published curriculum selection;
6. exact immutable assignment request handoff;
7. a mentor assignment-preparation page that emits the prepared request without writing assignment authority;
8. deterministic handoff into Lane C's existing mentee lesson runner using the exact assigned pair and immutable lesson revision ID.

`tests/v7/one-to-one-mentor-journey-contract.test.mjs` proves that, when the backend returns the lesson revision just published, the exact track/module/lesson/revision identity is preserved into the assignment handoff. It also proves the current mentor preparation path remains read-only.

`tests/v7/one-to-one-mentee-handoff-contract.test.mjs` extends the deterministic contract through the existing lesson runner. It proves the assignment handoff opens the exact pinned revision for the mentee, keeps that identity immutable if discovery data later changes, and keeps the same revision review-only for the paired mentor. This is cross-feature static/unit evidence only; Lane B does not modify Lane C's runner implementation.

## Remaining blockers before actual journey certification

- **#1168 — atomic curriculum publish/archive backend boundary.** Required before a real author journey can publish or withdraw curriculum. Lane B must not replace this with chained client updates.
- **#1170 — race-safe ONE 2 ONE assignment creation authority.** Required before the mentor journey can create/start an assignment. Lane B must not replace this with query-then-insert behavior.
- Shared/global route wiring and any resulting integration-only conflicts remain with Lane A / the integration owner.
- Browser/mobile evidence must be executed against the integrated runtime after the two backend transitions are connected. Static/unit evidence here is not browser, live-backend, or deployed evidence.

## P4-B evidence sequence once P3 closes

Use the smallest representative journey that exercises the accepted contracts:

1. Authorized author/leader opens curriculum authoring in the active congregation.
2. Create or edit one Track → Module → Lesson → lesson revision and all seven canonical steps.
3. Check readiness and call the authoritative atomic publish boundary with the exact prepared request.
4. Confirm the backend response preserves the selected IDs and published revision identity.
5. As the active mentor, open the assignment-preparation surface and select one active mentee pair.
6. Select the exact published track/module/lesson revision and call the authoritative assignment boundary.
7. Confirm the returned assignment ID/status references the exact pair and lesson revision.
8. Enter the mentee journey through the integrated route/deep-link and verify the runner identity is the exact assigned pair/revision.
9. Verify step navigation, private-response resume, Action completion, completed re-entry, and mentor read-only review using the integrated runtime.
10. Repeat the relevant account/congregation switch denial and narrow/mobile viewport checks.

Evidence must identify exact candidate SHA, environment, actor role, congregation scope, route/action, viewport/device, result, and durable artifact. Keep static, browser, live-backend, and deployed evidence distinct.
