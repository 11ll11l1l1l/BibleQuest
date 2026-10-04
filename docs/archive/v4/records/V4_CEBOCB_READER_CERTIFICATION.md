# BibleQuest V4 CEBOCB Reader Preservation Certification

Date: 2026-09-12 JST
Status: **PASS / preservation certified**

## Scope

This certification closes the requested V4 preservation audit for the Cebuano/Bisaya CEBOCB Reader integration. It verifies the existing implementation; it does not introduce a second Bible/Reader owner, change Scripture content, or alter Reader product behavior.

## Exact evidence

- Active V4 baseline reconciled before the guard change: `v4/modern-ui-overhaul` @ `60519397c87739ed611206e623ce13915575f705`.
- Preservation guard PR: #138, exact PR head `f7ebe33e10b1a22fab2a522c7592b2d5074d540c`.
- Focused GitHub Actions run: `34686990993` — **PASS**.
- PR merge commit on the active V4 branch: `b676a1d3a02c911caebf011bd1d9800820f20589`.
- Focused validator result: **66 books / 30,552 text records / 31,103 verse addresses / 457 preserved verse bridges**.

## Contracts verified

The existing `scripts/validate-v4-cebocb-packs.mjs` contract passed and verifies all of the following:

- exactly 66 canonical CEBOCB book packs exist under `data/packs/cebuano/`;
- all expected canonical pack filenames are present and no unexpected canonical pack files are accepted;
- verse rows are non-empty, ordered, valid for canonical chapter ranges, and contain no overlapping verse addresses;
- optional verse bridges remain explicit ranges rather than duplicated/split text;
- the CEBOCB source manifest remains `translationId: cebocb`, abbreviation `OCCB`, USFM source, 66 canonical books, and records a valid source-package SHA-256;
- published-source anchor text remains intact for Genesis 1:1, John 3:16 and Romans 8:28;
- the central Bible registry still exposes `cebocb`, visibly labels it `Cebuano/Bisaya`, uses the `cebuano` bundled pack folder, and keeps it in bundled/offline mode;
- the canonical Reader service and Reader UI retain verse-bridge handling;
- Biblica title/trademark, copyright-year, CC BY-SA 4.0 / Attribution-ShareAlike, permission and reduced-pack attribution disclosures remain present.

The focused workflow also syntax-checks `src/core/bible.js`, `src/app/reader.js` and `src/features/reader/index.js`.

## Durable regression guard

`.github/workflows/v4-cebocb-reader-preservation.yml` is now part of the active V4 branch. It reruns the preservation contract when any of these areas change:

- `src/core/bible.js`
- `src/app/reader.js`
- `src/features/reader/**`
- `data/packs/cebuano/**`
- `data/packs/ATTRIBUTION.md`
- `scripts/validate-v4-cebocb-packs.mjs`
- the preservation workflow itself

This closes the previous CI gap where the CEBOCB import workflow primarily guarded import/pack generation changes but a later Reader/core presentation change could avoid rerunning the full CEBOCB integration contract.

## Product impact

No Reader runtime behavior, route ownership, state/storage contract, API/backend contract, authentication/RLS behavior, or Scripture payload was changed by this preservation tranche. The only product-tree addition before this certification record was the dedicated preservation CI workflow.

## Acceptance conclusion

The V4 acceptance item **“Cebuano/Bisaya CEBOCB Reader integration must remain intact through all later V4 changes”** is satisfied. Future changes to the Bible owner, Reader owners, CEBOCB packs or attribution are now covered by a dedicated preservation gate.