# BibleQuest V4 Calendar Acceptance Certification

Certified: 2026-09-12 JST
Checkpoint: `release/v4-calendar`
Exact SHA: `658f202d65481f4486a2f6c010cf0f2248f8b391`
Full accumulated regression run: `34679464999`
Result: **PASS**

## Scope

Calendar was audited as a V4 acceptance/certification tranche rather than rebuilt. The existing Calendar runtime/service and feature owner were already functionally mature and already had the dedicated V4 Journey/Calendar presentation layer. This certification therefore added the missing exact preservation/acceptance lock and accumulated-CI registration without changing Calendar product/runtime behavior.

Compared with the pre-audit active V4 head `844ba32b00c95c34ad101b18f9195789ae79762a`, the certified candidate changes only:

- `tests/v4-calendar-static.mjs`
- `.github/workflows/v3-regression.yml`

`src/app/calendar.js` and `src/features/calendar/index.js` are byte-for-byte locked to the pre-audit baseline by the new V4 contract.

## Certified behavior and presentation

The combined Calendar contract retains:

- personal events for guest/device and signed-in/cloud-backed use;
- assignment due-date aggregation through the existing Assignments owner;
- congregation event loading through the existing Calendar API boundary;
- ministry permission checks through the existing Congregation owner before shared publishing;
- creator-only edit/delete controls for shared congregation events;
- weekly recurrence metadata/expansion for congregation events without enabling recurrence for personal events;
- server-authoritative congregation rows rather than local caching of shared events;
- the existing Calendar/Phase-B icon sprite and semantic source icons;
- V4 Calendar hierarchy for page, intro, add/edit form, agenda days, events, action areas and empty state;
- responsive phone composition including 390px acceptance and no document overflow;
- touch-target protection, stronger-contrast presentation and reduced-motion presentation.

## Evidence retained in accumulated CI

The exact candidate passed:

- `bash build.sh` / Cloudflare deployment gate;
- all accumulated architecture validators, including Calendar architecture validation;
- all accumulated edge/security/privacy regressions, including `tests/v3-calendar-edge.mjs`, `tests/v3-calendar-phase-b-static.mjs` and the new `tests/v4-calendar-static.mjs`;
- guarded field-harness syntax checks;
- the complete accumulated Playwright/browser-mobile suite, including `tests/v3-calendar-smoke.mjs` and `tests/v3-calendar-phase-b-smoke.mjs`.

The temporary verification PR was #130 and was closed unmerged after exact-SHA evidence was captured.

## Acceptance result

The Priority-1 Calendar page-level V4 acceptance requirement is **closed** at this checkpoint. No new Calendar runtime/service owner, duplicate persistence path, authorization shortcut, or weakened test was introduced.

The next serialized Priority-1 acceptance gate is the **full Assignments page/workflow audit**, preserving the existing Assignments service, trusted mutation boundaries and response privacy model.