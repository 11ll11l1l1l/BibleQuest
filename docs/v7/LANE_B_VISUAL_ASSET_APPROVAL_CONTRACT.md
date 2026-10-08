# V7 Lane B — visual-asset evidence and automated review contract

This contract supplements [V7 automated Library approval](../../src/v7/content/automated-approval-policy.js). It applies when a **book**, **devotional**, or **past teaching** carries a visual asset. No human pre-release approval is required. Missing or unverified image rights never qualify for hosted publication.

## Where evidence lives

The approval candidate may provide an explicit `visualAssets` (or `visual_assets`) array, including within `body`. Content Review can display per-asset metadata from the exact Library revision's `review_evidence.visualAssets` (or `review_evidence.visual_assets`) or body; it shows **not recorded** rather than guessing when fields are missing. The approval candidate and stored revision evidence must be produced together by the content publishing pipeline.

Example reviewed asset:

```json
{
  "id": "devotional-001-cover",
  "source": { "uri": "https://source.example/asset-original" },
  "provenance": { "evidenceRefs": ["repo:assets/manifest.json#devotional-001-cover"] },
  "rights": {
    "status": "verified",
    "allowedUses": ["display"],
    "evidenceRefs": ["repo:assets/rights-ledger.json#devotional-001-cover"]
  },
  "altText": "Soft daylight over a quiet hillside",
  "fallback": "theme-gradient"
}
```

`evidenceRefs` are audit pointers, **not** rights proof by themselves. The automated rights/provenance evaluators and independent second pass must verify the referenced evidence before they mark the applicable required criteria as passed.

## Fail-closed outcomes

| Failure | Policy outcome | Required machine action |
| --- | --- | --- |
| Malformed asset list or record | `rejected` | Correct the manifest or exclude the asset |
| Missing source identity or provenance evidence reference | `rejected` | Resolve original source / generated-asset chain before including |
| Rights not verified, display not permitted, or missing rights evidence reference | `rejected` | Replace with rights-clear image; do not publish unverified hosted bytes |
| Missing human-readable alternative text | `needs_repair` | Generate/check descriptive alt text and reevaluate |
| Missing accessible fallback | `needs_repair` | Provide fallback metadata and reevaluate |
| All asset checks pass alongside the complete content-policy and independent QA gates | `auto_approved` | Publish exact reviewed revision |

No `visualAssets` property means no image is declared by this contract, preserving text-only V7 Library publication. The publishing pipeline must declare any attached images explicitly; silently attaching an image outside this manifest bypasses audit and is not supported.

## Reviewer UI

Content Review -> Books / Devotionals / Past Teachings -> item -> **Visual assets and accessibility**. Source, rights, alt and fallback are displayed from stored evidence when present. **Automated criteria and evidence** and **Independent second pass** remain separately visible. Only authenticated authorized reviewers can override exact-revision publication decisions.

For the 300-devotional catalog, Content Review renders up to 12 cards per page. Search and decision filters reset the page position to avoid hiding matches, and the mobile search input retains keyboard focus.

## CLEAN / TYPE / THUMB exact-revision validation (2026-10-08)

The Lane A image-registry binary audit and Lane B approval are independent gates.
Lane A checks committed bytes against per-file SHA-256, dimensions and metadata.
Lane B checks legal permission, human-readable evidence, exact content/revision
binding, typography QA and publication readiness. An evidence pointer or a flag
alone does **not** prove that the picture actually contains the required letters:
the publishing pipeline must supply a real independent visual-text check and the
release build must have a passing binary audit for the exact referenced hashes.

- **CLEAN** is the master. Its normal rights/provenance/alt/fallback gate remains
  unchanged for existing asset-free and clean-only content. If a `variants` array
  is declared, the master additionally needs `imagePath`, 64-character `sha256`,
  measured `width`, `height` and positive `fileBytes`.
- **TYPE** uses `kind: "with_text"`, `locale: "en"|"tl"|"ceb"|"ilo"`,
  `textKind: "title"|"scripture"`, `text` and `sourceRevision`. The title must
  exactly match the approved title for the same locale. For Scripture, the item's
  `reviewEvidence.approvedScriptureExcerpts[locale]` must include the exact approved
  text, reference, translation, matching revision, permission and evidence refs.
  A title/art image may not invent, translate or paraphrase an excerpt on its own.
