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
