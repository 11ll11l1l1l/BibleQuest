# BibleQuest clean rebuild (v2)

Branch: `rebuild-v2-clean`

This branch starts from the September 4 baseline and replaces its boot path with a deliberately small, local-first runtime. Legacy files remain in Git history/reference, but `index.html` does not load them.

## Boot surface

- `index.html`
- `bq2.css`
- `bq2-data.js`
- `bq2.js` — shell, routing, state, Daily Journey
- `bq2-reader.js` — English BSB + Tagalog 66-book lazy reader
- `bq2-games.js` — starter quizzes, group play, kids games
- `bq2-bookquiz.js` — lazy large per-book recall packs
- `bq2-grow.js` — Bible World, Transformation, profile/tools
- `bq2-study.js` — stories, wisdom, deep questions, notes, recordings, family tools
- `bq2-sw.js`
- `data/questions.js` and `data/stories.js` — content only
- `data/packs/bible/*.json`, `data/packs/tagalog/*.json`, `data/packs/questions/*.json` — lazy content packs

## Working features in the clean runtime

- Daily Journey: Retrieve → Context → Learn → Apply → Reflect
- Streak protection from one meaningful daily activity
- XP and local progress
- Full 66-book English BSB reader using bundled book packs
- Full 66-book Tagalog reader using bundled book packs
- Lazy translation/book loading to keep startup light
- Quick Recall quiz
- Context Challenge quiz
- Mixed Quest quiz
- Large Book Recall mode using on-demand per-book question packs
- Who Am I character game
- Timeline game
- Story Journey study
- Practical Wisdom situations
- Deep Questions discussion mode
- Bible World progression map
- Transformation self-reflection with autosaved answers and next-step guidance
- Play Together pass-and-play group quiz with scoreboard
- Kids mode: Memory Match, Hiragana Match, and Bible Who Am I
- Private local notes
- Lightweight Recordings library: external links only, no embedded player runtime
- Couples & Family guided discussions with private notes
- Local profile, badges, backup/export, restore/import, and reset
- Installable PWA/offline cache for the clean shell and content opened on the device
- Mobile-first responsive navigation

## Deliberately not carried forward in the clean boot

Cloud accounts, congregation administration, remote networked live rooms, cloud leaderboards, remote media management, assignments, and other server-dependent modules are not in the clean boot surface. They should return only as isolated modules after the local core is proven stable.

## Architecture rule

A new feature must not mutate the shell through global MutationObservers or runtime injection. Features register explicit routes, use the versioned state store, and must fail without unmounting the app shell. Large Bible/question resources are loaded on demand rather than at startup.
