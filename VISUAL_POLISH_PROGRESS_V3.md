# BibleQuest v3 Visual Polish Progress

Updated: 2026-09-11 JST after exact-SHA verification of cumulative visual tranche 16.

## Production reference

- Production `main`: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.
- Frozen rollback/reference: `release/v3-production-20260911-r3` at the same SHA.
- Production is not modified by post-release visual work.

## Visual replacement rules

- `VISUAL_REPLACEMENT_CONTRACT_V3.md` is the governing visual-only contract.
- `VISUAL_SURFACE_INVENTORY_V3.md` classifies safe replacement surfaces.
- Visual changes remain presentation-level: no route/navigation changes, no feature ownership changes, no storage/API/Supabase changes, no gameplay/reward changes, no Scripture/source semantic changes, and no responsive-layout redesign.
- Every changed product SHA earns its own exact-SHA verification evidence. Evidence-only documentation or verifier commits are not product SHAs.

## Current exact-green visual checkpoint

- Product branch: `postrelease/v3-visual-shell-tranche16`.
- Exact verified product SHA: `406c34dcdf904b7483bf4381be774a908738e60c`.
- Parent exact-green product SHA: tranche 15 at `62cb86cd48bae683d0be37a2a729127156a0093a`.
- Verifier branch: `verify/v3-visual-shell-406c34d`.
- Workflow run `34585018541`, job `103217107423`: **success** while checking out detached exact product SHA `406c34dcdf904b7483bf4381be774a908738e60c`.
- Exact tranche-16 product delta from tranche 15 is only:
  - `index.html`: one global-shell visual stylesheet include;
  - `src/ui/shell-visual-polish.css`: presentation-only shell overlay;
  - `tests/v3-shell-visual-polish-static.mjs`: visual replacement boundary contract.
- No JavaScript, feature owner, route, storage, backend, service worker, data, or Supabase file changed in tranche 16.

## Tranche 12 — Community Bridge

Exact product SHA: `81c0f350e3081224d6f9e3ee535eada00d913cb8`.

Community Bridge presentation received replacement-level surface polish while preserving congregation/member semantics, permissions/privacy, persistence/backend boundaries, route handoffs, touch targets, accessibility semantics, and responsive behavior.

Verifier: `verify/v3-visual-community-81c0f35`; run `34581500653`, job `103205866023`, **success**. Exact-SHA hygiene, Cloudflare deployment gate, accumulated visual contracts, 53 architecture validators, 86 edge/security/static regressions, 68 browser/mobile regressions plus Kids Memory acceptance, and dedicated Community desktop/mobile containment all passed.

## Tranche 13 — Media and Recordings

Exact product SHA: `d3e7de3dae25d2958fe76ef7a5d1e8919525c624`.

Media Library and Recordings presentation received replacement-level decorative treatment while preserving playback lifecycle, source switching, error recovery, ownership boundaries, routes, controls, responsive behavior, and accessibility semantics.

Verifier: `verify/v3-visual-media-d3e7de3`; run `34582508892`, job `103209112573`, **success**. Exact-SHA hygiene, Cloudflare deployment gate, 13 accumulated visual contracts, 53 architecture validators, 86 edge/security/static regressions, 68 browser/mobile regressions plus Kids Memory acceptance, and dedicated Media desktop/mobile containment all passed.

## Tranche 14 — Adaptive Learning and Open Review

Exact product SHA: `4c93af06ebbf7069b8ae587f77479997f77f2b9b`.

Adaptive Learning and Open Review received presentation-only surface polish. Scheduling, mastery, scoring, queue behavior, touch targets, layout geometry, responsive breakpoints, and feature ownership remain with the established product files.

Verifier: `verify/v3-visual-review-4c93af0`; run `34583043243`, job `103210813955`, **success**. Exact-SHA hygiene, Cloudflare deployment gate, 14 accumulated visual contracts, 53 architecture validators, 86 edge/security/static regressions, 68 browser/mobile regressions plus Kids Memory acceptance, and dedicated Review desktop/mobile containment all passed.

## Tranche 15 — Accessibility presentation

Exact product SHA: `62cb86cd48bae683d0be37a2a729127156a0093a`.

