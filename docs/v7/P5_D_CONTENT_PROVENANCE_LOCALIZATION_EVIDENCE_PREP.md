# P5-D — Content, provenance and localization evidence preparation

Starting integration SHA: `7417ad44ef588fc86a82808426ee971819a6fe42`.

This is preparation for the persistent Lane D Phase-5 assignment. It does not freeze or certify a release candidate. The serialized integration/release owner remains responsible for choosing the exact candidate SHA and deciding whether release gates can be promoted.

## Deterministic evidence command

Run against the exact candidate being evaluated:

```sh
node scripts/v7-content-release-evidence.mjs <40-character-candidate-sha>
```

The command parses the repository's representative Book, Devotional and Past Teaching bundles through the canonical V7 content contract, then emits deterministic JSON containing:

- explicit candidate SHA supplied by the caller;
- representative readiness by Library type;
- source identity and provenance metadata;
- rights status, permitted uses and recorded rights evidence fields;
- publication review and publication state;
- source locale and translation review metadata;
- registered V7 UI-key count;
- supported application locales and missing V7 UI keys per locale.

The generated evidence deliberately excludes source and translated content bodies. It cannot approve content, infer rights, create translations, publish records, freeze a release candidate or promote a deployment.

## Current expected state

At preparation time, the current representative-content report is intentionally **OPEN**:

- Books: representative records exist and rights metadata is verified for their permitted external-link use, but editorial approval/publication is pending.
- Devotionals: representative records exist and rights metadata is verified for their declared display use, but editorial approval/publication is pending.
- Past Teaching: representative record/source identity exists, but rights remain unresolved and editorial approval/publication is pending.

Current registered V7 application UI strings are complete for the existing supported locales `en`, `tl` and `ceb`; the report must still recompute this on the exact candidate. V7 requires Ilocano-compatible contracts, not a full Ilocano Bible or UI rollout.

Source-only representative content is not mislabeled as translated content. Translation evidence lists only actual translation records and their review metadata; the runtime's approved source-language fallback remains separate.

## Acceptance boundary

P5-D can be PASS only when the eventual exact candidate's evidence truthfully satisfies the governing content/provenance/localization requirements and any required human content/rights review is genuinely complete. A green generator/test does not override an OPEN content decision.
