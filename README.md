# BibleQuest — parity rebuild

Active rebuild branch: `rebuild-v2-clean`

BibleQuest is being rebuilt on a small explicit runtime while preserving the complete current original application as a resource and compatibility source. The objective is **feature parity without returning to the old all-at-once startup chain**.

## Deployment for this rebuild

GitHub is the source of truth for the parity rebuild.

GitHub Pages: `https://11ll11l1l1l.github.io/BibleQuest/`

Do not make Cloudflare changes as part of this rebuild. `main` remains separate from the clean/parity branch until the replacement has been validated.

## Architecture

Root `index.html` boots only the rebuilt host:

- `bq2.js` — shell, hash routing, local state, Daily Journey
- `bq2-reader.js` — BSB + Tagalog Bible reader
- `bq2-games.js` — quizzes, group play, kids games
- `bq2-bookquiz.js` — large on-demand per-book recall banks
- `bq2-grow.js` — Bible World, Transformation, profile/backup
- `bq2-study.js` — stories, wisdom, deep questions, notes, recordings, family tools
- `bq2-parity.js` — original-style home and complete feature hub
- `bq2-parity.css` — scoped visual parity layer using original design language/assets
- `bq2-sw.js` — clean service worker

The latest original `main` resource tree is also retained on the rebuild branch. It supplies artwork, data, translation/context resources, standalone tools, cloud/community modules, and the complete compatibility application.

## Complete original compatibility mode

`classic.html` preserves the latest original BibleQuest feature chain and visual system for capabilities that have not yet been rewritten natively.

It intentionally does **not** load `pwa-runtime.js`, so it cannot replace the clean host service worker. The clean root remains the deployment/runtime authority.

Standalone original tools remain independently accessible, including:

- Transformation full assessment
- Psychometrics
- Content Review
- Admin
- Admin Operations
- Reset/recovery tools

See `PARITY_MATRIX.md` for the comprehensive original → rebuild mapping.

## Clean native capabilities

Already rewritten on the explicit runtime:

- Daily Journey: Retrieve → Context → Learn → Apply → Reflect
- XP, streaks, badges, local progress
- full 66-book BSB reader
- full 66-book Tagalog reader
- Quick Recall, Context Challenge, Mixed Quest
- large per-book Book Recall decks
- Who Am I and Timeline games
- Bible World progression
- Transformation reflection/next-step guidance
- Play Together pass-and-play
- kids Memory Match, Hiragana Match, Bible Who Am I
- Story Journey
- Wisdom Situations
- Deep Questions
- private local notes
- safe Recordings link library
- Couples & Family discussion notes
- local JSON backup/import/reset
- mobile-first PWA/offline shell
- professional original-style home using the original Pinoy/Japan artwork

## Preserved original capabilities

Capabilities not yet natively rewritten remain available through `classic.html` or their standalone pages rather than being removed. These include Japanese 口語訳/furigana, translation helpers, Verse Peek, STEPBible context, accounts/recovery/cloud sync, congregation/community, Journey Groups, Live Rooms, leaderboards, assignments, ministry, media, notifications, presence, teams, couples cloud, avatars, personality tools, tutorial/onboarding, reporting/moderation, diagnostics, accessibility, and administrative tools.

This is deliberate transition architecture: **preserve first, rewrite cleanly second, remove compatibility only after equivalent behavior is validated.**

## Validation

Run from the repository root:

```bash
node scripts/validate-rebuild-v2.mjs
```

The parity validator checks:

- clean root boot does not load legacy runtime scripts
- parity CSS/JS and compatibility bridge exist
- original feature resources and visual assets are retained
- `classic.html` references valid local resources
- `classic.html` cannot register the legacy service worker
- standalone original tools remain present
- clean JavaScript syntax
- all 66 English BSB packs
- all 66 Tagalog packs
- listed per-book recall decks
- parity service-worker resources
- core capability entries in `PARITY_MATRIX.md`

## Development rule

Do not restore missing features by adding the original entire script chain back to root `index.html`. Migrate one capability group at a time behind an explicit module/interface, while `classic.html` protects feature availability during the transition.

See `REBUILD_V2.md` and `PARITY_MATRIX.md` for the architecture and parity contracts.
