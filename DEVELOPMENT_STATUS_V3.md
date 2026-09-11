# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after exact-SHA verification of the post-release Assignment Private Responses milestone.

`FEATURE_INVENTORY_V3.md` remains the release-parity ledger. `KIDS_GAMES_EXTENSION_V3.md` governs any future Kids-game expansion. `VISUAL_REPLACEMENT_CONTRACT_V3.md`, `VISUAL_SURFACE_INVENTORY_V3.md`, and `VISUAL_POLISH_PROGRESS_V3.md` record the completed replacement-level visual program. `ASSIGNMENT_PRIVATE_RESPONSES_V3.md` is the focused contract/evidence record for the current post-release product milestone.

## Production baseline — unchanged

- Production `main`: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.
- Frozen production release: `release/v3-production-20260911-r3` at the same SHA.
- Production release objective: complete.
- Applicable release scope: **98/98 complete**.
- Historical #39 Hiragana Match and #40 Kids Bible Who Am I remain retired from this release scope and are not release debt.
- Production Supabase/data was not changed by post-release visual development or by Assignment Private Responses development.
- Assignment Private Responses is **not production-live**. Its migration is committed in the repository but has not been applied to production Supabase.
- Do not describe automated browser verification as physical-device acceptance.

The production release and post-release development line are intentionally separate. Do not repoint `main` or apply the new database migration merely because the post-release product is verified.

## Current exact-green post-release product

- Development branch: `postrelease/v3-assignment-private-responses`.
- Exact verified product SHA: `73d39ce6fe0f9db20db62e25fd497a8711f921b0`.
- Parent visual-program evidence head: `ef78bbbed7115ef65853159edf21dac454d5ee99`.
- Previous exact-green visual product checkpoint: `406c34dcdf904b7483bf4381be774a908738e60c`.
- Exact verifier branch: `verify/v3-assignment-private-responses-73d39ce`.
- Workflow run: `34588223163`.
- Job: `103227244295`.
- Conclusion: **success**.

The verifier checked out detached exact product SHA `73d39ce6fe0f9db20db62e25fd497a8711f921b0` and passed:

- exact-SHA and exact milestone-diff hygiene;
- Cloudflare deployment gate with syntax checks over **267 JavaScript files** and all production-entry/runtime ownership guards;
- focused Assignment Private Responses privacy regression plus Assignments, Advanced Assignments, and Assignment Push edge/architecture checks;
- **16** accumulated visual static contracts;
- **53** accumulated v3 architecture validators;
- **86** accumulated edge/security/static regressions;
- **68** accumulated Playwright browser/mobile regressions plus Kids Memory browser acceptance;
- release-critical PWA/offline/accessibility, shell/account/navigation, Reader, Games, Transform, Assignments, Advanced Assignments, and Assignment Push coverage;
- final privacy/release-critical coverage-presence gate.

No PASS was transferred from a changed product SHA.

## Assignment Private Responses milestone

The verified milestone extends the existing Assignments system rather than creating a second task or backend owner.

- Ministry authors can use the existing assignment prompt/activity/question flow and can require a written response/reflection.
- Assigned members can see which authorized peers have completed/responded.
- Ordinary members cannot see another member's submitted answer text.
- Authorized ministry roles can review completed answer text for the active assignment.
- `bible_assignment_progress` remains the protected answer/feedback source.
- `bible_assignment_response_presence` is the peer-visible projection and contains only assignment/congregation/member identity, display name, and completion timestamp.
- `src/core/api.js` remains the single browser Supabase/API owner for both safe-presence and ministry-private response reads.
- `src/app/assignments.js` owns normalization, role gating, stale-request protection, and review state.
- `src/features/assignments/index.js` owns presentation.
- Existing Advanced Assignments and Assignment Push behavior/presentation contracts are preserved.

The exact product milestone delta from the parent post-visual evidence head is limited to:

