# BibleQuest v3 Visual Polish Progress

Updated: 2026-09-11 JST after exact-SHA verification of cumulative visual tranche 11.

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

- Branch: `postrelease/v3-visual-couples-tranche11`.
- Exact product SHA: `8525232c5a7498d020f044742518139484a96681`.
- Parent exact-green visual checkpoint: tranche 10 product at `2679239895da95ed4968af906890575aac02bb24`.
- The cumulative branch also carries the tranche-10 evidence-only commit `4634d27813c2e20dd8091b4c6e5d44252df39a29`.
- Product delta from the exact-green tranche-10 product consists of that evidence-only progress update plus the intentionally narrow Couples presentation delta:
  - `index.html`: one stylesheet include;
  - `src/ui/couples-visual-polish.css`: presentation-only overlay;
  - `tests/v3-couples-visual-polish-static.mjs`: visual replacement boundary contract.
- No JavaScript, feature owner, route, storage, backend, service worker, data, or Supabase file changed in tranche 11.

## Tranche 9

Context Lab, Japanese vocabulary presentation, and source/provenance presentation received replacement-level polish through backgrounds, borders, shadows, decorative state treatment, and a higher-contrast presentation path. Existing layout geometry, touch targets, responsive breakpoints, Reader ownership, lexical/vocabulary behavior, Scripture content, and provenance semantics remain owned by the established files.

Verifier: `verify/v3-visual-context-source-4df2062`; workflow run `34576459592`, job `103189915914`, **success** on detached exact product SHA `4df20622b2b484d14436322a59b106c0fa70ba87`.

Passed: Cloudflare deployment gate; 9 visual contracts; 53 architecture validators; 86 edge/security/static regressions; 68 Playwright browser/mobile regressions plus Kids Memory browser acceptance; dedicated Context/source computed-style and containment checks at 1280x900 and 390x844.

## Tranche 10

Private Notes and Cloud Notes received replacement-level polish through surface gradients, border refinement, shadows, count/message treatment, empty-state treatment, and form-surface refinement. Existing local-only privacy behavior, cloud-account boundaries, persistence isolation, form/editor behavior, target sizes, responsive layout, and accessibility ownership remain unchanged.

Verifier: `verify/v3-visual-notes-2679239`; workflow run `34577053621`, job `103191804643`, **success** while checking out detached exact product SHA `2679239895da95ed4968af906890575aac02bb24`.

Executed and passed:

- exact-SHA and diff hygiene against tranche 9;
- Cloudflare deployment gate, including syntax over 267 JavaScript files and production-entry/runtime ownership guards;
- 10 accumulated visual static contracts, including the new Private/Cloud Notes contract;
- 53 accumulated v3 architecture validators;
- 86 edge/security/static regressions;
- 68 Playwright browser/mobile regressions plus Kids Memory browser acceptance;
- existing Private Notes browser persistence/export/delete/privacy checks and Cloud Notes preview/privacy/isolation checks as part of the accumulated suite;
- dedicated computed-style and horizontal-containment acceptance at 1280x900 and 390x844 for both Notes surfaces.

No PASS was transferred from a different product SHA.

## Tranche 11

Couples local and Couples cloud received replacement-level presentation polish through surface gradients, border/shadow refinement, relationship-card emphasis, safety-state treatment, and cloud privacy/message presentation. Relationship content, non-competitive framing, safety language, cloud privacy, persistence/sync boundaries, route handoffs, touch targets, feature ownership, and responsive behavior remain unchanged.

Verifier: `verify/v3-visual-couples-8525232`; workflow run `34577583033`, job `103193461208`, **success** while checking out detached exact product SHA `8525232c5a7498d020f044742518139484a96681`.

Executed and passed:

- exact-SHA and diff hygiene against exact-green tranche 10 product SHA `2679239895da95ed4968af906890575aac02bb24`;
- Cloudflare deployment gate, including syntax over 267 JavaScript files and production-entry/runtime ownership guards;
- 11 accumulated visual static contracts, including the new Couples local/cloud contract;
- 53 accumulated v3 architecture validators;
- 86 edge/security/static regressions;
- 68 Playwright browser/mobile regressions plus Kids Memory browser acceptance;
- existing Couples cloud and Couples/family browser regressions as part of the accumulated suite;
- dedicated computed-style and horizontal-containment acceptance at 1280x900 and 390x844 for both Couples surfaces, including the local safety-state treatment and cloud presentation.

No PASS was transferred from a different product SHA.

## Cumulative visual surfaces completed through tranche 11

- Home hero/presentation.
- Games decorative chrome.
- Reader reading surfaces.
- Bible World presentation/assets within retained boundaries.
- Progress and Daily Journey presentation.
- Transform presentation.
- Study / Deep Questions / Story Journey / Wisdom Situations presentation.
- Account and Tutorial presentation.
- Context Lab / Japanese vocabulary / source-provenance presentation.
- Private Notes / Cloud Notes presentation.
- Couples local / Couples cloud presentation.

## Next work

Continue on a new isolated cumulative branch from the verified tranche-11 line. The next selected low-risk family is Community Bridge presentation, using a presentation-only overlay while preserving congregation/member semantics, permissions/privacy, persistence/backend boundaries, route handoffs, touch targets, accessibility semantics, and responsive behavior. Do not change production `main` or the frozen r3 rollback branch while developing or verifying the next tranche.
