# BibleQuest — clean rebuild

Active rebuild branch: `rebuild-v2-clean`

This version is a from-scratch replacement runtime based on the September 4 content/data baseline. It does not boot the old layered BibleQuest JavaScript, Cloudflare-specific runtime, Supabase client modules, runtime observers, or feature-repair patches.

## Current goal

Keep BibleQuest usable today with a small static GitHub-hostable application first. Reintroduce remote/cloud features later only as isolated modules after the local core is stable.

## Clean boot

`index.html` loads one stylesheet plus explicit clean modules:

- `bq2.js` — shell, routing, local state, Daily Journey
- `bq2-reader.js` — English BSB + Tagalog Bible reader
- `bq2-games.js` — quizzes, group play, kids games
- `bq2-bookquiz.js` — large on-demand per-book recall banks
- `bq2-grow.js` — Bible World, Transformation, profile/backup
- `bq2-study.js` — stories, wisdom, deep questions, notes, recordings, family tools
- `bq2-data.js` — small application data model
- `bq2-sw.js` — clean PWA cache

Legacy application files remain in repository history/reference but are not loaded by this rebuild.

## Available now

- Daily Journey: Retrieve → Context → Learn → Apply → Reflect
- XP, streak, badges, local progress
- Full 66-book English BSB reader
- Full 66-book Tagalog reader
- Lazy book loading and offline cache after content is opened
- Quick Recall, Context Challenge, Mixed Quest
- Large Book Recall mode from bundled per-book question packs
- Who Am I and Timeline games
- Story Journey
- Situations & Wisdom
- Deep Questions
- Bible World progression
- Transformation reflection and next-step guidance
- Play Together pass-and-play scoreboard
- Kids Memory Match, Hiragana Match, Bible Who Am I
- Private notes
- Lightweight Recordings link library with no embedded video runtime
- Couples & Family discussion notes
- Local JSON backup/export/import/reset
- Mobile-first PWA shell

## Not in the clean boot yet

These depend on server-side infrastructure and are intentionally excluded from the replacement runtime for now:

- account/login synchronization
- congregation administration and roles
- remote live rooms
- cloud leaderboards
- assignments/push workflows
- remote media management
- server-managed multi-device synchronization

Their old implementations are not to be re-enabled by adding more startup scripts. Each should return as a separately tested module with an explicit interface.

## Validation

Run locally from the repository root:

```bash
node scripts/validate-rebuild-v2.mjs
```

The validator checks clean boot references, bans legacy runtime files from `index.html`, syntax-checks the clean JavaScript, verifies the 66-book English and Tagalog pack sets, and verifies listed per-book recall packs.

## Hosting direction

For this rebuild, treat GitHub as the source of truth. Do not make Cloudflare changes as part of clean-core development. The existing repository's historical GitHub Pages workflow should also not be treated as part of the new runtime architecture.

See `REBUILD_V2.md` for the feature and architecture contract.
