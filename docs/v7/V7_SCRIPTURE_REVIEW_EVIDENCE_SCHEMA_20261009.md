# Scripture review evidence schema — V7

This is an additive specification. It does not certify existing assets.

Every Scripture-bearing content item and every TYPE image needs a distinct review entry:
```json
{
  "schemaVersion": 1,
  "contentPath": "data/v7/visual-assets/records/example.json",
  "assetId": "example",
  "locale": "en",
  "translation": "BSB",
  "reference": "Psalm 68:6",
  "displayKind": "reference_only",
  "displayedWords": null,
  "imageSha256": null,
  "canonicalSourceBlobSha": null,
  "textSource": null,
  "licenseEvidence": null,
  "exactTextVerified": false,
  "referenceVerified": false,
  "contextVerified": false,
  "applicationVerified": false,
  "renderedTextVerifiedAt320px": false,
  "reviewer": null,
  "reviewedAt": null,
  "status": "pending",
  "contextNotes": null
}
```

Allowed `displayKind`: `reference_only`, `scripture_quote`, `paraphrase`, `non_scripture_text`. A reference-only TYPE requires reference, context, application, and rendered wording checks; exact Scripture text verification is not applicable, rather than passed. A quote requires verified translation text and licensing, plus all contextual and visual checks. A paraphrase must be labeled as paraphrase and never presented as a verbatim translation.

A CI implementation must reject status `approved` unless all applicable booleans are true and evidence is present. It must verify the asset SHA and canonical source SHA match the reviewed revisions, then fail closed on stale or missing entries. Semantic interpretation and actual image-pixel lettering must have independent evidence; metadata booleans alone cannot prove them.

Migration: inventory current records and app content, create pending review entries, inspect actual images, correct mismatches, then enable CI release blocking. Do not silently reclassify existing `production_ready` artwork as Scripture approved.