Accessibility received a narrow reversible visual overlay for panel/select surfaces, headings, status presentation, and contrast-aware decorative treatment. Text sizing, focus behavior, reduced-motion logic, preference persistence, labels, responsive geometry, routes, and accessibility semantics remain unchanged and owned by the established Accessibility implementation.

Verifier: `verify/v3-visual-accessibility-62cb86c`; run `34584175284`, job `103214410932`, **success**.

Executed and passed on the exact product SHA:

- exact-SHA and exact three-file diff hygiene against tranche 14;
- Cloudflare deployment gate, including syntax over 267 JavaScript files and production-entry/runtime ownership guards;
- 15 accumulated visual static contracts;
- 53 accumulated v3 architecture validators;
- 86 edge/security/static regressions;
- 68 Playwright browser/mobile regressions plus Kids Memory browser acceptance;
- existing Accessibility keyboard/readability/persistence regression;
- dedicated computed-style and horizontal-containment checks at 1280x900 and 390x844;
- strong-contrast verification that decorative shadows are removed without horizontal overflow.

## Tranche 16 — Global shell/theme presentation

Exact product SHA: `406c34dcdf904b7483bf4381be774a908738e60c`.

The global shell received replacement-level presentation polish limited to the page background, sticky top bar, brand mark, build/session chips, and fixed bottom navigation. Shell dimensions, top/bottom navigation structure, route ownership, focus behavior, responsive breakpoints, hit targets, session state, and feature presentation ownership remain unchanged.

An initial candidate `b0f2620ef0e0792db0c50a533a438837bbf3b297` was **not** accepted: verifier run `34584870801` reproduced an existing Account visual load-order contract failure because the shell layer had been inserted between `app.css` and `account-visual-polish.css`. The root cause was corrected by preserving the established Account direct-after-`app.css` ordering and loading the shell presentation layer immediately after it. No PASS was transferred from the failed SHA.

Fresh verifier: `verify/v3-visual-shell-406c34d`; run `34585018541`, job `103217107423`, **success** while checking out detached exact product SHA `406c34dcdf904b7483bf4381be774a908738e60c`.

Executed and passed on the corrected exact product SHA:

- exact-SHA and exact three-file diff hygiene against tranche 15 product SHA `62cb86cd48bae683d0be37a2a729127156a0093a`;
- Cloudflare deployment gate, including syntax over 267 JavaScript files and production-entry/runtime ownership guards;
- 16 accumulated visual static contracts;
- 53 accumulated v3 architecture validators;
- 86 edge/security/static regressions;
- 68 Playwright browser/mobile regressions plus Kids Memory browser acceptance;
- dedicated shell computed-style and horizontal-containment checks at 1280x900 and 390x844;
- confirmation that the top bar remains sticky, bottom navigation remains fixed at its established height, five primary navigation links remain present, and no horizontal overflow is introduced;
- strong-contrast verification that decorative topbar/navigation/session-chip shadows are removed without changing shell geometry.

No PASS was transferred from a different product SHA.

## Cumulative visual surfaces completed through tranche 16

- Home hero/presentation.
- Global shell/theme presentation.
- Games decorative chrome.
- Reader reading surfaces.
- Bible World presentation/assets within retained boundaries.
- Progress and Daily Journey presentation.
- PWA/app icon artwork within the existing manifest/install contract.
- Transform presentation.
- Study / Deep Questions / Story Journey / Wisdom Situations presentation.
- Account and Tutorial presentation.
- Context Lab / Japanese vocabulary / source-provenance presentation.
- Private Notes / Cloud Notes presentation.
- Couples local / Couples cloud presentation.
- Community Bridge presentation.
- Media Library / Recordings presentation.
- Adaptive Learning / Open Review presentation.
- Accessibility presentation.

## Visual-phase boundary reached

The currently classified replacement-level A/B visual surfaces in `VISUAL_SURFACE_INVENTORY_V3.md` have now been covered by the cumulative visual-polish line. The remaining explicitly classified areas are behavior/architecture-coupled Class D owners such as router/bootstrap/core services, PWA/offline/service-worker behavior, and Supabase/API/storage/security. They must not be entered merely to continue visual polish.

Further product development should begin as a separately scoped post-release milestone from this exact-green checkpoint, with an explicit product objective and its own rebuild-and-verify acceptance contract. Production `main` and the frozen r3 rollback branch remain untouched until a later separately authorized promotion and production verification cycle.
