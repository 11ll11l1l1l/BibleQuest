# BibleQuest

BibleQuest is a Bible learning, study, family, community and ministry web application with games, assignments, Bible reading, congregation features, administrative tools, PWA/offline support and related learning experiences.

## Current production

**BibleQuest V4 RC3 is the active production release.**

- production host: `https://mybiblequest.pages.dev`
- exact promoted V4 application candidate: `7de1c53ddd33c028498b35bee77be30e56878dec`
- exact production merge: `3c74d4f3600dbb05070ba57adb7c3c0b539a9aeb`
- final V4 production/acceptance status: `V4_ACTIVE_STATUS.md`

V4 has completed automated post-production acceptance. Manual Phase 6 Gates A-G were explicitly owner-waived for that release and must not be described as field-test PASS results.

## Before changing anything

Read these in order:

1. `DOCUMENTATION_INDEX.md` — which documentation is current versus historical.
2. `BACKUP_MANIFEST.md` — canonical frozen V3/V4 backup branches and exact SHAs.
3. `V4_ACTIVE_STATUS.md` — final V4 production record.
4. `docs/V5_STARTING_POINT.md` — clean handoff rules before V5 development begins.

## Version archives

- V3 archive: `docs/archive/v3/README.md`
- V4 archive: `docs/archive/v4/README.md`
- archive policy/index: `docs/archive/README.md`

Historical V3/V4 documents intentionally remain in their existing paths where tests, workflows, architecture validators or old links may reference them. Do not treat their old phase status as current simply because the files remain at repository root.

## Development state

V4 is frozen as the accepted production baseline. V5 is **not started yet**.

V5 should begin only after the release/archive cleanup is merged to `main`. Create a dedicated V5 integration branch and new V5 authority/status documentation from that cleaned `main` baseline; do not develop from an archive branch or reactivate a historical V3/V4 status file.

## Safety rules

- Keep one serialized integration stream for runtime changes.
- Repository, CI and deployed-environment evidence override stale chat or historical documentation.
- Preserve authentication, RLS, privacy/isolation and server-side authorization boundaries unless a reviewed versioned change intentionally replaces them.
- Do not weaken valid automated tests merely to make a release green.
- Preserve exact release backups until a later explicit retention decision.
- Treat `archive/*` branches listed in `BACKUP_MANIFEST.md` as read-only by project policy.

## Validation

The repository still contains accumulated V3/V4-named validators and workflows because they protect current behavior. Their names are historical; their coverage remains useful until V5 deliberately migrates or replaces them with equivalent-or-stronger checks.
