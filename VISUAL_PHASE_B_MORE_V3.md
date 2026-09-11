# BibleQuest v3 — Visual Phase B: More hub feature icons

Status: **completed, exact-green and promoted**
Selected: 2026-09-12 JST
Verified/promoted: 2026-09-12 JST

## Why this surface

`VISUAL_PHASE_B_V3.md` identifies remaining minimal/text-like presentation as active Priority 1 visual work. The canonical mapped `assets/icons/v3/` binary family is still absent from the product tree, so nonexistent mapped paths were not wired.

The More hub was a verified functional surface dominated by repeated text panels and text buttons. This milestone introduced a deliberate replacement icon family without inventing features or changing the hub's information architecture.

## Bounded product change

- committed same-origin SVG symbol asset: `assets/more-feature-icons.svg`;
- semantic decorative icon on each existing More tool card;
- dedicated `src/ui/more-phase-b.css` layer after retained `more-visual-polish.css`;
- every existing button, route callback, PWA-install state, copy/feature owner and backend boundary preserved;
- accessible text labels retained; icons are decorative and `aria-hidden`;
- only presentation/layout adjustments required to host artwork were added.

## Explicitly unchanged

The milestone did not change:

- route names or navigation ownership;
- tool availability;
- congregation/ministry permissions;
- PWA install behavior;
- local/cloud persistence;
- API/Supabase/storage ownership;
- scoring, rewards or gameplay;
- Calendar behavior;
- service-worker ownership or offline request policy.

The historical `more-visual-polish.css` tranche remains intact. Phase B is layered separately so earlier exact-SHA visual evidence is preserved.

## Asset rule

The new sprite is an intentional Phase B asset, not a claim that the missing historical `assets/icons/v3/` family was recovered. No `assets/icons/v3/` path was introduced.

The sprite contains semantic symbols for workspace, notifications, community, ministry, review, couples, couples-cloud, journey-groups, team, accessibility, install, backup, mission, calendar and congregation.

## Permanent acceptance

The milestone permanently requires:

1. all required symbol IDs in the committed SVG asset;
2. every existing More tool panel referencing its intended sprite symbol;
3. `more-phase-b.css` loaded after `more-visual-polish.css`;
4. no external/remote image dependency or nonexistent `assets/icons/v3/` path;
5. real `#/more` browser execution at 390 px loading the sprite, rendering all icon hosts, preserving >=44 px action targets and avoiding horizontal overflow;
6. explicit higher-contrast presentation;
7. both Phase B tests retained by `.github/workflows/v3-regression.yml`;
8. complete accumulated exact-candidate verification for changed product SHAs.

Permanent tests:

- `tests/v3-more-phase-b-static.mjs`
- `tests/v3-more-phase-b-smoke.mjs`

## Exact verification and promotion evidence

PR #100 candidate integration was tested as exact synthetic merge commit:

`046e2a85cafe10d722d03d467d3733eddfeb6e65`

with parents:

- base exact-green product `350cb1e583b207e10ba8dc50c3bb683dc50f9494`;
- feature head `624b8e53d6df0c1a2dba5af98f88b2b269618220`.

GitHub Actions run `34618963635` checked out exact `046e2a85...` and passed:

- all accumulated architecture validators;
- all accumulated edge/security/static regressions, including the new Phase B asset/workflow-retention contract;
- the complete accumulated browser/mobile suite;
- dedicated More Phase B 390 px acceptance, including successful sprite loading, 15 distinct semantic refs, >=44 px action targets and no horizontal overflow.

After that complete PASS:

- exact SHA `046e2a85...` was frozen at `release/v3-phase-b-more-icons-20260912`;
- `main` was fast-forwarded directly to that exact verified commit;
- PR #100 was therefore recorded merged with the same exact commit, not a new SHA.

Cloudflare Pages provider checks later reported successful deployment for exact `046e2a85...` on both configured projects. Independent two-host byte/browser production verification remains a separate evidence stage and was not silently transferred from an older release.

No PASS transfers from this milestone to future product SHAs.
