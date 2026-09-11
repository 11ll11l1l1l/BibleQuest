# BibleQuest v3 — Assignment Private Responses

Status: implementation branch `feature/v3-assignment-private-responses`
Baseline: `release/v3.71-japanese-furigana` @ `c631bea8d5177a9a2ff68139cb104b6fbf26015b`

## Requirement

A ministry author can publish a freeform assignment, question, activity, or reflection prompt to a congregation audience. Assigned members can submit text with task completion.

For each assignment:

1. Assigned members can see which other assigned members have already completed/responded.
2. Assigned members cannot see another member's submitted answer text.
3. Authorized ministry roles can review completed member answer text for the active assignment.
4. Private BibleQuest data outside the intentional assignment submission is never attached.

When a written answer is mandatory, the ministry author selects **Require a written response / reflection** (or written evidence). The existing server completion rule then rejects completion without text.

## Architecture

This extends the existing Assignments owner; it does not create a second task system.

- `bible_assignment_progress` remains the protected source of response text and leader feedback.
- `bible_assignment_response_presence` is a separate peer-visible projection containing only:
  - assignment id
  - congregation id
  - member id
  - display name
  - completion timestamp
- A database trigger derives the safe presence projection from completed progress rows.
- RLS delegates assignment-audience authorization to `private.bible_assignment_visible`, including `all`, `member`, `team`, and `group` targets plus the established ministry roles.
- The trigger writer is a private-schema `SECURITY DEFINER` with an empty `search_path`; anon/authenticated roles receive no execute privilege on it.
- Authenticated browser clients have no INSERT/UPDATE/DELETE grants on the presence projection.
- `src/core/assignment-responses.js` owns response-review reads.
- `src/app/assignments.js` owns normalization, role gating, stale-request protection, and review state.
- `src/features/assignments/index.js` renders responder names to assigned members and renders answer bodies only from ministry review state.

## Privacy invariants

- The peer-visible table has no `submission` or `leader_feedback` column.
- Ordinary member review never calls the private-progress reader.
- Ordinary member application state contains an empty `responses` collection.
- Private answer rows continue to depend on the existing `bible_assignment_progress` RLS ministry policy.
- Members see only responder identity/status for assignments they are authorized to view.

## Verification gate

Dedicated workflow: `.github/workflows/assignment-private-responses.yml`

It must pass:

- JavaScript syntax checks for the response boundary, Assignments owner, and Assignments presentation.
- Existing `tests/v3-assignments-edge.mjs` regression.
- New `tests/v3-assignment-private-responses.mjs` privacy regression.
- Current `scripts/validate-v3-assignments.mjs` architecture validator.

The broader v3 regression workflow remains a separate release gate; this focused workflow does not redefine older milestone validators whose deferred-feature assumptions are already obsolete in the v3.71 baseline.

Database migration must also be reviewed/deployed in the normal Supabase release process before the feature is considered production-live. The frozen release branch and current production deployment are not modified by this feature branch.
