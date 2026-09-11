# BibleQuest v3 — Assignment Private Responses

Status: exact-SHA verified post-release milestone
Product branch: `postrelease/v3-assignment-private-responses`
Exact verified product SHA: `73d39ce6fe0f9db20db62e25fd497a8711f921b0`
Parent post-visual evidence head: `ef78bbbed7115ef65853159edf21dac454d5ee99`
Verifier branch: `verify/v3-assignment-private-responses-73d39ce`
Workflow run: `34588223163`
Job: `103227244295`
Conclusion: **success**

## Requirement

A ministry author can publish a freeform assignment, question, activity, or reflection prompt to a congregation audience. Assigned members can submit text with task completion.

For each assignment:

1. Assigned members can see which other assigned members have already completed/responded.
2. Assigned members cannot see another member's submitted answer text.
3. Authorized ministry roles can review completed member answer text for the active assignment.
4. Private BibleQuest data outside the intentional assignment submission is never attached.

When a written answer is mandatory, the ministry author selects **Require a written response / reflection**. Existing assignment completion rules remain responsible for enforcing required written evidence.

## Architecture

This extends the existing Assignments owner; it does not create a second task system or a second backend client.

- `bible_assignment_progress` remains the protected source of response text and leader feedback.
- `bible_assignment_response_presence` is a peer-visible projection containing only assignment id, congregation id, member id, display name, and completion timestamp.
- `supabase/migrations/20260911131000_assignment_response_presence.sql` defines the projection, trigger maintenance, grants, and RLS policy.
- `src/core/api.js` remains the single browser backend/Supabase owner and performs both safe presence reads and ministry-authorized private response reads.
- `src/app/assignments.js` owns normalization, role gating, stale-request protection, and review state.
- `src/features/assignments/index.js` renders responder identity/status to assigned members and answer bodies only from ministry review state.
- Existing Advanced Assignments and Assignment Push presentation/behavior contracts remain intact, including the established `Written reflection required` metadata label and the rule that reminder/recurrence fields are metadata only and do not send notifications or generate recurring copies.

The initially referenced implementation used a separate `src/core/assignment-responses.js` Supabase client. The accumulated architecture validator rejected that design. The verified milestone removes that module and routes the new reads through `src/core/api.js` instead.

## Privacy invariants

- The peer-visible projection has no `submission` or `leader_feedback` column.
- Ordinary members receive presence/status only; another member's answer text is not placed in ordinary member response state.
- Private answer reads are requested only for authorized ministry review state and remain subject to the existing `bible_assignment_progress` authorization/RLS boundary.
- Members see responder identity/status only for assignments they are authorized to view.
- The ministry assignment recipient path remains read-only; assignment publishing is a separate ministry control.

## Exact verification evidence

Run `34588223163`, job `103227244295`, checked out detached exact product SHA `73d39ce6fe0f9db20db62e25fd497a8711f921b0` and passed:

- exact-SHA and exact milestone diff hygiene;
- Cloudflare deployment gate with syntax checks over **267 JavaScript files** and all production-entry/runtime ownership guards;
- focused Assignment Private Responses privacy regression;
- Assignments, Advanced Assignments, and Assignment Push edge and architecture checks;
- **16** accumulated visual static contracts;
- **53** accumulated v3 architecture validators;
- **86** accumulated edge/security/static regressions;
- **68** accumulated Playwright browser/mobile regressions, including Assignments, Advanced Assignments, Assignment Push, PWA/offline/accessibility, Reader, Games, Transform, shell/account/navigation, and Kids Memory browser acceptance;
- final privacy/release-critical coverage-presence gate.

No PASS was transferred from rejected product SHAs.

## Rejected candidates and root causes

- `8a97b1f9dea8451fe35ecb73b710f86481f7d582`: rejected because it introduced a second Supabase client and exposed a status-document architecture-contract regression.
- `05913f6f39fca9bbf4fdec8fc976818cfedc15c6`: rejected because the reconciled UI lost the established Assignment Push reminder/recurrence boundary copy.
- `46160efbe5fe2fdcee75ee0884020268f6679ca6`: passed static gates but was rejected by accumulated browser acceptance because established Advanced Assignments/ministry read-only presentation copy had changed.
- `73d39ce6fe0f9db20db62e25fd497a8711f921b0`: restored the established presentation contracts while preserving the new privacy model and earned the complete exact-SHA PASS.

## Production boundary

This milestone is **verified in development but not production-live**.

- Production `main` remains `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.
- Frozen production rollback branch remains `release/v3-production-20260911-r3` at the same SHA.
- The new Supabase migration has **not** been applied to production.
- Production Supabase/data has not been modified by this milestone.
- Do not promote this feature to production until a separate integration/release decision includes the database migration, exact promoted product identity, Cloudflare propagation, and live authorization/privacy verification.