- `DEVELOPMENT_STATUS_V3.md` — status-contract correction present in the verified SHA;
- `src/app/assignments.js`;
- `src/core/api.js`;
- `src/features/assignments/index.js`;
- `supabase/migrations/20260911131000_assignment_response_presence.sql`;
- `tests/v3-assignment-private-responses.mjs`.

The migration is source-controlled evidence only at this stage. It has not been executed against production.

## Completed visual program

The classified replacement-level A/B visual phase remains complete through tranche 16. The prior exact-green visual product SHA `406c34dcdf904b7483bf4381be774a908738e60c` remains a preserved checkpoint and the visual evidence is retained in `VISUAL_POLISH_PROGRESS_V3.md`.

Assignment Private Responses is a separate behavior/data milestone built after that visual program; its exact-green SHA is now the newest verified post-release product checkpoint.

## Evidence-only branch head

After exact product SHA `73d39ce6fe0f9db20db62e25fd497a8711f921b0` passed, documentation-only bookkeeping began on `postrelease/v3-assignment-private-responses`.

Therefore the live branch HEAD may be later than the verified product SHA. A later documentation-only HEAD must not be called the verified product SHA unless product files change and a fresh exact-SHA product verification is executed.

## Standing rules

- Preserve `main` and `release/v3-production-20260911-r3` until a later promotion is explicitly selected.
- Preserve exact-green product SHA `73d39ce6fe0f9db20db62e25fd497a8711f921b0` as the current post-release product checkpoint.
- Preserve exact-green visual checkpoint `406c34dcdf904b7483bf4381be774a908738e60c` as an earlier rollback/reference point.
- Documentation-only commits after a verified product SHA are evidence/bookkeeping only.
- Never transfer PASS across changed product SHAs.
- Never claim unexecuted tests.
- Reproduce defects before product fixes.
- Do not revive retired Kids/Kana scope without a new explicit product decision.
- Do not modify production Supabase/data without an explicit integration/release decision or a reproduced production defect requiring it.
- A GitHub promotion is not proof of Cloudflare propagation; any future production release needs separate deployed-identity and browser verification.

## Defect / root-cause ledger

- Candidate `8a97b1f9dea8451fe35ecb73b710f86481f7d582` passed its focused privacy contract and deployment gate but was rejected by the accumulated architecture validator because it opened a second Supabase client in `src/core/assignment-responses.js`. Root cause: competing backend ownership. The verified design removes that module and routes the new reads through established `src/core/api.js`.
- The same candidate exposed a documentation-contract regression inherited from the post-visual handoff because this status file no longer retained the canonical `Defect / root-cause ledger` and `Next major milestone` headings. Those headings were restored before acceptance.
- Candidate `05913f6f39fca9bbf4fdec8fc976818cfedc15c6` was rejected because the reconciled UI dropped the established Assignment Push reminder/recurrence boundary copy. That contract was restored; reminder/recurrence values remain metadata only and this UI does not send notifications or generate recurring copies.
- Candidate `46160efbe5fe2fdcee75ee0884020268f6679ca6` passed static gates but was rejected by accumulated browser acceptance because established Advanced Assignments/ministry read-only presentation copy changed. The exact `Written reflection required` metadata label and ministry `Recipient responses remain read-only` contract were restored.
- Final product SHA `73d39ce6fe0f9db20db62e25fd497a8711f921b0` preserved those existing contracts while retaining the new privacy model and earned the complete exact-SHA PASS in run `34588223163` / job `103227244295`.

## Next major milestone

Assignment Private Responses implementation and exact-SHA development verification are complete.

The next gate for **this feature** is a separately selected integration/release milestone that includes: review/deployment of `20260911131000_assignment_response_presence.sql`, integration of the exact verified product state without unrelated history, fresh verification of any changed promoted SHA, Cloudflare propagation confirmation, and live authorization/privacy smoke checks. Until that integration/release is explicitly selected, do not apply the migration and do not claim the feature production-live.

If development continues on another objective instead, select a concrete isolated post-release milestone from the current verified checkpoint and define its architecture owner, acceptance criteria, regression protection, and exact-SHA verification before implementation.