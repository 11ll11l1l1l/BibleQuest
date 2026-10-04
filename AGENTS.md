# BibleQuest work instructions

Start at [work/README.md](work/README.md). Apply [work/RULES.md](work/RULES.md) to repository work and read [work/LESSONS_LEARNED.md](work/LESSONS_LEARNED.md) for the relevant task only.

Production authority: `main` and deployed exact-SHA evidence. Development authority: `V7_ACTIVE_STATUS.md` on `v7/development`. Never treat historical documents or chat summaries as current release evidence.

Keep one bounded task, one owner for each edited surface, and one serialized integration stream. Reuse existing tests and release workflows. No broad audit, redesign, dependency upgrade or infrastructure replacement unless required by the assigned task.

Do not delete migrations, runtime compatibility code, tests, source data or rollback refs because their names contain older versions. Preserve production and physical-evidence boundaries in work/RULES.md. Update the relevant authority with actual evidence before handing off.
