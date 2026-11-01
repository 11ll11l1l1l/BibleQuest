# BibleQuest current status

Updated: 2026-11-01 JST. V7 and V7.1 have shipped. This is the current status authority; older pending-release/lane statements are historical.

## Released baseline

The live repository `main` inspected for cleanup is `87cb9dd4c3b60b9679e0acecda519300194b6d55`, the merged [V7.1 release PR #1550](https://github.com/11ll11l1l1l/BibleQuest/pull/1550). That PR contains the sealed candidate, production workflow links, served-artifact digest and deployment outcome. These are recorded release results, not new certification of this documentation cleanup or a fresh physical-device test.

- V7.1 adds phone-first conversation decks and congregation-scoped realtime host/participant sessions in EN/TL/CEB, and fixes bounded service-worker sign-out cleanup. [Feature contract](docs/v7-1/V7_1_LEADER_SMALL_GROUP_RELEASE.md).
- V7 phone UI release: [PR #1549](https://github.com/11ll11l1l1l/BibleQuest/pull/1549). Library, ONE 2 ONE, licensed Reader, content review, compact book/devotional presentation and approved images are inherited.
- Rollback identities remain in [BACKUP_MANIFEST.md](BACKUP_MANIFEST.md). Physical-device acceptance remains unobserved; no physical PASS is claimed.

## Current owner request and next work

The owner authorized accelerated V8 development on 2026-10-28. [V8 plan](DEVELOPMENT_PLAN_V8.md) owns phase scope; this file remains the current release/status authority.

1. Cleanup [PR #1554](https://github.com/11ll11l1l1l/BibleQuest/pull/1554) is not merged. Its original head passed 8/9 workflows; convergence failed installing Playwright 1.55 on Ubuntu 26.04 before browser execution. Repair head `7440cbb1df2fa54b25e898c66fe76a57ccbc79d9` pins Ubuntu 24.04; new CI is running. No gate was removed.
2. First V8 P1 slice: public Library reading → related canonical discussion series. Uses published topic metadata only; source prose, reading IDs and private answers do not enter the session. Local preview never sends automatically; joined-session state remains authoritative. [Implementation handoff](work/tasks/20261028-v8-library-group-handoff.md).
3. P2 congregation Files coding now includes durable metadata/quota/audit migration, repository, authenticated endpoint, Drive adapter/OAuth, upload/review/download UI, recovery and removal cleanup on the stacked coding branch. Provider configuration, broader media scope/management and deployed integration remain open. Full QA is deferred by owner instruction; no media feature/release completion is claimed. [Coding handoff](work/tasks/20261031-v8-media-coding.md). Ilocano corpus/provider source rights are recorded below; full UI/device acceptance remains open. Do not rebuild the shipped V7.1 engine or reopen image queues.

4. Owner-added spiritual practices scope: Silencio/timer/private-reflection, discovery/selected-verse meditation, short/custom durations, daily-life guides and wake-lock slices is implemented on its isolated review branch; 759/759 V7 tests and production build pass. [Implementation evidence and remaining scope](work/tasks/20261031-v8-spiritual-practices.md). Full V8 scope and certification remain open.

5. Combined V8 integration on `v8/integration-20261031` retains cleanup/Library/group/media/practices. [Integration evidence](work/tasks/20261031-v8-integration.md). Last full local aggregate before focused continuations: V6 880, V7 785, media V8 9 (1,674/1,674) and build PASS. Exact-head CI for the newest changes remains separate. Original source PRs remain open.
6. Ilocano ULB text/provider priority is implemented: 66 books, 1,189 chapters and 31,090 nonempty source records, with 12 source-empty addresses preserved in provenance. [Source/license, implementation and remaining UI/device work](work/tasks/20261101-v8-ilocano-bible.md). Full Ilocano UI is not complete.

V8 has an automatically deployed Cloudflare PR preview; it is not promoted to production or release-certified. Published V7.1 and its rollback remain unchanged.

7. Couples saved-card browsing and category/track-preserving navigation are coded in the integration continuation. Existing 64 cards, local storage and separate cloud authority are retained. New EN/TL/CEB saved-view copy, controller/service checks and build pass locally; browser changes await CI. [Implementation and evidence](work/tasks/20261101-v8-couples-navigation.md).

8. Reviewed Library devotional/teaching topic tags now offer bounded canonical practice links. The practice route previews a routine or opens the daily-life guide without auto-starting or replacing a current session; private prose/answers/reflections are excluded. EN/TL/CEB handoff copy and 31 affected checks pass locally; built-browser steps await CI. [Implementation and evidence](work/tasks/20261101-v8-library-practice-handoff.md).

9. Files now has server-backed filename search, My uploads and lifecycle-state filters with bound pagination, post-read membership checks and account-safe UI reset. Existing visibility/rights/provider boundaries remain. Twenty focused media tests and a disposable Postgres filter query pass; live provider/deployed QA remains open. [Implementation and evidence](work/tasks/20261101-v8-media-filters.md).

10. Daily-practice completion: 10/15/20-minute Morning Surrender choices now use explicit adapted allocations. Evening sessions have five optional source-question answers, and saved reflections/answers can be edited with draft/cancel handling in the existing private store. Fifty-eight affected practice/Library checks and build pass locally; full browser/device acceptance remains separate. [Implementation and evidence](work/tasks/20261101-v8-daily-practice-journal.md).

11. Practice reminder plans now support selected weekdays and any of the eleven fixed timed routines. Home offers a localized chosen-routine setup button without auto-start/dismissal. Legacy daily schedules, quiet hours and per-account storage remain; 67 affected checks and build pass locally. This is app-open only; closed-app delivery is still open. [Implementation and evidence](work/tasks/20261101-v8-routine-plans.md).

12. Library now has an account-scoped device-local Saved for later list for published books/devotionals/teachings. Saves only canonical link/title/type/time metadata; opening reuses the normal published lookup. EN/TL/CEB controls, explicit capacity, stale-owner denial and return focus are coded; 132 Library checks and build pass locally. [Implementation and evidence](work/tasks/20261101-v8-library-reading-list.md).

13. V8 bulk text intake is coded for new devotional/teaching sources: bounded UTF-8 preprocessing, source/packet hashes, deterministic revisions, published-catalog duplicate checks and existing-contract draft packets. No automatic article authorship, rights verification or publication. Ten intake tests plus affected content/media checks pass; real content ingestion/review remains open. [Usage](docs/v8/BULK_LIBRARY_INTAKE.md) and [handoff](work/tasks/20261101-v8-content-intake.md).

## Preserved boundaries

The [V7 text-first policy](docs/v7/V7_TEXT_FIRST_RELEASE_RESET_20261017.md) still governs V7 maintenance. Keep approved artwork, source/rights/Scripture evidence, unpublished candidates and rejection tombstones distinct. No artwork generation is part of this cleanup. Existing security, tenant/privacy, PWA/offline and exact-SHA release gates remain enforced.

The previous cumulative status is preserved in the [V7 historical status snapshot](docs/archive/v7/records/V7_STATUS_BEFORE_CONSOLIDATION_20261027.md). Its dates, counts, OPEN gates and lane assignments are time-bound history; consult live evidence before acting.

Ilocano Reader continuation: an opt-in, visit-scoped ten-label controls preview is implemented with English fallback, chapter-navigation retention and unchanged provider text. Ten affected checks, typecheck and build pass locally; independent language review, visual/device acceptance, full-app localization and exact-head CI remain open. [Handoff](work/tasks/20261101-v8-ilocano-reader-controls.md).
