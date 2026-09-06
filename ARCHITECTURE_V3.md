# BibleQuest v3 Architecture Contract

## Development model

BibleQuest v3 uses **rebuild-and-verify**, not patch-and-accumulate.

Two goals are tracked separately:

1. **Feature parity** — every old workflow exists cleanly in v3.
2. **Stability** — every implemented workflow remains passing as later features are added.

A feature cannot be called complete until it passes its real acceptance workflow. Compatibility pages and legacy scripts are reference material only.

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
|   +-- src/engines/lesson.js      future one lesson lifecycle
|   +-- src/engines/transform.js   future one transform engine
|   +-- src/engines/game.js        future one game launcher/lifecycle
|
+-- Features
|   +-- src/features/account/
|   +-- src/features/learn/
|   +-- src/features/reader/
|   +-- src/features/progress/
|   +-- src/features/daily-mission/
|   +-- src/features/transform/
|   +-- src/features/recordings/
|   +-- src/features/games/
|   +-- src/features/bible-world/
|   +-- src/features/tutorial/
|   +-- ...remaining parity features
|
+-- Shared UI
    +-- src/ui/shell.js
    +-- src/ui/app.css
    +-- src/ui/reader.css
    +-- src/ui/progress.css
    +-- future reusable cards/dialogs/buttons/layout helpers
```

Files listed as future milestones do not count as implemented until they exist and are verified.

## Hard boundaries

1. `index.html` has exactly one JavaScript entry: `src/app/bootstrap.js`.
2. Features never register their own hash/router listeners.
3. Features never create independent global application stores.
4. Browser persistence is accessed only through `src/core/storage.js`.
5. Authentication/session/password transitions are owned by `src/app/session.js`.
6. Signup, recovery and remembered-device workflows are owned by `src/app/account.js`.
7. Supabase and account backend calls go through `src/core/api.js` only.
8. Bible metadata, translation registry, pack fetch/cache, search and external Bible-tool URLs go through `src/core/bible.js` only.
9. Reader selection/navigation/read-state orchestration goes through `src/app/reader.js`; reader feature UI never fetches packs directly.
10. XP, streak, meaningful-activity counters and achievements are mutated only by `src/core/progress.js`. Features submit deterministic event IDs and never mutate progression directly.
11. Cross-service progress events use retry-safe ordering: record the idempotent progress event before the feature's secondary state write so a retry heals partial completion without duplicate XP.
12. Audio and recording playback each have exactly one lifecycle owner when migrated.
13. Transform logic has one engine and games have one launcher when migrated.
14. A feature may render only inside the view handed to it by the shell. It must not replace the application shell.
15. No v3 code may depend on `window.BQ*` legacy globals.
16. Legacy modules may be consulted for behavior, content contracts, resources and edge cases, but are not boot dependencies.
17. Copyrighted Bible translations are not bundled or transformed unless the repository has a verified redistribution/derivative-use basis. External links are permitted where the destination provider serves the text itself.

## Feature migration procedure

For each feature:

1. Read the old workflow and resources.
2. Write the acceptance workflow into `FEATURE_INVENTORY_V3.md` and tests before calling it verified.
3. Implement against core interfaces only.
4. Run architecture validation and fast service/transaction tests.
5. Run the entire accumulated v3 browser regression suite.
6. If the workflow passes, mark **Verified** in a separate audited ledger/status commit.
7. Run the complete suite again on that exact status commit.
8. On the next later milestone that still passes the entire suite, promote the prior feature to **Regression-tested**.

## Bug-fix rule

Every bug fix must document the root cause and an automated regression test. If either is missing, the change is considered a patch and should not be accepted into a stable milestone branch.

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

No unrelated new feature work is allowed during parity migration.

## Releases

Milestone snapshots use immutable-style `release/...` branches. Do not move a release snapshot after it is declared known-good.

Known-good sequence:

- `release/v3.0-base`
- `release/v3.1-session-core`
- `release/v3.2-auth-complete`
- `release/v3.3-reader-core`
- next: progress snapshot only after its exact ledger/status commit is green

The current v2 deployment remains production until an explicit later cutover decision. A v2 compatibility path is not evidence that a v3 feature is verified.
