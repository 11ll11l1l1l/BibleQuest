# BibleQuest v3 — Visual Phase B: More hub feature icons

Status: implementation candidate
Selected: 2026-09-12 JST

## Why this surface

`VISUAL_PHASE_B_V3.md` identifies remaining minimal/text-like presentation as active Priority 1 visual work. The canonical mapped `assets/icons/v3/` binary family is still absent from the current product tree, so nonexistent mapped paths must not be wired.

The More hub is a verified functional surface but remains visually dominated by repeated text panels and text buttons. This milestone introduces a deliberate replacement icon family without inventing features or changing the hub's information architecture.

## Bounded product change

- add one same-origin SVG symbol asset at `assets/more-feature-icons.svg`;
- give each existing More tool card a semantic decorative icon;
- load a dedicated `src/ui/more-phase-b.css` layer after the retained tranche-18 More presentation stylesheet;
- keep every existing button, route callback, PWA-install state, copy/feature owner and backend boundary unchanged;
- retain accessible text labels; icons are decorative and hidden from assistive technology;
- allow only small presentation/layout adjustments required to host the artwork.

## Explicitly unchanged

This milestone must not change:

- route names or navigation ownership;
- tool availability;
- congregation/ministry permissions;
- PWA install behavior;
- local/cloud persistence;
- API/Supabase/storage ownership;
- scoring, rewards or gameplay;
- Calendar behavior;
- service-worker ownership or offline request policy.

The historical `more-visual-polish.css` tranche remains intact. Phase B is layered separately so earlier exact-SHA visual evidence is not rewritten.

## Asset rule

The new sprite is an intentional Phase B asset, not a claim that the missing historical `assets/icons/v3/` family was recovered. No `assets/icons/v3/` path may be introduced by this milestone.

The sprite must contain semantic symbols for workspace, notifications, community, ministry, review, couples, couples-cloud, journey-groups, team, accessibility, install, backup, mission, calendar and congregation.

## Acceptance

A candidate is acceptable only if:

1. all required symbol IDs exist in the committed SVG asset;
2. every existing More tool panel references its intended sprite symbol;
3. `more-phase-b.css` is loaded after `more-visual-polish.css`;
4. no external/remote image dependency or nonexistent `assets/icons/v3/` path is introduced;
5. real `#/more` browser execution at 390 px loads the sprite successfully, renders all icon hosts, preserves >=44 px action targets and has no horizontal overflow;
6. higher-contrast presentation remains explicit;
7. accumulated architecture, edge/security and browser/mobile regressions remain green for the changed candidate.

No PASS transfers from the Calendar/Ministry Hub release or earlier visual tranches.
