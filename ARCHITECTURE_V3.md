# BibleQuest v3 Architecture Contract

## Development model

BibleQuest v3 uses **rebuild-and-verify**, not patch-and-accumulate. Feature parity and stability are tracked separately. A capability is complete only after its actual workflow is verified; legacy/compatibility code is reference material only.

## Single-owner architecture

```text
BibleQuest v3
|
+-- App Composition / State
|   +-- src/app/bootstrap.js       one application entry/composition point
|   +-- src/app/router.js          one navigation system
|   +-- src/app/store.js           one global state model
|   +-- src/app/session.js         one auth/session/password owner
|   +-- src/app/account.js         one signup/recovery/device workflow owner
|   +-- src/app/reader.js          one reader navigation/read-state owner
|   +-- src/app/daily-mission.js   one Daily Journey orchestration owner
|
+-- Core Services
|   +-- src/core/storage.js        one browser persistence boundary
|   +-- src/core/api.js            one Supabase/remote API wrapper
|   +-- src/core/bible.js          one Bible source/fetch/cache/search/link service
|   +-- src/core/progress.js       one XP/streak/activity/achievement owner
|   +-- src/core/audio.js          future one audio owner
|   +-- src/core/recording.js      future one recordings/player owner
|
+-- Engines
|   +-- src/engines/lesson.js      one guided-lesson lifecycle owner
|   +-- src/engines/transform.js   one Transform state/scoring owner
|   +-- src/engines/game.js        future one game launcher/lifecycle
|
+-- Features
|   +-- src/features/account/
|   +-- src/features/learn/
|   +-- src/features/reader/
|   +-- src/features/progress/
|   +-- src/features/daily-mission/
|   +-- src/features/transform/    definitions now; UI after engine verification
|   +-- src/features/recordings/
|   +-- src/features/games/
|   +-- src/features/bible-world/
|   +-- src/features/tutorial/
```

## Hard boundaries

1. `index.html` boots exactly one JavaScript entry: `src/app/bootstrap.js`.
2. Router/history ownership stays in `src/app/router.js`.
3. Global application state stays in `src/app/store.js`; feature-local globals are forbidden.
4. Browser persistence is accessed only through `src/core/storage.js`.
5. Authentication/session/password transitions are owned by `src/app/session.js`.
6. Signup, recovery and remembered-device workflows are owned by `src/app/account.js`.
7. Supabase/backend calls go through `src/core/api.js` only.
8. Bible metadata, pack fetch/cache, search and external Bible-tool links go through `src/core/bible.js` only.
9. Reader selection/navigation/read-state orchestration goes through `src/app/reader.js`.
10. XP, streak, activity counters and achievements are mutated only by `src/core/progress.js`; callers submit deterministic event IDs.
11. Guided lesson lifecycle state is owned only by `src/engines/lesson.js`.
12. Daily Journey composition and reader/progress reconciliation are owned by `src/app/daily-mission.js`; it stores no parallel mission state.
13. All Transform answers, derived scores/results, journal/reflection, bounded history, reset behavior and Transform persistence are owned only by `src/engines/transform.js`.
14. Transform definition/content data lives in `src/features/transform/content.js`; UI must consume engine state rather than recalculate scores.
15. Persisted Transform derived results are never authoritative. On load, result values are reconstructed from validated answers when a valid result timestamp proves the assessment had been calculated.
16. A changed Transform answer invalidates that domain’s previous result before a new calculation.
17. Transform engine writes storage before replacing in-memory state and has no DOM, router, Supabase or progress dependency.
18. Basic/full Transform UI is not implemented until the engine has independently passed architecture, service and browser regression.
19. Audio, recording and games remain untouched until their locked milestones.
20. No v3 source may depend on `window.BQ*` legacy globals.
21. Copyrighted Bible translations are not bundled without verified redistribution rights.

## Feature migration procedure

Audit old behavior → define acceptance → implement behind owners → run architecture/service tests → run full accumulated browser suite → promote in a separate ledger commit → rerun exact ledger commit → freeze release → continue.

Every bug fix must document root cause and the automated regression that prevents recurrence.

## Milestone order

1. Stable shell/navigation/global state.
2. Authentication/session/account security.
3. Bible data/content loading and reader core.
4. User progress/state.
5. Core lesson engine.
6. Daily Mission.
7. Transform.
8. Audio + Live Recordings.
9. Games.
10. Bible World/progression.
11. Tutorial/avatar.
12. Remaining secondary features.
13. Full old-vs-new audit.
14. Mobile regression.
15. Production deployment.

## Releases

Known-good sequence: `release/v3.0-base` → `release/v3.1-session-core` → `release/v3.2-auth-complete` → `release/v3.3-reader-core` → `release/v3.4-progress-core` → `release/v3.5-lesson-engine` → `release/v3.6-daily-mission`.

Next snapshot is Transform only after #48 engine plus #46/#47 feature workflows are independently verified and the exact promoted ledger is green. Production remains isolated v2.
