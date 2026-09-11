# BibleQuest v3 Visual Polish Progress

Updated: 2026-09-11 JST after exact-SHA verification of cumulative visual tranche 9.

## Production reference

- Production `main`: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.
- Frozen rollback/reference: `release/v3-production-20260911-r3` at the same SHA.
- Production is not modified by post-release visual work.

## Visual replacement rules

- `VISUAL_REPLACEMENT_CONTRACT_V3.md` is the governing visual-only contract.
- `VISUAL_SURFACE_INVENTORY_V3.md` classifies safe replacement surfaces.
- Visual changes must remain presentation-level: no route/navigation changes, no feature ownership changes, no storage/API/Supabase changes, no gameplay/reward changes, no Scripture/source semantic changes, and no responsive-layout redesign.
- Every changed product SHA must earn its own verification evidence.

## Cumulative verified checkpoint

- Branch: `postrelease/v3-visual-context-source-tranche9`.
- Exact product SHA: `4df20622b2b484d14436322a59b106c0fa70ba87`.
- Parent visual checkpoint: `postrelease/v3-visual-account-tutorial-tranche8` at `318a96367fb7cd106625750445f6009b30aa3271`.
- Delta from tranche 8 is intentionally narrow:
  - `index.html`: one stylesheet include.
  - `src/ui/context-source-visual-polish.css`: presentation-only overlay.
  - `tests/v3-context-source-visual-polish-static.mjs`: boundary contract.
- No JavaScript, feature owner, route, storage, backend, service worker, data, or Supabase file changed in tranche 9.

## Tranche 9 scope

Context Lab, Japanese vocabulary presentation, and source/provenance presentation received replacement-level polish through backgrounds, borders, shadows, decorative state treatment, and a higher-contrast presentation path. Existing layout geometry, touch targets, responsive breakpoints, Reader ownership, lexical/vocabulary behavior, Scripture content, and provenance semantics remain owned by the established files.

## Exact verification evidence

Verifier branch: `verify/v3-visual-context-source-4df2062`.

Workflow run `34576459592`, job `103189915914`, concluded **success** while checking out detached exact product SHA `4df20622b2b484d14436322a59b106c0fa70ba87`.

Executed and passed:

- exact-SHA and diff hygiene against tranche 8;
- Cloudflare deployment gate, including syntax over 267 JavaScript files and production-entry/runtime ownership guards;
- 9 accumulated visual static contracts, including the new Context/Japanese/source contract;
- 53 accumulated v3 architecture validators;
- 86 edge/security/static regressions;
- 68 Playwright browser/mobile regressions plus Kids Memory browser acceptance;
- existing Context Lab, Japanese vocabulary, source/provenance, Reader, accessibility, PWA and offline browser regressions as part of the accumulated suite;
- dedicated computed-style and horizontal-containment acceptance at 1280x900 and 390x844 for Context Lab and the Learn source guide.

No PASS was transferred from a different product SHA.

## Cumulative visual surfaces completed through tranche 9

- Home hero/presentation.
- Games decorative chrome.
- Reader reading surfaces.
- Bible World presentation/assets within retained boundaries.
- Progress and Daily Journey presentation.
- Transform presentation.
- Study / Deep Questions / Story Journey / Wisdom Situations presentation.
- Account and Tutorial presentation.
- Context Lab / Japanese vocabulary / source-provenance presentation.

## Next work

Continue from the exact green tranche-9 SHA on a new isolated branch. Prefer a narrowly related CSS-only presentation family with existing functional browser regressions. Do not change production `main` or the frozen r3 rollback branch while developing or verifying the next tranche.
