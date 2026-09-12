# BibleQuest V5 Starting Point

Status: **PREPARATION ONLY — V5 DEVELOPMENT HAS NOT STARTED**

Updated: 2026-09-13 JST

## Baseline

V5 must begin from the cleaned `main` line after the release-archive cleanup PR is merged.

The currently accepted production runtime is BibleQuest V4 RC3:

- exact application candidate: `7de1c53ddd33c028498b35bee77be30e56878dec`
- production merge: `3c74d4f3600dbb05070ba57adb7c3c0b539a9aeb`
- production host: `https://mybiblequest.pages.dev`

V3 and V4 archive branches are recovery/history references only and must not become V5 development branches.

## Before the first V5 feature change

1. Create one V5 integration branch from the cleaned current `main` head.
2. Create a new V5 authority/status file; do not overwrite or reactivate `V4_ACTIVE_STATUS.md`.
3. Record V5 scope, non-goals, release gates and migration rules before implementation begins.
4. Keep one serialized runtime integration stream; analysis helpers must not independently mutate overlapping runtime ownership.
5. Re-run the accumulated architecture, security/privacy, responsive/PWA, protected-page and whole-app regression baseline on the initial V5 branch before substantive redesign.

## Contracts inherited unless V5 explicitly changes them

V5 starts with V4 production behavior as its compatibility baseline, including:

- server-side RLS/authentication/authorization boundaries;
- single-owner runtime architecture and explicit feature ownership;
- one shared media/audio playback owner rather than competing persistent players;
- privacy/isolation contracts for assignments, presence, congregation data and administrative operations;
- mobile-first responsive/PWA/offline/recovery behavior;
- rollback preservation until a future V5 production release is accepted.

An intentional V5 architecture change may replace one of these contracts only if the V5 authority document records the decision and the relevant tests are updated rather than weakened.

## Historical documentation rule

- `/DOCUMENTATION_INDEX.md` decides which version documents are current.
- `/BACKUP_MANIFEST.md` defines canonical backups.
- `/docs/archive/v3/README.md` and `/docs/archive/v4/README.md` classify historical records.
- V3/V4 documents may be consulted for requirements/history, but their old phase status or release blockers do not become V5 tasks automatically.

## First V5 cleanup candidates

These may be assessed after the V5 baseline is established, not silently removed before it:

- obsolete compatibility/dead architectural owners such as the retained Media Library modules;
- version-specific workflow/file naming that still says `v3` or `v4` even though the tests remain useful;
- root-level historical documentation clutter, once any hardcoded workflow/test references are migrated safely;
- redundant historical development branches, when repository tooling with branch deletion is available.

No V5 feature implementation should start until the archive-cleanup PR is merged and its required automated checks are green.
