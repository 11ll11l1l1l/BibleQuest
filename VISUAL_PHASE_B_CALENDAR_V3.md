# BibleQuest v3 — Visual Phase B Calendar artwork

Status: implementation milestone
Date: 2026-09-12 JST

## Purpose

Replace the Calendar surface's remaining emoji-like event markers and minimal presentation with committed same-origin artwork while keeping the existing Calendar interaction model recognizable.

## Scope

- Add a passive SVG sprite for planner, personal, assignment, congregation and empty-state artwork.
- Replace literal Calendar event emoji with decorative SVG references.
- Add a presentation-only Phase B stylesheet after the existing Calendar base stylesheet.
- Improve agenda hierarchy, event-source recognition, form containment and mobile presentation without changing feature behavior.

## Ownership preserved

Every existing button, route callback, Calendar service method, owner edit/delete rule, personal event behavior, fixed-weekly recurrence behavior, assignment aggregation, congregation membership dependency, storage boundary, API boundary and Supabase contract remains owned by the existing implementation.

The Phase B layer must not introduce new persistence, network calls, scoring, routes, recurrence semantics, authorization rules or hidden interaction replacements. Decorative SVGs remain `aria-hidden` because the existing text labels carry meaning.

## Verification

Permanent static coverage must prove the committed sprite, symbol set, same-origin wiring, stylesheet order, accessibility boundary and accumulated-workflow inclusion. Permanent 390 px browser acceptance must prove the artwork loads, event types render distinct semantic symbols, controls retain mobile touch size, and no horizontal overflow or console/page errors are introduced.

No PASS transfers across changed product SHAs. The exact candidate must pass focused checks and the complete accumulated v3 regression before promotion.
