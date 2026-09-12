# BibleQuest V4 Assignments Page Acceptance Certification

Certified: 2026-09-12 JST
Checkpoint: `release/v4-assignments-page`
Exact SHA: `65d7ef14b6e1bf5dc8925a88c5838bc233e9fd95`
Full accumulated regression run: `34680055519`
Result: **PASS**

## Scope

The full Assignments page/workflow was audited as the next Priority-1 V4 acceptance gate. Existing service, linked-activity ownership, trusted Supabase mutation boundary and privacy model were preserved. One real presentation issue was corrected: arbitrary thrown API/network/service error messages could previously be rendered directly in the Assignments UI.

Relative to the pre-Assignments audit head `2acdad0d0bf572e2b1bd22b414ef55655521ffdd`, the certified tranche changes only:

- `src/features/assignments/index.js`
- `tests/v4-assignments-static.mjs`
- `tests/v4-assignments-page-smoke.mjs`
- `.github/workflows/v3-regression.yml`

The new static contract byte-locks these existing owners/boundaries to the pre-audit baseline:

- `src/app/assignments.js`
- `src/app/linked-activities.js`
- `supabase/functions/bq-assignment/index.ts`

## Corrected presentation boundary

The Assignments page now:

- renders bounded generic messages for unknown load, audience-directory, publishing, linked-activity, start, completion and response-review failures;
- does not expose arbitrary raw thrown `error.message` values in the page;
- keeps an explicit allowlist for controlled user-action/domain validation messages where showing the message is useful and safe;
- retains a retry path for load and response-review failures;
- leaves the existing service/backend error objects and ownership boundaries unchanged.

## Preserved workflow/privacy behavior

Existing accumulated coverage continues to protect:

- signed-out, local-preview/offline and no-congregation states;
- ready-empty and assigned-task presentation;
- member detail/start/complete flows;
- linked activity handoff while Assignments remains completion/points owner;
- advanced schedule/reminder/recurrence metadata and reflection/quiz/confirmation requirements;
- scheduled assignment blocking before opening;
- ministry-role recipient flow as read-only;
- leader publishing and audience targeting;
- response-presence visibility versus private answer-text visibility;
- member/team/group/all recipient authorization at the trusted boundary;
- congregation scope validation and own-progress isolation;
- realtime refresh and cleanup;
- private notes and unrelated personal study data remaining outside Assignments.

## New V4 acceptance evidence

`tests/v4-assignments-static.mjs` certifies V4 styling, responsive/contrast/reduced-motion presentation, retained state/action hooks, error sanitization, privacy copy, owner byte locks and accumulated-CI registration.

`tests/v4-assignments-page-smoke.mjs` adds page-level browser acceptance for:

- signed-out, local-preview and no-congregation states;
- generic load failure without backend-detail leakage;
- ready-empty state plus visible privacy boundary;
- response-review failure without raw-detail leakage;
- audience-directory failure without raw-detail leakage;
- completion failure without raw-detail leakage;
- 320px document-overflow and 44px touch-target contracts;
- phone single-column publisher composition;
- wide desktop publisher composition and no document overflow.

## Exact-SHA regression evidence

Run `34680055519` passed:

- `bash build.sh` / Cloudflare deployment gate;
- all accumulated architecture validators;
- all accumulated edge/security/privacy regressions, including the new V4 Assignments static contract and existing trusted assignment authorization tests;
- guarded field-harness syntax checks;
- the complete accumulated Playwright/browser-mobile suite, including legacy Assignments/Advanced Assignments tests and the new V4 page acceptance smoke.

Temporary verification PR #131 was closed unmerged after exact-SHA evidence was captured.

## Acceptance result

The Priority-1 **full Assignments page/workflow V4 acceptance requirement is closed** at this checkpoint.

The next serialized Priority-1 gate is **Daily Journey / Daily Mission page-level V4 acceptance**. Its pre-audit already identified a similar presentation-boundary issue: `src/features/daily-mission/index.js` can display arbitrary thrown error messages and should be corrected without changing `src/app/daily-mission.js` ownership or progression semantics.