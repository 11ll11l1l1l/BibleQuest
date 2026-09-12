# BibleQuest V4 — Whole-App Polish Audit (Section G)

Audited against `v4/modern-ui-overhaul` after Section F (custom artwork) and the Couples Journey / Community family certifications. This is a real, evidence-based audit — every finding below was verified by inspecting actual source, not assumed. Checkpoint for the fixes made here: `release/v4-whole-app-audit`.

## Method

Static analysis across all `src/features/*/index.js`, `src/app/*.js`, and `src/ui/*.css` (87 CSS files). No browser render was available for a true visual pass, so findings are grounded in code inspection: emoji/glyph scans, CSS rule presence, cross-referencing certified tranche decisions, and the existing automated test suite's actual coverage boundaries. Where something could only be confirmed with a real browser, it's recorded as open for Section H, not claimed as passed.

## Findings and fixes

### ✅ Fixed: Icon consistency — Community hub category icons
Community hub (`src/features/community/index.js`) rendered 7 category icons as raw emoji (⛪🏆🏅📮📡👥💛) despite matching custom art already existing unused in `assets/v4/community/`. Wired using the same certified overlay technique as Avatar Vault/Home/Learn/More (hide emoji via `font-size:0`, apply `background-image` to the existing 44px icon span certified by `community-family-v4.css`, restore emoji under `forced-colors`). Zero markup/hook changes.

### ✅ Fixed: Typography hierarchy — 2 families missing display font on h1
Audited all 20 `*-v4.css` family files for whether they set `font-family:var(--font-display)` on their page heading, matching the other 18. Two did not:
- `community-family-v4.css` — styled the shared `h1` selector for color/margin but never set the display font.
- `couples-journey-v4.css` — same gap on its intro/result headings.

Both fixed with a one-line addition matching the exact pattern already used everywhere else.

### ✅ Confirmed clean: Reduced-motion coverage
All 87 CSS files were checked for `transition`/`animation`/`@keyframes` usage without a `prefers-reduced-motion` guard. Zero gaps — every file either has its own local guard or relies on the global `* { }` catch-all in the certified `v4-foundation.css`. No action needed.

### ✅ Confirmed clean: Family accent-color tokens
`family-accents-v4.css` already defines a distinct deep/accent/soft color triad for each of the 6 experience families (Home, Learn, Play, Grow, Community, Ministry), addressing the "one identity wearing six hats" finding from the earlier UI assessment. No action needed here.

### ⚠️ Open, recorded, not fixed this pass: Games still shows emoji chrome
`src/features/games/index.js` renders 13 distinct emoji as game-mode/medal/HUD chrome (🦊🕵️🧠🏆🌟🌱📘🗃️🪙 etc.) and `src/features/games/memory.js` renders 8 more as Memory Meadow card faces (🐨🐯🐰🐵🐸🐼🦁🦊). This is a **known, previously-recorded deferral** (Games+Avatar Vault tranche was deliberately CSS-only because the markup is one dense phase-based render function with ~20 hooks). Confirmed still true and still the single largest visible "placeholder artwork" surface in the app. Matching unused assets already exist (`assets/v4/games/game-*.png`, `assets/v4/memory-meadow/memory-*.png`) — wiring them safely requires touching `games/index.js`'s markup directly (not a CSS-only overlay, since these are literal emoji characters inside dynamic template strings tied to game state, not static category icons in stable positions). Recommend as its own dedicated tranche, not squeezed into an audit pass.

