# V7 Lane D exact-SHA motion evidence certification

Lane D's release convergence now consumes independent functional, visual and performance evidence rather than treating a `PASS` label alone as proof.

## Inputs

The built Chromium runner at `tests/v7/motion-built-artifact-browser.mjs` records one distinct observation at each combination of width **320, 390, 430, 800 px** and OS motion preference **normal/reduced**, along with keyboard action/navigation checks, no-overflow layout, nav hit-target size, cumulative layout shift and long-task samples. The samples cover **English, Tagalog and Cebuano** (the locales exposed by the current global shell). The Ilocano UI selector remains a separate integration gap; the report explicitly does not claim it was tested.

At 390 px with a Tagalog shell, the browser captures rest, interacting and settled states under both normal and reduced-motion preferences: **six PNGs**. Reduced motion must leave all content and actions usable without waiting for decorative effects.

## Fail-closed certification

`node scripts/v7-certify-motion-evidence.mjs` validates that:

1. Both evidence and build are bound to the same full 40-character candidate SHA.
2. All eight width/preference observations are present, with a corresponding functional check and valid numeric layout/performance measurements.
3. No horizontal overflow or nav targets under 40 px occurred; measured non-input cumulative layout shift is no more than 0.25 at a sampled viewport.
4. All six expected screenshot paths are present in the V7 evidence directory, contain nontrivial PNG binary data, and receive independent SHA-256/byte-size records.
5. Missing locales, motion states, screenshots, measurements, or malformed paths reject release.

The resulting `artifacts/v7/motion-certification.json` is consumed by the V7 release-convergence sealer, added to the release evidence checksum list and uploaded beside the six screenshots. The release gate is intended to certify deterministic browser conditions, **not physical device frame rate**.

## Dependencies and ownership

This certifies Lane D **shared shell/Home transitions**, not Lane B's independent Feelings/Needs deck interaction or Lane C's lesson-step animation. Those lane-specific tests must still be wired into the final converged release evidence separately. Existing PWA, offline, content rights, approval, authorization, scripture integrity and inherited regression gates remain required.

## Automated checks

```bash
node --test tests/v7/release-motion-certification.test.mjs
BQ_EXACT_SHA=<exact-commit> BQ_PREVIEW_URL=http://127.0.0.1:4173 node tests/v7/motion-built-artifact-browser.mjs
BQ_EXACT_SHA=<exact-commit> node scripts/v7-certify-motion-evidence.mjs
```

Browser steps require a serving built `dist-v6` preview and the pinned Playwright runner from CI; no external image artifacts or unaudited binaries are required.
