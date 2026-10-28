# BibleQuest work entry point

V7.1 is released. The current task is repository cleanup before V8. Read [current status](../V7_ACTIVE_STATUS.md), then [rulebook section 1](RULEBOOK.md#1-authority-and-fast-start) and only the sections needed for your task.

## Authorities

| Subject | Maintained authority |
|---|---|
| Operating policy | [RULEBOOK.md](RULEBOOK.md) |
| Current release and next work | [V7_ACTIVE_STATUS.md](../V7_ACTIVE_STATUS.md) |
| Future scope and inherited V7.1 features | [DEVELOPMENT_PLAN_V8.md](../DEVELOPMENT_PLAN_V8.md) |
| Documentation map | [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md) |
| Production promotion | [RELEASE.md](RELEASE.md) and existing exact-SHA gate |
| Frozen rollback identities | [BACKUP_MANIFEST.md](../BACKUP_MANIFEST.md) |
| Documentation organization | [DOCUMENTATION.md](DOCUMENTATION.md) |
| Lessons | [LESSONS_LEARNED.md](LESSONS_LEARNED.md) |

Fetch the assigned live baseline, check local changes and open PR ownership, implement a bounded change, verify affected behavior and publish an exact handoff. Use [the task template](templates/TASK.md) when a nontrivial handoff is needed. Branch new work from current `main`; do not use rollback branches or stale V7 development work as a replacement baseline.

## Historical material

[Archive index](../docs/archive/README.md) contains prior release narratives and [V7 task handoffs](../docs/archive/v7/README.md). Versioned runtime, data, tests, workflows and path-bound contracts remain active where inherited. A filename's version does not establish that it is disposable.

V7 artwork production remains frozen under the [text-first contract](../docs/v7/V7_TEXT_FIRST_RELEASE_RESET_20261017.md); do not restart generation or old lane queues. See [AGENTS.md](../AGENTS.md) for the task-specific entry points.
