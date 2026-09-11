# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after exact-SHA completion of the post-release Assignment Private Responses milestone.

For new chat instances, `CONTINUE_PROMPT_V3.md` remains the generic resume prompt. Repository evidence overrides stale chat context.

## Production state — preserve

- Repo: `11ll11l1l1l/BibleQuest`.
- Production `main`: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.
- Frozen rollback/reference: `release/v3-production-20260911-r3` at the same SHA.
- The 2026-09-11 production release objective is complete.
- Applicable v3 release scope remains **98/98 complete**.
- Historical #39 Hiragana Match and #40 Kids Bible Who Am I remain retired from the release scope. Do not revive them as backlog by default.
- Production Supabase/data has not been changed by the Assignment Private Responses milestone.
- Assignment Private Responses is verified in development but is **not production-live** because its new migration has not been applied to production.

Do not modify/repoint production or execute the new migration merely because a post-release feature branch is green. A later production integration requires a separate selected release milestone and fresh deployed verification.

## Current exact-green post-release product checkpoint

- Branch: `postrelease/v3-assignment-private-responses`.
- Exact verified product SHA: `73d39ce6fe0f9db20db62e25fd497a8711f921b0`.
- Parent post-visual evidence head: `ef78bbbed7115ef65853159edf21dac454d5ee99`.
- Prior exact-green visual checkpoint: `406c34dcdf904b7483bf4381be774a908738e60c`.
- Verifier: `verify/v3-assignment-private-responses-73d39ce`.
- Workflow run `34588223163`, job `103227244295`: **success**.

The verifier checked out detached exact product SHA `73d39ce6fe0f9db20db62e25fd497a8711f921b0` and passed:

- exact-SHA and exact milestone-diff hygiene;
- Cloudflare deployment gate with **267 JavaScript syntax checks** and production-entry/runtime ownership guards;
- focused Assignment Private Responses privacy checks plus Assignments, Advanced Assignments, and Assignment Push edge/architecture checks;
- **16** accumulated visual static contracts;
- **53** accumulated v3 architecture validators;
- **86** accumulated edge/security/static regressions;
- **68** accumulated Playwright browser/mobile regressions plus Kids Memory browser acceptance;
- PWA/offline/accessibility and core shell/account/navigation, Reader, Games, Transform, Assignments, Advanced Assignments, and Assignment Push coverage;
- final privacy/release-critical coverage-presence check.

No PASS was transferred from a changed product SHA.

## Assignment Private Responses behavior

The feature extends the established Assignments owner rather than creating another task system.

- Ministry authors can use the existing freeform assignment/question/activity/reflection flow and can require a written response/reflection.
- Assigned members can see which other authorized assigned members have already responded/completed.
- Assigned members cannot see another member's submitted answer text.
- Authorized ministry roles can review completed private answer text for the active assignment.
- `bible_assignment_progress` remains the protected answer/feedback source.
- New `bible_assignment_response_presence` is the peer-visible response-status projection and contains no submission or leader-feedback text.
- `src/core/api.js` remains the single browser backend/Supabase owner for both safe-presence and private ministry response reads.
- `src/app/assignments.js` owns role gating, normalization, stale-request protection, and review state.
- `src/features/assignments/index.js` owns presentation.
- Existing Advanced Assignments and Assignment Push contracts were preserved, including `Written reflection required`, read-only ministry recipient behavior, and the explicit rule that reminder/recurrence values are metadata only and do not themselves send notifications or create recurring copies.

Focused design/evidence: `ASSIGNMENT_PRIVATE_RESPONSES_V3.md`.

## Database boundary

The repository contains `supabase/migrations/20260911131000_assignment_response_presence.sql`.

That migration has **not** been applied to production Supabase. Production data was not modified during this milestone. Therefore do not claim the feature is production-live even though the JavaScript/data-contract product SHA is exact-green.

A future production integration must review/deploy that migration in the normal Supabase release process and then run live authorization/privacy acceptance against the promoted product.

## Rejected candidate history

Do not mistake earlier partial candidates for the verified checkpoint.

- `8a97b1f9dea8451fe35ecb73b710f86481f7d582`: rejected by accumulated architecture validation because it opened a competing Supabase client in `src/core/assignment-responses.js`; it also exposed the inherited status-heading contract regression.
- `05913f6f39fca9bbf4fdec8fc976818cfedc15c6`: rejected because Assignment Push reminder/recurrence boundary copy was lost during reconciliation.
- `46160efbe5fe2fdcee75ee0884020268f6679ca6`: passed static gates but failed accumulated browser acceptance because Advanced Assignments/ministry read-only copy contracts changed.
- `73d39ce6fe0f9db20db62e25fd497a8711f921b0`: restored the established contracts and passed the complete accumulated verifier.

## Visual/artwork phase status

The classified replacement-level visual phase remains complete through tranche 16. Exact-green visual SHA `406c34dcdf904b7483bf4381be774a908738e60c` remains an earlier rollback/reference checkpoint. The Assignment Private Responses milestone is the newest exact-green post-release product state.

Do not reopen visual Class-D owners or speculative theme work merely to continue development.

## Evidence-only branch head

After exact product SHA `73d39ce6fe0f9db20db62e25fd497a8711f921b0` passed, documentation-only bookkeeping was committed on `postrelease/v3-assignment-private-responses`.

Therefore the live branch HEAD is expected to be later than `73d39ce...`. Treat later documentation commits as evidence/bookkeeping only. Never call the docs-only HEAD the verified product SHA unless product files change and a fresh exact-SHA product verification is executed.

## What the next development chat should do

1. Recover live refs for `main`, `release/v3-production-20260911-r3`, and `postrelease/v3-assignment-private-responses` before writing.
2. Distinguish exact verified product SHA `73d39ce6fe0f9db20db62e25fd497a8711f921b0` from the later documentation-only branch HEAD.
3. Read `DEVELOPMENT_STATUS_V3.md` and `ASSIGNMENT_PRIVATE_RESPONSES_V3.md` before assignment/integration work.
4. Preserve production and do not apply `20260911131000_assignment_response_presence.sql` unless an explicit integration/release milestone is selected.
5. If Assignment Private Responses is selected for production integration: review/deploy the migration, integrate only the verified product state without unrelated legacy/main changes, rerun exact-SHA accumulated gates for any changed promoted SHA, confirm Cloudflare propagation, and verify live member/ministry authorization/privacy behavior.
6. If another post-release objective is selected instead, create an isolated branch from the appropriate exact-green checkpoint with explicit owner boundaries, acceptance criteria, focused regressions, and exact-SHA accumulated verification.
7. Keep retired Kids/Kana work retired unless explicitly reopened under `KIDS_GAMES_EXTENSION_V3.md`.

## Non-negotiable evidence rules

- Rebuild-and-verify; one owner per responsibility.
- Never transfer PASS across changed product SHAs.
- Never claim an unexecuted test.
- Documentation-only commits are not automatically product candidates.
- Preserve the frozen r3 production rollback point.
- Production Supabase/data stays unchanged unless a separately selected integration/release step requires it.
- A later GitHub merge/promotion is not proof of Cloudflare propagation.
- Do not call the app bug-free.
