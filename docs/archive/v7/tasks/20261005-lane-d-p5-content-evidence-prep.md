# Lane D — P5 content/provenance/localization evidence preparation

Date: 2026-10-05 JST
Starting SHA: `7417ad44ef588fc86a82808426ee971819a6fe42`
Target: `v7/development`
Owner: persistent V7 Lane D

## Outcome

Provide a deterministic, exact-candidate-addressed evidence generator for Lane D's eventual P5 content/provenance/localization certification without taking ownership of release-candidate freeze or human editorial/rights decisions.

## Owned surface

- `src/v7/content/release-evidence.js`
- `scripts/v7-content-release-evidence.mjs`
- `tests/v7/content-release-evidence.test.mjs`
- `docs/v7/P5_D_CONTENT_PROVENANCE_LOCALIZATION_EVIDENCE_PREP.md`
- this task record

## Acceptance

1. Evidence requires an explicit full 40-character Git candidate SHA.
2. Representative bundles are parsed through the canonical V7 content contract.
3. Evidence covers source/provenance, rights/permitted use, review/publication, source locale, translation review metadata, and V7 UI localization completeness.
4. Evidence excludes source and translated content bodies.
5. Current unresolved content decisions remain OPEN rather than being converted to PASS.
6. The helper does not freeze/promote a release candidate or edit shared release/PWA/workflow/schema/router surfaces.

## Current boundary

- Machine evidence generation: implementable and testable in Lane D.
- Genuine Book/Devotional editorial approval: external human/content-review boundary.
- Past Teaching rights resolution and editorial approval: external human/content-review boundary.
- Final P5 exact-SHA certification/promotion: serialized release-owner boundary.
