# V7 A2 devotional source expansion — tranche 02 — 2026-10-07

Scope: issue #1282 source-pool depth, rights evidence and stable candidate identity.

Status: **research source-pool depth target reached; release/content-review targets remain open**.

## Added source works

### John R. Macduff — *The Faithful Promiser*

- Project Gutenberg eBook #27344: https://www.gutenberg.org/ebooks/27344
- 31 day-of-month entry pointers.
- Project Gutenberg marks the eBook public domain in the USA and instructs non-US users to check local law.
- BibleQuest state remains `external_link` / `candidate` / `candidate_only`.

### John R. Macduff — *The Words of Jesus*

- Project Gutenberg eBook #28547: https://www.gutenberg.org/ebooks/28547
- 31 day-of-month entry pointers.
- The source exposes a complete 31-day sequence; no devotional body is copied into this tranche.
- Project Gutenberg marks the eBook public domain in the USA and instructs non-US users to check local law.
- BibleQuest state remains `external_link` / `candidate` / `candidate_only`.

### Andrew Murray — *Working for God*

- CCEL: https://www.ccel.org/ccel/murray/working/working
- source/full text evidence: https://ccel.org/ccel/murray/working.all.html
- 31 chapter pointers using the source table-of-contents labels.
- CCEL identifies the hosted transcription as public-domain text; source title material identifies Fleming H. Revell Company, 1901.
- BibleQuest state remains `external_link` / `candidate` / `candidate_only` pending independent exact-edition/global-use review.

## Aggregate source-pool state

`data/v7/content-sources/devotional-source-index.json` now indexes two source-catalog tranches:

- source works: 7;
- distinct authors: 5;
- stable entry pointers: 173;
- issue #1282 first-release target range: 150–300 candidate readings;
- source-pool depth target: reached at pointer/research level.

This is **not** a claim that 173 devotionals are publication-ready. The pointers identify source entries to research and curate. They intentionally contain no copied devotional bodies.

## Gates still open

- title/day/chapter candidates still require body-level relevance validation;
- every launch emotion still requires >=10 validated candidates before the A2 emotion target is complete;
- every launch emotion still requires >=5 reviewed BSB references;
- source/edition/global-hosting decisions still require rights review;
- editorial/theological review remains separate and incomplete;
- localized publication still requires translation review;
- PR #1264 remains the required reconciliation source for the existing six multilingual devotionals, eight-book expansion, Ilocano support and translation-policy work.

The aggregate index and tests are deliberately fail-closed so meeting the numeric source-depth target cannot be interpreted as release authorization.
