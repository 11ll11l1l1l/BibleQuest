# BibleQuest clean rebuild (v2)

Branch: `rebuild-v2-clean`

This branch starts from the September 4 baseline and replaces its boot path with a deliberately small, local-first runtime. Legacy files remain in Git history/reference, but `index.html` does not load them.

## Boot surface

- `index.html`
- `bq2.css`
- `bq2-data.js`
- `bq2.js` — shell, routing, state, Daily Journey
- `bq2-reader.js` — 66-book lazy Bible reader
- `bq2-games.js` — quizzes, group play, kids games
- `bq2-grow.js` — Bible World, Transformation, profile/tools
- `bq2-sw.js`
- `data/questions.js` — content only
- `data/packs/bible/*.json` — Bible text packs

## Working features in the clean runtime

- Daily Journey: Retrieve → Context → Learn → Apply → Reflect
- Streak protection from one meaningful daily activity
- XP and local progress
- Full 66-book Bible reader using bundled book packs
- Lazy book loading to keep startup light
- Quick Recall quiz
- Context Challenge quiz
- Mixed Quest quiz
- Who Am I character game
- Timeline game
- Bible World progression map
- Transformation self-reflection with autosaved answers and next-step guidance
- Play Together pass-and-play group quiz with scoreboard
- Kids mode: Memory Match, Hiragana Match, and Bible Who Am I
- Local profile, badges, backup/export, restore/import, and reset
- Installable PWA/offline cache for the clean shell and opened Bible books
- Mobile-first responsive navigation

## Deliberately not carried forward in the first clean boot

Cloud accounts, congregation administration, remote live rooms, cloud leaderboards, media management, assignments, and other server-dependent modules are not in the first boot surface. They should return only as isolated modules after the local core is stable.

## Architecture rule

A new feature must not mutate the shell through global MutationObservers or runtime injection. Features register explicit routes, use the versioned state store, and must fail without unmounting the app shell.
