# V7 Lane D — verified image-first runtime

**Owner:** Lane D. Image concept generation and master/derivative evidence remain Lane A/visual-agent owned. Content/visual rights approval remains Lane B.

## Release and build pipeline

1. Each visual agent writes its own master metadata and optional three-output derivative bundle under `data/v7/visual-assets/records/`, with image files under `public/v7/images/`.
2. `scripts/v7-publish-visual-assets.mjs` selects **only** schema-version 1 records with `status: "production_ready"`. Schema-version 2 derivative-agent bundles are quarantined even if an agent wrote the words "production_ready"; staging status is not approval.
3. The publisher runs Lane A's current strict `scripts/v7-visual-assets-audit.mjs` against the full source tree. The audit validates eligible masters and V2 three-output variants (including hashes, dimensions, rights, typography and QC), identifies staging candidates without promotion, and fails the build on unexplained errors.
4. Only after PASS does the build copy precisely the manifest-listed verified images to `dist-v6/v7/images/` and write `dist-v6/data/v7/visual-assets.json`. This runs **before** the V6 final artifact-integrity SHA seal.
5. Unreviewed/invalid derivative files are never copied to `dist-v6`. No fallback to raw GitHub image URLs, unverified stage variants, or unofficial covers is allowed.

The deterministic registry has `schemaVersion`, `assets[]` and `byContent`. Each image retains `assetId`, content type and content ID, SHA-256, dimensions, focal point, alt, rights and optionally verified variants. These are generated and must not be manually edited.

## UI behavior

- **Feelings/Needs:** horizontal swipe/snap cards with neighboring cards visible and keyboard-accessible selection; source UI IDs are mapped to older persisted content concepts, and only audited artwork enters the cards.
- **Library list:** when a direct devotional/book image is absent, a linked approved emotion illustration can be used; otherwise a readable gradient card with live localized title and metadata appears.
- A text-embedded variant is eligible only when **both** the locale and the exact verified embedded wording equal the card's requested wording. Otherwise the text-free clean asset is used, and the translated heading remains selectable live text.
- Missing artwork and source-mode development (where Vite publicDir is intentionally disabled) never block Library navigation or reading.
- Image descriptions follow the validated asset alt text; keyboard focus, minimum tap targets, reduced motion and text contrast remain independent of the image.

## Verification

- `node --test tests/v7/visual-publication.test.mjs tests/v7/visual-runtime.test.mjs` checks real deployment subset, byte hashes, staged exclusion and UI resolution/locale handling.
- `npm run build:v6` runs the publisher as part of the Vite `closeBundle` stage; inspect `dist-v6/data/v7/visual-assets.json` and the final artifact integrity report.
- `npm run unit:v7`, built-browser mobile/desktop smoke, and exact-SHA V7 convergence must pass before integrating into the preview/release branch.

**Limitation:** this integration does not certify every devotional has a unique illustration. More approved assets automatically appear after a future build when the image agents complete the audited record. Staged assets are not silently published.
