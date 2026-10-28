# V7 A2 — curation vocabulary hardening

Date: 2026-10-06 JST
Starting integration SHA: `33fadd404d85867ae13e37f073f1d2ebab418dea`
Branch: `v7/a2-curation-vocabularies-20261006`
Owner: V7 A2 — Curation & Enrichment

## Outcome

Harden the bounded representative Library curation sidecar so editorial discovery and discipleship-planning metadata cannot silently drift into uncontrolled labels while preserving the frozen V7 runtime/data contract.

## Changes

- add an explicit frozen A2 vocabulary file for representative-scope topics, collections, life pathways, audiences, ONE 2 ONE lesson-step fits, reading-time kinds and reading-plan cadences;
- enforce those vocabularies in the existing representative curation contract test;
- reject duplicate per-item controlled labels;
- bound hosted excerpt/adaptation reading-time estimates to positive integer minutes while leaving external long-form duration unknown;
- preserve existing theological-fit, difficulty, fit-level, editorial-priority and Scripture-relationship checks.

## Boundary

- No content item is approved or published.
- No rights state is upgraded.
- No reviewer identity or approval timestamp is created.
- No runtime schema, parser, migration or UI behavior changes.
- No expanded catalog, bulk corpus, full Ilocano rollout, Conversation Deck or realtime/group feature work.
- Vocabulary labels are editorial metadata for the existing five representative items only.

## Verification

The V7 unit/contract gate must prove:

1. the vocabulary file exactly matches the bounded A2 whitelist;
2. every controlled per-item value belongs to that whitelist;
3. no per-item controlled array contains duplicates;
4. estimated hosted reading times are integer minutes in the bounded editorial range;
5. external long-form reading time remains unknown rather than fabricated.

Full PR CI remains the integration evidence owner for build/browser/PWA/accessibility regression.
