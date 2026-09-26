# V7 devotional source library — preprocessing workspace

This directory is intentionally **not wired into V6 runtime code**. It is a V7-only staging area for sourced devotional material.

## Goal

Build a YouVersion-style "What are you going through?" discovery layer using identified historical devotional works rather than generating devotional theology.

## What is included in this pass

- a verified source registry with provenance and rights notes;
- a controlled life-situation taxonomy;
- entry-level metadata for four works (93 source units);
- normalized Scripture references for Andrew Murray's 31-day *Waiting on God!*;
- curated life-situation plan seeds that point to source units;
- validation tooling for duplicate IDs, unknown tags, source linkage, and review state;
- two Spurgeon works registered for the next entry-level batch pass.

The original devotional bodies are **not vendored yet**. Source text stays external in this preprocessing branch until a deterministic import/checksum pass is done. This prevents accidental ingestion of modern edited editions and lets us preserve an auditable source chain.

## Content rules

1. Do not rewrite or paraphrase an author's devotional body and present it as the source.
2. BibleQuest-added titles, tags, plan groupings, search metadata, reflection UI, journaling, and progress state must stay distinguishable from source text.
3. Store Scripture references, not modern copyrighted Bible verse text. Resolve verse text via the BibleQuest Reader translation layer.
4. Before a source unit becomes user-facing, require provenance verification, rights verification, Scripture-reference review, and pastoral/theological review.
5. Preserve corrections as metadata. Never silently alter the historical text.
6. Life-situation tags are discovery metadata, not claims that the historical author wrote a modern clinical or counseling resource.

## Files

- `sources.json` — rights/provenance registry.
- `taxonomy.json` — controlled discovery vocabulary.
- `catalog.seed.json` — source-unit index and tags.
- `plans.seed.json` — proposed life-situation plan groupings.
- `validate.mjs` — standalone integrity checks.

Run:

```bash
node content/v7/devotionals/validate.mjs
```

## Next V7 ingestion pass

Vendor exact public-domain source bodies into immutable raw-source files, calculate SHA-256 checksums, parse each source unit, attach the catalog metadata, and then run pastoral/theological review before changing any entry to `publish-ready`.
