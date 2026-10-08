# V7 Visual Assets

This folder contains machine-readable sidecar records for generated/owned/licensed V7 visual assets.

Canonical production contract: `docs/v7/V7_VISUAL_ASSET_PRODUCTION_20261008.md`.

Images are stored under `public/v7/images/**` so Vite can copy them to the built site as static assets. Metadata records live at `data/v7/visual-assets/records/<asset-id>.json`.

There is deliberately no single shared mutable manifest. Five scheduled generators run in parallel, so one-file-per-asset records prevent merge collisions. Lane D can scan this directory to build/validate any runtime index it needs.

Rules:
- one unique asset ID per image;
- never overwrite another asset;
- no baked-in text;
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
