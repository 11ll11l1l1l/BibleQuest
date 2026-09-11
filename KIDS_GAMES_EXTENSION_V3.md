# BibleQuest v3 Kids Games Extension Contract

Status: post-parity extension rule. The current verified Kids game set is sufficient for the v3 release. Additional Kids/Kana games are optional future work and must not block release unless explicitly reopened.

## Purpose

New games must plug into the existing Games page without creating another launcher, progress store, navigation owner, or page-specific runtime. The current Games architecture remains the host.

## Ownership

1. `src/app/games.js` remains the single owner for game launch, round lifecycle, scoring/review/result transitions, and cleanup.
2. `src/features/games/index.js` remains presentation/event forwarding for the Games page. New games must not install a second page shell or global runtime.
3. `src/core/progress.js` remains the only owner of XP, stars, coins, streak, badges, counters, and activity events.
4. `src/core/storage.js` remains the only browser persistence boundary. A game must not call `localStorage` or `sessionStorage` directly.
5. `src/app/router.js` remains the navigation owner. Games must not manipulate browser history directly.
6. Scripture/source data must come from its existing owner. A game must not fetch or copy Bible data through a second data path.

## Game registration contract

Every future Kids game must have one stable game ID and one explicit registration entry containing at least:

- stable `id` using lowercase kebab-case;
- display `title`;
- short `description` and age/skill or category metadata;
- launcher label/artwork reference;
- the Games-owned start action or adapter;
- teardown/cleanup behavior;
- reward policy (`none`, or an explicitly recovered/approved Progress reward);
- source/provenance metadata when BibleQuest-authored Bible content is used.

A game is linked to the Kids/Play page through this registration path only. Do not hard-code a second launcher card elsewhere in Home, Learn, or another feature.

## Runtime rules

- Start/replay/leave must produce a fresh, deterministic round identity where rewards or completion can occur.
- Leaving the game must cancel timers, animation frames, listeners, pending async work, and stale resolution tokens owned by that game.
- A game may not leave document-level listeners, observers, intervals, audio, or locks active after teardown.
- A new game must not mutate another game's state.
- Shared UI/state belongs to Games; game-specific rules belong in a focused module under `src/features/games/` or a Games-owned adapter under `src/app/`.
- No `window.BQ*`, MutationObserver feature injection, direct DOM surveillance, or direct backend/storage shortcuts.

## Kids UX rules

- Touch-first controls with approximately 44px minimum interactive targets.
- Must function at 390px portrait without horizontal overflow; if the game has a width-dependent board, its breakpoint and board-size rule must be explicit and tested.
- Keyboard/focus behavior is required when the interaction can reasonably support it.
- Use short, age-appropriate instructions and a clear leave/back action.
- Reduced-motion behavior must not break game completion.
- Correctness feedback must be understandable without relying only on color or animation.

## Bible/content safety

- BibleQuest-authored Bible questions/clues must use existing provenance and doctrinal-safety boundaries.
- Open reflection must never be converted into spiritual-quality scoring.
- Scripture text must not be rewritten or silently substituted by a game.
- If a game uses a source answer, retelling, or authored clue, label the content through the existing provenance path.

## Reward rules

- No game may invent XP/stars/coins merely because another game awards them.
- Rewards require either recovered old behavior or an explicit new-product decision.
- All rewards go through `src/core/progress.js` with duplicate/replay protection.
- Kids games may deliberately use zero XP, as Memory Meadow currently does.

## Required verification for a new game

Before a future game is release-eligible:

1. focused architecture validation: single ownership, no direct storage/progress/router/backend bypass;
2. edge tests: malformed state, replay, rapid clicks/taps, leave during pending work, duplicate reward protection;
3. browser test at 390px plus the game's relevant breakpoint/desktop path;
4. launch → play → finish → replay → choose another game → leave sequence;
5. accumulated BibleQuest architecture, edge/security, and browser/mobile regression suite;
6. promotion/bookkeeping verification on the exact changed SHA before freeze.

## Current release decision — 2026-09-11

The verified current game set is accepted as the v3 release set. Inventory rows #39 Hiragana Match and #40 Kids Bible Who Am I are retired from the v3 release scope by user decision and remain candidates for future expansion only. Existing #36 Character Detective / Who Am I and #38 Kids Memory Match remain available; no duplicate Kids-specific Who Am I game is required for the current release.
