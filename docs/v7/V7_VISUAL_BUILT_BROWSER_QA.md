# Lane A: exact-commit visual browser evidence

V7 uses individually audited CLEAN, TYPE and THUMB image files. A production-ready binary checksum alone does not prove the app's actual built output serves the right image, nor that Chromium decodes and displays the crop at 320, 390 and 430 px.

The workflow `.github/workflows/v7-visual-assets-browser.yml` checks out the **exact PR head SHA**, runs the canonical fail-closed visual asset/coverage audits, builds V7, starts an ephemeral built preview, and executes `tests/v7/visual-assets-built-browser.mjs`. It is triggered by changes to artwork, imagery audit scripts, its test or its own workflow; it also supports exact-SHA dispatch.

The browser QA verifies every audited production image has the same SHA-256 when actually served from the built preview, validates response media type, and for each independently complete CLEAN+TYPE+THUMB bundle:
- Decodes each real image with Chromium and matches actual intrinsic dimensions to the audited manifest.
- Renders it on phone viewports 320/390/430 CSS pixels without clipping, zero height or horizontal overflow.
- Captures screenshots for **TYPE and THUMB** at each viewport, attaching them plus `report.json` to the workflow artifact, keyed by the actual candidate SHA.

**Evidence classification:** These are *technical browser and binary proofs*, not human or visual-model artistic sign-off. They do not prove a rendered English TYPE image has semantically correct letters, sufficiently elegant typography, non-artifact anatomy, safe incidental details, appropriate composition, or legal rights. Only mark those separate fields true when a real visual inspection and provenance check occurred. An image agent must look at the screenshots and update its own original metadata with verifiable evidence; PRs whose record says built-app/browser QA is pending must remain drafts until that check is truthfully complete.

These checks must not be bypassed or represented as production deployment, final V7 release acceptance, or a substitute for the existing full exact-SHA V7 certification gates.

Run locally against a built preview with Playwright installed in the test harness:

```bash
node scripts/v7-visual-assets-audit.mjs
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
BQ_PREVIEW_URL=http://127.0.0.1:4173 node tests/v7/visual-assets-built-browser.mjs
```

The run writes `artifacts/v7/visual-browser/report.json` and image screenshots. Never commit the generated screenshot artifacts or fabricated image-approval flags. QA report content is derived from current audited manifest rather than maintained as a shared agent-editable registry.
