# BibleQuest work folder

Canonical entry point for development, maintenance and production release work. Updated 2026-10-04 JST.

## Start here

1. Read the fast-start section of the [rulebook](RULEBOOK.md) and task-relevant sections only.
2. Read [current V7 status](../V7_ACTIVE_STATUS.md) for development or [V6 production status](../V6_ACTIVE_STATUS.md) for production maintenance.
3. Fetch the task's branch and record its current SHA. Inspect only files needed for the task.
4. Use the [task template](templates/TASK.md) for nontrivial work. Execute, verify affected behavior, then update the relevant status with evidence.

## Folder contents

| File | Purpose |
|---|---|
| [RULEBOOK.md](RULEBOOK.md) | Canonical comprehensive rules, with task-scoped checking |
| [RULES.md](RULES.md) | Short rulebook navigation |
| [LESSONS_LEARNED.md](LESSONS_LEARNED.md) | V1–V6 issue ledger, evidence limits and rule mapping |
| [RELEASE.md](RELEASE.md) | Existing exact-SHA release procedure |
| [DOCUMENTATION.md](DOCUMENTATION.md) | Authority, naming and archival rules |
| [templates/TASK.md](templates/TASK.md) | Task scope and final handoff |
| [START_HERE.txt](START_HERE.txt) | Short plain-text entry point |

## Sources of truth

| Subject | Authority |
|---|---|
| Development progress | [V7_ACTIVE_STATUS.md](../V7_ACTIVE_STATUS.md) |
| Development baseline | [V7 starting point](../docs/V7_STARTING_POINT.md) |
| Released V6 and outstanding acceptance | [V6 status](../V6_ACTIVE_STATUS.md), [V6 checklist](../V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md) |
| Rollback identities | [BACKUP_MANIFEST.md](../BACKUP_MANIFEST.md) |
| Exact-SHA release gate | [V6 gate contract](../docs/v6/V6_RC_EXACT_SHA_GATE.md) |
| Historical records | [Archive index](../docs/archive/README.md) |

This folder points to evidence rather than copying it. Keep source code, tests, workflow definitions and migrations in their existing locations. V7 feature work has not been scoped by this setup.