### ⚠️ Open, recorded: ~25 other files still contain emoji/directional-glyph characters
A full scan found emoji or arrow glyphs in 30 files total. Beyond Games (above) and the Community hub (fixed above), the remainder split into two categories that do **not** need fixing:
- **Directional UI glyphs** (←, →, ↑, ↓, ↗) in Accessibility, Backup, Admin Operations, Reader, Home, Daily Mission, Psychometrics, Reset Recovery, Open Review — simple back/next markers, a normal and acceptable UI convention, not "placeholder art."
- **Content data**, not chrome: Bible World region emoji are already hidden by the certified `journey-v4.css` numbered-step design (confirmed rendered as `font-size:0`); Story Journey's scene emoji (⛓🌍🌾👑🔥🦁🪨🫧🫶) are narrative content markers tied to specific certified story beats, not generic icons; Leaderboard medals (🥇🥈🥉) are a near-universal, well-understood UX convention with no matching per-rank asset in the current inventory.
- **Genuinely lower-priority leftovers**, recorded but not fixed this pass: Couples Family/Cloud's mode-grid icons (🧭💬👂🌡️🕊️✝️✨), Notification Center's category icons (🎬🏅💬📊📖📣📮🔔🧭), Congregation Recognition and Encouragements' category icons (🌱🎖️🏅💛📖🔥🗺️🤝, 👏💛📖🔥🙏). None have their emoji hidden by a later certified redesign (unlike Bible World), and several have matching unused assets (`community/prayer-circle.png`, `community/family.png`, `community/friendship.png`, etc.) — these are good candidates for the next artwork-wiring pass, in roughly this priority order: Couples Family/Cloud (highest visibility, most-used feature) → Notification Center → Congregation Recognition / Encouragements.

### ⚠️ Open, recorded: Document-overflow automated coverage is narrower than it looks
`tests/v3-final-mobile-widths-smoke.mjs` verifies zero horizontal overflow at 320/375/768/1024px — but only for `PRIMARY_ROUTES = ['home','learn','play','grow','more']`, the 5 bottom-nav roots. It does **not** independently verify Community, Couples Journey, Congregation, Admin Console, Content Review, or any other deep-linked feature page. This isn't a discovered bug (nothing is known to overflow), but it is a real, previously-unstated gap in what "passing this test" actually proves. Recommend Section H's device-verification pass explicitly re-run the same overflow check against every maintained route, not just the 5 tab roots, before treating overflow as fully audited.

### Not independently auditable without a real browser (deferred to Section H)
Loading/empty/error/success/signed-out/offline states, layout shift, and localization text-expansion resilience (Japanese/Cebuano vs. English string lengths) all require rendering the app under those specific conditions — session states, network failures, long translated strings — which static code inspection can describe but not verify. Per-feature handling of these states was spot-checked and appears structurally present (e.g. Calendar/Home/Assignments all have explicit loading/empty/error branches in their app-owner code), but a systematic browser-driven pass is Section H's job, not something this static audit can honestly claim to have closed.

## Navigation/IA reachability re-check

Re-verified the 3-tap rule now that the Community family is certified: Community hub itself is reachable at Home → More → Community (2 taps), and each of its 7 sub-destinations (Congregation, Leaderboards, Recognition, Assignments, Live Rooms, Journey Groups, Encouragements) is one further tap (3 taps total from Home) — consistent with the rest of the app. No regression found from adding the Community family.

## Summary

| Item | Status |
|---|---|
| Loading states | Open — needs browser audit (Section H) |
| Empty states | Open — needs browser audit (Section H) |
| Error states | Open — needs browser audit (Section H) |
| Success/completion states | Open — needs browser audit (Section H) |
| Signed-out states | Open — needs browser audit (Section H) |
| Offline/recovery states | Open — needs browser audit (Section H) |
| Icon consistency | Partially fixed (Community); Games + 3 other features recorded open with priority order |
| Typography hierarchy | **Fixed** (2 gaps found and closed) |
| Spacing/surface consistency | No gaps found in this pass |
| Clipping/document overflow | Coverage gap documented (5 routes tested, not all routes) |
| Layout shifts | Open — needs browser audit (Section H) |
| Localization text expansion | Open — needs browser audit (Section H) |
| Micro-interactions/transitions | No gaps found in this pass |
| Reduced-motion | **Confirmed clean** — zero gaps across 87 files |
| Placeholder/legacy artwork | Partially fixed (Community); Games + others recorded open with priority order |
| Navigation/IA reachability | **Confirmed clean** — Community family doesn't break the 3-tap rule |