- **THUMB** uses `kind: "thumbnail"`, has no embedded-text metadata and has
  dimensions not exceeding the master. Both derivatives use deterministic file
  paths based on the CLEAN asset ID.
- Each derivative carries its **own** `imagePath`, measured size/dimensions,
  `sha256`, `derivedFromSha256`, provenance evidence, verified display rights
  and rights evidence references, alt text or explicit decorative status, fallback,
  and `integrity` (verified SHA, dimensions, same SHA, binary-audit evidence refs).
  This is additional to Lane A's minimum generation-side metadata, not a reason
  for an image worker to invent approvals.
- Each TYPE additionally requires `liveTextFallback: true`,
  `typographyQa: { result: "pass", observedText, locale, sourceRevision,
  imageSha256, checkedAt, evaluator, evidenceRefs,
  fontLicense: { status: "verified", evidenceRefs } }`.
  `observedText` is the independently transcribed real lettering, including
  attribution/wording, not a duplicate model prompt disguised as an inspection.
  The UI continues to render the semantic translated title and Scripture.
- A missing integrity proof, visual-text QA record, alt, fallback or live-text
  fallback produces `needs_repair` with deterministic per-variant codes.
  Wrong language/text, stale revision, false observed text, failed visual QC,
  duplicate/path anomalies or unverified hosted/derived/font rights are blocked
  by `rejected`. Never relabel missing evidence as a pass or route it to a human
  pre-release blocker.
- If TYPE does not pass, CLEAN with live locale-specific HTML may still be used
  after the failed declared TYPE derivative is removed from the production
  candidate and audited separately. Do not silently ignore an attached bad TYPE.
  TEXT-free legacy content stays publishable when all existing content gates pass.

### Example TYPE review evidence (synthetic; not a production approval)

```json
{
  "kind": "with_text",
  "locale": "en",
  "textKind": "title",
  "text": "Courage for Today",
  "sourceRevision": "r1",
  "liveTextFallback": true,
  "imagePath": "/v7/images/devotional/cover-01-with-text-en.webp",
  "width": 1024,
  "height": 1280,
  "fileBytes": 1024,
  "sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "derivedFromSha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "provenance": {"evidenceRefs": ["audited:derivative-job-123"]},
  "rights": {"status": "verified", "allowedUses": ["display"], "evidenceRefs": ["license:art-and-derivative-123"]},
  "altText": "Sunlight with the title Courage for Today",
  "fallback": "theme-gradient",
  "integrity": {
    "sha256Verified": true, "dimensionsVerified": true,
    "verifiedSha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "evidenceRefs": ["exact-binary-audit:123"]
  },
  "typographyQa": {
    "result": "pass",
    "observedText": "Courage for Today",
    "locale": "en",
    "sourceRevision": "r1",
    "imageSha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "checkedAt": "2026-10-08T09:00:00Z",
    "evaluator": "independent-visual-checker",
    "evidenceRefs": ["vision-transcription:123"],
    "fontLicense": {"status": "verified", "evidenceRefs": ["font-license:123"]}
  }
}
```

The example's all-a/all-b hashes are placeholders, and MUST NOT be used as actual
production evidence.

### Machine-readable Lane B → Lane D handoff

`createV7LibraryAssetDecisionReport(decisions)` is exported by
`src/v7/content/automated-approval-policy.js`. It emits deterministic JSON
with `schemaVersion:1`, `reportType:
"biblequest.v7.library.visual-asset-decisions"`, exact `itemId` +
`revision`, `policyId` / `policyVersion`, `counts` and per-item
`visualAssetEvidence`, `rejectionReasons` and `repairReasons`. It
rejects duplicate revisions, mismatched policy versions or unrecognized outcomes.
Lane D must materialize and checksum that JSON at the exact release head
alongside the actual binary-audit report; this function does not deploy or
claim binary/visual-text verification by itself.

The policy includes a canonical serialized asset-evidence snapshot in each
newly evaluated decision. `canAutoPublishV7LibraryDecision` refuses to reuse
that approval when asset bytes, rights, text, variants or QA evidence change,
even if the Library content revision label is unchanged.

Content Review previews only safe same-origin `/v7/images/` paths; it never
renders arbitrary provided URLs as images. Missing previews remain readable
evidence rows, and review still requires authenticated authority.
