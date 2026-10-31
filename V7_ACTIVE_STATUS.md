# BibleQuest current status

Updated: 2026-10-31 JST. V7 and V7.1 have shipped. This is the current status authority; older pending-release/lane statements are historical.

## Released baseline

The live repository `main` inspected for cleanup is `87cb9dd4c3b60b9679e0acecda519300194b6d55`, the merged [V7.1 release PR #1550](https://github.com/11ll11l1l1l/BibleQuest/pull/1550). That PR contains the sealed candidate, production workflow links, served-artifact digest and deployment outcome. These are recorded release results, not new certification of this documentation cleanup or a fresh physical-device test.

- V7.1 adds phone-first conversation decks and congregation-scoped realtime host/participant sessions in EN/TL/CEB, and fixes bounded service-worker sign-out cleanup. [Feature contract](docs/v7-1/V7_1_LEADER_SMALL_GROUP_RELEASE.md).
- V7 phone UI release: [PR #1549](https://github.com/11ll11l1l1l/BibleQuest/pull/1549). Library, ONE 2 ONE, licensed Reader, content review, compact book/devotional presentation and approved images are inherited.
- Rollback identities remain in [BACKUP_MANIFEST.md](BACKUP_MANIFEST.md). Physical-device acceptance remains unobserved; no physical PASS is claimed.

## Current owner request and next work

The owner authorized accelerated V8 development on 2026-10-28. [V8 plan](DEVELOPMENT_PLAN_V8.md) owns phase scope; this file remains the current release/status authority.

1. Cleanup [PR #1554](https://github.com/11ll11l1l1l/BibleQuest/pull/1554) is not merged. Its original head passed 8/9 workflows; convergence failed installing Playwright 1.55 on Ubuntu 26.04 before browser execution. Repair head `7440cbb1df2fa54b25e898c66fe76a57ccbc79d9` pins Ubuntu 24.04; new CI is running. No gate was removed.
2. First V8 P1 slice: public Library reading → related canonical discussion series. Uses published topic metadata only; source prose, reading IDs and private answers do not enter the session. Local preview never sends automatically; joined-session state remains authoritative. [Implementation handoff](work/tasks/20261028-v8-library-group-handoff.md).
3. P2 congregation Files coding now includes durable metadata/quota/audit migration, repository, authenticated endpoint, Drive adapter/OAuth, upload/review/download UI, recovery and removal cleanup on the stacked coding branch. Provider configuration, broader media scope/management and deployed integration remain open. Full QA is deferred by owner instruction; no media feature/release completion is claimed. [Coding handoff](work/tasks/20261031-v8-media-coding.md). P3 Ilocano source/licensing remains open. Do not rebuild the shipped V7.1 engine or reopen image queues.

4. Owner-added spiritual practices scope: Silencio/timer/private-reflection, discovery/selected-verse meditation, short/custom durations, daily-life guides and wake-lock slices is implemented on its isolated review branch; 759/759 V7 tests and production build pass. [Implementation evidence and remaining scope](work/tasks/20261031-v8-spiritual-practices.md). Full V8 scope and certification remain open.

5. Combined V8 integration now brings cleanup/Library/group/media/practices together on `v8/integration-20261031`. [Integration evidence and open checks](work/tasks/20261031-v8-integration.md): Local aggregate V6 880/880, V7 759/759, media 9/9 and build pass after reconciling eight stale legacy assertions. Previous candidate passed 10/11 remote workflows; the inherited Reader option-order validator is repaired locally. Remote candidate `9146f098` subsequently passed all eleven distinct workflows. The new app-open reminder slice has 1,654 local tests and build passing; [scope and evidence](work/tasks/20261101-v8-practice-reminders.md). That reminder candidate subsequently passed all eleven distinct workflows. The next offline-preparation/transition-cue slice has 1,662 local units and build passing; [scope and limits](work/tasks/20261101-v8-practice-offline-cues.md). New exact-head remote certification remains pending for the latest slice. Original source PRs remain open.

V8 implementation is not deployed or certified. Published V7.1 and its rollback remain unchanged.

## Preserved boundaries

The [V7 text-first policy](docs/v7/V7_TEXT_FIRST_RELEASE_RESET_20261017.md) still governs V7 maintenance. Keep approved artwork, source/rights/Scripture evidence, unpublished candidates and rejection tombstones distinct. No artwork generation is part of this cleanup. Existing security, tenant/privacy, PWA/offline and exact-SHA release gates remain enforced.

The previous cumulative status is preserved in the [V7 historical status snapshot](docs/archive/v7/records/V7_STATUS_BEFORE_CONSOLIDATION_20261027.md). Its dates, counts, OPEN gates and lane assignments are time-bound history; consult live evidence before acting.
