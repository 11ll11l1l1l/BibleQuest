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
