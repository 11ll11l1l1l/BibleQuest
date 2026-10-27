# BibleQuest current status

Updated: 2026-10-27 JST. V7 and V7.1 have shipped. This is the current status authority; older pending-release/lane statements are historical.

## Released baseline

The live repository `main` inspected for cleanup is `87cb9dd4c3b60b9679e0acecda519300194b6d55`, the merged [V7.1 release PR #1550](https://github.com/11ll11l1l1l/BibleQuest/pull/1550). That PR contains the sealed candidate, production workflow links, served-artifact digest and deployment outcome. These are recorded release results, not new certification of this documentation cleanup or a fresh physical-device test.

- V7.1 adds phone-first conversation decks and congregation-scoped realtime host/participant sessions in EN/TL/CEB, and fixes bounded service-worker sign-out cleanup. [Feature contract](docs/v7-1/V7_1_LEADER_SMALL_GROUP_RELEASE.md).
- V7 phone UI release: [PR #1549](https://github.com/11ll11l1l1l/BibleQuest/pull/1549). Library, ONE 2 ONE, licensed Reader, content review, compact book/devotional presentation and approved images are inherited.
- Rollback identities remain in [BACKUP_MANIFEST.md](BACKUP_MANIFEST.md). Physical-device acceptance remains unobserved; no physical PASS is claimed.

## Current owner request and next work

1. Clean and consolidate V7 documentation before V8. [Cleanup handoff](work/tasks/20261027-v7-workspace-cleanup.md).
2. Refresh [V8 deferred scope](DEVELOPMENT_PLAN_V8.md) against released V7.1. Conversation Deck/realtime are inherited features, not an unimplemented new engine. Central media/moderation, full Ilocano Bible/UI, broader content and Couples expansion remain future scope.
3. Implement the next bounded V8 task after the contract refresh; do not reactivate V7 image quotas or old phase assignments.

## Preserved boundaries

The [V7 text-first policy](docs/v7/V7_TEXT_FIRST_RELEASE_RESET_20261017.md) still governs V7 maintenance. Keep approved artwork, source/rights/Scripture evidence, unpublished candidates and rejection tombstones distinct. No artwork generation is part of this cleanup. Existing security, tenant/privacy, PWA/offline and exact-SHA release gates remain enforced.

The previous cumulative status is preserved in the [V7 historical status snapshot](docs/archive/v7/records/V7_STATUS_BEFORE_CONSOLIDATION_20261027.md). Its dates, counts, OPEN gates and lane assignments are time-bound history; consult live evidence before acting.
