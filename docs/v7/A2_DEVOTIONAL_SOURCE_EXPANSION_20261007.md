# V7 A2 devotional source expansion — 2026-10-07

Scope: issue #1282, A2 source expansion + rights/curation coverage.

Status: **first isolated research tranche prepared; not release ready**.

This tranche intentionally does not import devotional bodies, approve editorial content, upgrade global hosting rights, publish content, invent translation review, or replace the existing six-devotional/multilingual work in PR #1264.

## Added machine-readable evidence

- `data/v7/content-sources/devotional-source-catalog.json`
  - 4 source works;
  - 4 authors;
  - 80 stable entry pointers;
  - source/edition notes and rights evidence;
  - all sources remain `external_link` and `candidate_only`.
- `data/v7/curation/devotional-emotion-coverage-seed.json`
  - covers all 30 A1 launch emotions with at least one research candidate;
  - mappings are title-level seeds requiring body validation;
  - target thresholds remain explicit and fail closed.
- `tests/v7/devotional-source-coverage.test.mjs`
  - validates stable source-entry identity;
  - validates exact 30-emotion coverage;
  - rejects unknown/duplicate entry references;
  - recomputes coverage metrics rather than trusting hand-entered counts;
  - preserves link-only/candidate-only rights and editorial boundaries.

## Source tranche

### C. H. Spurgeon — *Around the Wicket Gate*

Project Gutenberg eBook #60669:

- https://www.gutenberg.org/ebooks/60669
- 11 chapter/section pointers recorded.
- Project Gutenberg catalog currently marks the eBook public domain in the USA.
- The catalog also directs non-US users to check applicable local law.

BibleQuest disposition for this tranche: `external_link`, candidate only, global hosting review still required.

### Frances Ridley Havergal — *Kept for the Master's Use*

Project Gutenberg eBook #31647:

- https://www.gutenberg.org/ebooks/31647
- 13 chapter/section pointers recorded.
- Project Gutenberg catalog currently marks the eBook public domain in the USA.
- The catalog also directs non-US users to check applicable local law.

BibleQuest disposition for this tranche: `external_link`, candidate only, global hosting review still required.

### J. R. Miller — *Making the Most of Life*

Project Gutenberg eBook #19193:

- https://www.gutenberg.org/ebooks/19193
- 25 chapter pointers recorded.
- Project Gutenberg catalog currently marks the eBook public domain in the USA.
- The Project Gutenberg license/terms explicitly caution non-US users to check the law where they are located.

BibleQuest disposition for this tranche: `external_link`, candidate only, global hosting review still required.

### Andrew Murray — *Waiting on God*

Christian Classics Ethereal Library public electronic version:

- https://www.ccel.org/ccel/murray/waiting/waiting
- rights/source title page: https://www.ccel.org/ccel/murray/waiting/waiting.i.html
- 31 daily-message pointers recorded.
- CCEL identifies the hosted transcription as a public-domain text and describes the electronic version as based on images of the original publication.

BibleQuest disposition for this tranche: `external_link`, candidate only, exact-edition/global hosting review still required.

## Current coverage truth

The seed has **zero uncovered launch emotions**, but this is not the same as meeting the release target.

Current machine-readable summary:

- canonical emotions: 30;
- zero-candidate emotions: 0;
- emotions with >=10 candidates: 0;
- emotions with >=3 distinct works: 16;
- emotions with >=2 distinct authors: 30;
- emotions with >=5 reviewed BSB references: 0.

The candidate mappings are deliberately marked research-only because they were seeded from source titles/section identities. Entry-body validation is required before a mapping can count as reviewed topical relevance. BSB verse mapping is also intentionally left open rather than padded with unreviewed references.

## PR #1264 reconciliation boundary

PR #1264 remains the required baseline for the existing six multilingual devotional candidates, eight-book expansion, Ilocano support, and devotional translation policy work. It is not superseded by this tranche.

This source-expansion branch avoids the shared runtime/readiness files changed by #1264 so its source catalog and coverage evidence can be integrated independently, then #1264 can be reconciled/rebased without losing its translation/content work as required by issue #1285.

## Remaining A2 work

1. Expand the source catalog toward the issue #1282 source list and roughly 150–300 first-release candidate entries.
2. Validate entry bodies and replace title-level emotion mappings with reviewed relevance/confidence evidence.
3. Reach >=10 validated candidates, >=3 works and >=2 authors per launch emotion where feasible.
4. Add >=5 reviewed BSB Scripture references per launch emotion without copying Bible text into this manifest.
5. Record exact edition/translator/source-rights evidence and host-vs-link decisions for each added work.
6. Reconcile PR #1264 so its six multilingual devotionals, eight books, translation policy and Ilocano work are preserved.
7. Keep editorial approval, rights clearance, publication state and translation review independently fail closed throughout.
