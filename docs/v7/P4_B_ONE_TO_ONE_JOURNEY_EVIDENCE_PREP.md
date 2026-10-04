# P4-B ONE 2 ONE journey evidence preparation

Status: preparation only. This document does **not** claim P3 exit or P4 browser/mobile certification.

Lane B has now integrated the feature-local mentor-side pieces needed to preserve exact identity across the intended journey:

1. curriculum draft authoring and canonical seven-step editing;
2. read-only publication readiness;
3. exact immutable publication request handoff;
4. active mentor-pair and published curriculum selection;
5. exact immutable assignment request handoff;
6. a mentor assignment-preparation page that emits the prepared request without writing assignment authority.

The deterministic contract test `tests/v7/one-to-one-mentor-journey-contract.test.mjs` proves that, when the backend returns the lesson revision just published, the exact track/module/lesson/revision identity is preserved into the assignment handoff. It also proves the current mentor preparation path remains read-only.

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
8. Enter the mentee journey through the integrated route/deep-link, verify the assigned lesson opens, resume/completion works, and role/privacy boundaries remain intact.
9. Repeat the relevant account/congregation switch denial and narrow/mobile viewport checks.

Evidence must identify exact candidate SHA, environment, actor role, congregation scope, route/action, viewport/device, result, and durable artifact. Keep static, browser, live-backend, and deployed evidence distinct.
