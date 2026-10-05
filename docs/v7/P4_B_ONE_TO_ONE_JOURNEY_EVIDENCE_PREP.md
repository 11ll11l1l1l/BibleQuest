# P4-B ONE 2 ONE journey evidence preparation

Status: deterministic authority-connected preparation. This document does **not** claim P4 browser/mobile or live-backend certification.

Lane B has integrated the feature-local pieces needed to preserve exact identity across the intended journey:

1. curriculum draft authoring and canonical seven-step editing;
2. publication readiness and immutable publication request preparation;
3. the schema-owned atomic curriculum publication RPC consumed through `createCurriculumPublicationAuthority`;
4. publication handoff UI that validates the stable backend receipt;
5. active mentor-pair and published curriculum selection;
6. immutable assignment request preparation;
7. the race-safe assignment RPC consumed through `createV7AssignmentAuthority`;
8. mentor assignment UI that validates the returned assignment identity/status;
9. deterministic handoff into Lane C's lesson runner using the exact assigned pair and immutable lesson revision ID.

`tests/v7/one-to-one-mentor-journey-contract.test.mjs` proves the prepared publication identity reaches the authoritative publication boundary, then the same immutable track/module/lesson/revision identity reaches the authoritative assignment boundary and returns one stable assignment. The preparation service intentionally remains selection/request-only; it does not duplicate either backend mutation.

`tests/v7/one-to-one-mentee-handoff-contract.test.mjs` extends the deterministic contract through the lesson runner. It proves the assignment handoff opens the exact pinned revision for the mentee, keeps that identity immutable if discovery data later changes, and keeps the same revision review-only for the paired mentor. This remains cross-feature static/unit evidence rather than browser, live-backend, or deployed acceptance.

## Resolved former blockers

- **#1168 — atomic curriculum publish/archive backend boundary:** the schema-owned atomic publication/withdrawal authority is integrated and consumed by Lane B rather than replaced by chained client updates.
- **#1170 — race-safe ONE 2 ONE assignment creation authority:** the authoritative assignment RPC/client boundary is integrated and consumed by the Lane B assignment surface.
- Shared pairing/assigned-curriculum/lesson route wiring has subsequently landed in the integrated runtime.

The old blocker statements above must not be used to keep Lane B read-only. Read-only *preparation helpers* are still intentional architectural boundaries: actual mutations are injected through the authoritative publication and assignment services.

## Remaining evidence before P4-B certification

- Exercise the representative author → publish → mentor assignment → mentee lesson journey in the integrated built artifact, not only unit/contract tests.
- Exercise the authoritative RPCs against the supported disposable/live test backend with real role, congregation and RLS context; static fake-client receipts do not substitute for backend evidence.
- Verify mentor and mentee routes at representative narrow/mobile widths, including return/deep-link behavior, resume/completion and paired-mentor review-only state.
- Verify account/congregation switching invalidates or denies stale authoring/assignment actions in the integrated runtime.
- Record exact candidate SHA, environment, actor role, congregation, route/action, viewport/device and durable evidence artifact for each certification result.

## P4-B evidence sequence

Use the smallest representative journey that exercises the accepted contracts:

1. Authorized author/leader opens curriculum authoring in the active congregation.
2. Create or edit one Track → Module → Lesson → lesson revision and all seven canonical steps.
3. Check readiness and call the authoritative atomic publish boundary with the exact prepared request.
4. Confirm the backend response preserves the selected IDs and published revision identity.
5. As the active mentor, open assignment preparation and select one active mentee pair.
6. Select the exact published track/module/lesson revision and call the authoritative assignment boundary.
7. Confirm the returned assignment ID/status references the exact pair and lesson revision.
8. Enter the mentee journey through the integrated route/deep-link and verify the runner identity is the exact assigned pair/revision.
9. Verify step navigation, private-response resume, Action completion, completed re-entry, and mentor read-only review using the integrated runtime.
10. Repeat the relevant account/congregation switch denial and narrow/mobile viewport checks.

Keep static, browser, backend and deployed evidence distinct. Do not convert successful deterministic fake-client evidence into a live-backend PASS.