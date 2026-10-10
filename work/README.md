# BibleQuest work folder

Canonical entry point for development, maintenance and production release work. Updated 2026-10-04 JST.

> **Artwork V7 update (2026-10-11):** [single master, live localized text, deterministic crop and evidence-backed five-agent QA](../docs/v7/V7_SINGLE_MASTER_CROP_QA_CONTRACT_20261011.md) governs new image work. Existing V2 three-file release validators stay enforceable until a tested compatibility migration lands.

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

## V7 image work — mandatory for all chats and agents

Before ANY artwork task, read [automatic five-agent QA, central attempt ledger, achievable raster sizes and fail-delete policy](../docs/v7/V7_AUTOMATED_IMAGE_QA_AND_LEDGER_20261011.md), [construction guidebook](../docs/v7/unfinished-artwork-guide/00_COMPLETE_CONSTRUCTION_GUIDEBOOK.md), actual image records and current open PRs. All five scheduled agents are QA-only; humans do not have to approve each image. Continue QA with another candidate immediately after failed/held checks. Use `node scripts/v7-image-work-ledger.mjs status` and `next <role>`; merge claims before image generation to avoid repeated production.

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
