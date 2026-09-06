# BibleQuest clean rebuild (v2)

Branch: `rebuild-v2-clean`

This branch replaces the production boot path with a deliberately small, local-first runtime. Legacy files remain in Git history/reference, but `index.html` does not load them.

## Boot surface

- `index.html`
- `bq2.css`
- `bq2-data.js`
- `bq2.js`
- `bq2-sw.js`
- `data/questions.js` (content only)
- `data/packs/bible/*.json` (Bible text packs)

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
- Kids Games launch kept isolated from the main runtime
- Local profile, badges, backup/export, restore/import, and reset
- Installable PWA/offline cache for the clean shell and opened Bible books
- Mobile-first responsive navigation

## Deliberately not carried forward yet

Cloud accounts, congregation administration, remote live rooms, cloud leaderboards, media management, assignments, and other server-dependent modules are not part of this first clean boot. They should return only as isolated modules after the local core is stable.

## Architecture rule

A new feature must not mutate the shell through global MutationObservers or runtime injection. Features should be routed explicitly from `bq2.js`, keep state under the versioned local store, and fail without unmounting the app shell.
