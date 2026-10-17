# V7 Lane D — exact-commit built-image screenshot digest evidence

State: Development-only candidate. This is a technical integrity addition; it is **not** automatic artwork approval or permission to deploy.

## Purpose

The V7 release gate already binds the audited published CLEAN/TYPE/THUMB source registry, actual HTTP-served image hashes, Chromium decoding, intrinsic geometry and 320/390/430 px mobile rendering to the candidate SHA. The new screenshot attestation closes a smaller evidence-provenance gap: merely listing screenshot filenames does not prove that the archived pixels are the ones produced by the browser test.

## Fail-closed evidence contract

1. Read `artifacts/v7/visual-browser/report.json` only in strict-release mode. Require the report's candidate SHA to match the exact CI candidate and its published complete bundle IDs to equal the audited manifest.
2. For each **published complete** visual bundle, require a distinct TYPE and THUMB PNG screenshot at each viewport width **320, 390 and 430 px** (six images per bundle). The paths must match the browser harness naming exactly, with no omissions, duplicates, extra release images or unsafe asset IDs.
3. Read the actual screenshot files and verify minimum bytes plus PNG header; calculate individual SHA-256 and a deterministic combined screenshot-manifest digest. Attach the measurements under `screenshotEvidence` in `artifacts/v7/release-visual-evidence.json`, which itself is included in the exact-candidate evidence manifest.
4. Draft candidate screenshots and locally intercepted/unpublished candidate binaries **must not** satisfy the published release evidence quota. A technically valid screenshot still does not establish independent aesthetic/Scripture/context/typography approval.
5. Missing, duplicate, corrupted or unsafe evidence fails strict certification; no skipping the browser task and no human/device manual bypass. Development PRs may remain open with incomplete published coverage without declaring release readiness.

## Related provenance and ownership

Implementation: `scripts/v7-release-visual-evidence.mjs`.
Regression contract: `tests/v7/release-visual-evidence.test.mjs`.
Source of browser PNG screenshots: `tests/v7/visual-assets-built-browser.mjs`.
Owner: Lane D release certification (#1303); Lane A owns image creation and independent visual quality review.

This change requires V6 PR serialization, V7 Build/PWA and V7 Release Convergence passing on the **exact PR head** before merging into `v7/development`. V7 image-first production launch continues to require the 30 Feeling, 5 Need and 1 Home hero complete bundles plus Lane B/C/D checks, and deployed identity verification.
