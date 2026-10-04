# Documentation rules

- `work/README.md` is the work entry point; `DOCUMENTATION_INDEX.md` maps product/release documentation.
- Keep one authority per subject. Link to current status, checklist and backup files rather than duplicating their counts or SHAs across new reports.
- Use Markdown for maintained instructions, decisions and lessons. Use `.txt` only when plain text is needed; `START_HERE.txt` is a pointer, not a second rulebook.
- Keep task drafts temporary unless a decision, evidence or handoff must survive. Persist meaningful decisions in the existing version's ADR location, evidence in its existing evidence folder, and progress in active status.
- For a durable task record use `work/tasks/YYYYMMDD-short-purpose.md` and the template. Create this directory only when there is a real task record. Record owner, branch/SHA, scope, checks and handoff; do not create empty task queues.
- After completion, status points to the final record. Move obsolete narrative records under `docs/archive/<version>/`; repair real links and check dependent contracts.
- Do not archive application text data, migrations, scripts or tests as documentation. Do not rewrite historical evidence to match a later outcome.
- Before moving documentation, search references in runtime, scripts, tests and workflows. Retain referenced paths or update their consumers in an intentional validated change.
- Before publishing documentation-only work, run `git diff --check`, check changed local links and confirm the diff has no unintended runtime changes. Reuse affected existing validators where file moves or contracts require them.
