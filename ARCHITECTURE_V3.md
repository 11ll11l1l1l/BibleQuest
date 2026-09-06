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
+-- App Shell
|   +-- src/app/router.js          one navigation system
|   +-- src/app/store.js           one global state model
|   +-- src/app/session.js         one auth/session owner (milestone 2)
|   +-- src/app/bootstrap.js       one application entry point
|
+-- Core Services
|   +-- src/core/storage.js        one persistence boundary
|   +-- src/core/api.js            one remote/API wrapper
|   +-- src/core/bible-data.js     one Bible data service
|   +-- src/core/progress.js       one XP/streak/progress service
|   +-- src/core/audio.js          one audio owner
|   +-- src/core/recording.js      one recordings/player owner
|
+-- Engines
|   +-- src/engines/lesson.js      one lesson lifecycle
|   +-- src/engines/transform.js   one transform engine
|   +-- src/engines/game.js        one game launcher/lifecycle
|
+-- Features
|   +-- src/features/daily-mission/
|   +-- src/features/reader/
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
    +-- future reusable cards/dialogs/buttons/layout helpers
```

Files listed as future milestones do not count as implemented until they exist and are verified.

## Hard boundaries

1. `index.html` has exactly one JavaScript entry: `src/app/bootstrap.js`.
2. Features never register their own hash/router listeners.
3. Features never create independent global application stores.
4. Browser persistence is accessed only through `src/core/storage.js`.
5. Authentication state is accessed only through `src/app/session.js` after milestone 2.
6. Remote requests go through `src/core/api.js` after that service exists.
7. Bible files/translation loading goes through `src/core/bible-data.js`.
8. XP, streak, achievements and learning progress go through `src/core/progress.js`.
9. Audio and recording playback each have exactly one lifecycle owner.
10. Transform logic has one engine and games have one launcher.
11. A feature may render only inside the view handed to it by the shell. It must not replace the application shell.
12. No v3 code may depend on `window.BQ*` legacy globals.
13. Legacy modules may be consulted for behavior, content contracts, resources and edge cases, but are not boot dependencies.

## Feature migration procedure

For each feature:

1. Read the old workflow and resources.
2. Write the acceptance workflow into `FEATURE_INVENTORY_V3.md` and tests before calling it verified.
3. Implement against core interfaces only.
4. Run architecture validation.
5. Run the entire v3 browser regression suite.
6. If the workflow passes, mark **Verified**.
7. On the next later milestone that still passes the entire suite, promote the prior feature to **Regression-tested**.

## Bug-fix rule

Every bug fix must document:

1. **Root cause** — the mechanism that produced the defect, not merely the visible symptom.
2. **Regression test** — the automated workflow or invariant that fails before the fix and passes after it.

If either is missing, the change is considered a patch and should not be merged into the stable milestone branch.

## Milestone order

1. Stable shell/navigation/global state.
2. Authentication/session.
3. Bible data/content loading.
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

The GitHub connector available in this session cannot create Git tag refs directly, so milestone snapshots use immutable-style `release/...` branches until tags are created through Git or another GitHub interface. Do not move a release snapshot after it is declared known-good.

Suggested sequence once each milestone is verified:

- `release/v3.0-base`
- `release/v3.1-auth-stable`
- `release/v3.2-bible-data-stable`
- `release/v3.3-progress-stable`
- `release/v3.4-lessons-stable`
- `release/v3.5-daily-mission-stable`
- `release/v3.6-transform-stable`
- `release/v3.7-recordings-stable`

The current v2 deployment is retained separately as `release/v2-parity-snapshot`; it is a rollback snapshot, not evidence that v3 features are verified.
