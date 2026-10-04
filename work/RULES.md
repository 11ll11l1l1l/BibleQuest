# Work rules

## Task execution

- Fetch the intended branch, record HEAD, and check existing local changes before editing. Work on `v7/development` or a bounded branch from it; do not use rollback branches for development.
- Treat user instructions as the task scope. Resolve routine reversible choices autonomously. Ask only for genuinely missing input or authorization.
- Read current authorities and task dependencies only. Do not repeatedly read project history or redo completed certification.
- Keep edits focused. No unrelated redesign, cleanup or dependency upgrades inside a feature/fix task.
- Use existing checks appropriate to the actual change. A passing gate is complete until another change affects it. Fix a failure and rerun the affected checks.
- Parallel work requires explicit authorization and disjoint file ownership. Serialize integration; refresh a feature branch from live integration before merging.
- End with commit/branch, what changed, verification and actual remaining blockers. Update the authority once; do not produce competing status reports.

## Production

- `main` is production. This work-folder setup does not authorize deploying a new SHA. Follow the owner's release instruction and the existing exact-SHA gate contract.
- Preserve and verify a rollback ref before changing production. Never force-move a rollback or frozen release ref.
- Promote the certified SHA and artifact. Any source/build-affecting fix creates a new candidate and invalidates the affected prior certification.
- Keep the existing Cloudflare `npm run build:v6` / `dist-v6` contract until an intentional tested replacement is approved.
- Verify deployed identity and essential smoke immediately after promotion. Preserve signed-out protected-route denial and genuine authenticated evidence separately.
- Mark PASS only with evidence of the required type. Physical tests require actual physical evidence. A waiver stays a waiver; OPEN rows remain visible.
- Never commit credentials, tokens, personal account data or unsanitized diagnostic captures.

## Preservation

- Keep runtime, content, inherited tests and DB migrations unless an intentional replacement proves they are redundant.
- Check executable references before moving a file. Preserve frozen evidence and historical records; archive unreferenced narrative documents by version.
- Treat `.txt` files under `data/` and `kids-games/` as application inputs, not disposable notes.
