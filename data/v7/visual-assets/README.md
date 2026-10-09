# V7 Visual Assets

This folder contains machine-readable sidecar records for generated/owned/licensed V7 visual assets.

Canonical production contract: `docs/v7/V7_VISUAL_ASSET_PRODUCTION_20261008.md`.

Images are stored under `public/v7/images/**` so Vite can copy them to the built site as static assets. Metadata records live at `data/v7/visual-assets/records/<asset-id>.json`.

There is deliberately no single shared mutable manifest. Five scheduled generators run in parallel, so one-file-per-asset records prevent merge collisions. Lane D can scan this directory to build/validate any runtime index it needs.

Rules:
- one unique asset ID per image;
- never overwrite another asset;
- no baked-in text on CLEAN or THUMB; reviewed embedded typography is allowed only on locale-specific TYPE;
- SVG art must be self-contained: only internal `href="#id"` / `url(#id)` references are allowed. No remote or data-URI image/font loads, CSS `@import`/`@font-face`, XML DTD/stylesheet, scripting, or event-handler attributes. Use licensed render-to-path lettering rather than runtime font fetches; still verify exact TYPE wording and Chromium rendering.
- generated assets must say `sourceType: generated`;
- official third-party book covers are not to be fabricated;
- every image gets alt/decorative metadata, intended usage, focal point/text-safe region and QC results;
- use actual measured file metadata when available; otherwise `null`, never invented values.

## Deterministic validation and UI handoff

Run `node scripts/v7-visual-assets-audit.mjs` to check each committed binary against its sidecar. The audit checks asset identity, exclusive image path, actual SHA-256, byte size, encoded dimensions, rights/provenance, alt text, normalized focal point, agent queue ownership, required QA flags, and orphan image files. It fails closed with a nonzero exit code.

Run `node scripts/v7-visual-assets-audit.mjs --manifest --write /tmp/bqv7-visual-assets.json` to generate the sorted runtime registry **only after all checks pass**. The registry exposes `assets` plus `byContent` lookup entries such as `emotion:anxiety_worry` and `devotional:devotional.biblequest.anxiety_worry.01`. It also provides a documented deterministic family-based fallback key. Missing images must still render as readable live-text cards.

The `--write` output is derived; do not have the five visual agents edit it, and do not manually maintain a shared manifest. Lane D should invoke the audit and generate its runtime asset index during its existing build/release job, then wire the registry to cards and the emotion carousel. The runtime should only consume generated output after a passing audit, not raw unvalidated sidecars. Human-facing titles and Scripture remain localized live text, never baked into assets.

Run `node --test tests/v7/visual-assets-audit.test.mjs` for focused validation regression coverage. The visual audit checks **metadata integrity, not subjective aesthetic quality**: the existing image-generation QC still applies, and Lane B retains independent rights/content approval gates.

### Clean / typography / thumbnail variants

The canonical master remains free of baked text and includes `imagePath`. A production artist can additionally create a rights-checked title artwork (`kind: with_text`, exact `locale` + `text`) and focal-safe cropped tile (`kind: thumbnail`). Record both under the same asset's optional `variants` array; do not maintain separate competing records for the same underlying scene. See the three-output bundle section of `docs/v7/V7_VISUAL_ASSET_PRODUCTION_20261008.md`.

The visual registry audit verifies every committed derivative's dimensions, bytes, hash and path before exposing it in the deterministic `byContent` registry. The title-art variant is supplemental; in-app content titles, metadata and translations remain live accessible text.

## Variant schemas and release readiness

Both legacy schema V1 clean masters and verified V2 three-file assets are allowed. Some producers store candidate derivatives in `<asset-id>-derivatives.json` while awaiting image and browser QA. Candidate records are not independently publishable masters. Never call a package release-ready merely because three file paths exist: confirm file hash/byte length/dimensions, readable TYPE artwork, canonical label and Scripture reference, actual rights, and approved QA state. Keep incomplete bundles visible in the audit report but outside any TYPE/THUMB release index.


### Per-locale TYPE wording evidence (V2)

A reviewed image may include separate \`-with-text-en\`, \`-with-text-tl\`,
\`-with-text-ceb\`, and \`-with-text-ilo\` artwork, each as an independently
rendered, measured and audited file. A single \`wordingEvidence\` still works
for existing one-locale records. New multilingual records use
\`wordingEvidenceByLocale\`, keyed by the exact TYPE variant locale:

\`\`\`json
{
  "wordingEvidenceByLocale": {
    "en": {
      "sourcePath": "src/features/library/emotion-taxonomy.js",
      "sourceBlobSha": "<actual Git blob SHA>",
      "canonicalNeedId": "peace",
      "locale": "en",
      "exactLabel": "Peace",
      "reference": "John 14:27",
      "scriptureTextIncluded": false
    },
    "tl": {
      "sourcePath": "src/features/library/emotion-taxonomy.js",
      "sourceBlobSha": "<same actual Git blob SHA>",
      "canonicalNeedId": "peace",
      "locale": "tl",
      "exactLabel": "Kapayapaan",
      "reference": "John 14:27",
      "scriptureTextIncluded": false
    }
  }
}
\`\`\`

Every TYPE variant still needs its own binary SHA-256, dimensions, byte count,
exact embedded \`label\` and \`scriptureReference\`, typography inspection,
approved Scripture binding and immutable taxonomy revision. A locale map is
**authoritative**: a missing or stale entry fails audit, even when a legacy
\`wordingEvidence\` is also present. Do not use EN baked text for TL, CEB or
ILO. If a localized TYPE is not independently reviewed, omit it and display
CLEAN art with accurate live localized text. The presence of a proof does
not constitute independent artistic or browser approval.
