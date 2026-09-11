# BibleQuest v3 mobile width matrix

Updated: 2026-09-11 JST

## Purpose

This is a post-release verification milestone for the current v3 product line. It adds explicit browser acceptance at 320, 360, 390, 412, and 430 CSS px without changing the runtime product.

## Exact state

- Product baseline: `73d39ce6fe0f9db20db62e25fd497a8711f921b0`.
- Matrix test commit: `474e5bcd5c96182258353f6c47863dec2f801fc1`.
- The only delta from the product baseline to the matrix test commit is `tests/v3-mobile-width-matrix-smoke.mjs`.
- Production `main` / frozen r3 are not part of this post-release milestone and were not modified.

## Executed verification

GitHub Actions run `34591777463`, job `103238467413`, concluded **success**.

The verifier:

1. checked out exact detached test commit `474e5bcd5c96182258353f6c47863dec2f801fc1`;
2. confirmed the delta from product SHA `73d39ce6fe0f9db20db62e25fd497a8711f921b0` is test-only;
3. launched the exact product/test tree locally;
4. ran Playwright Chromium at 320, 360, 390, 412, and 430 CSS px;
5. checked Home/shell, Account, Reader, Games, and Transform at every width.

Total explicit combinations: **25** (5 widths × 5 core surfaces).

For every combination the test checked:

- document/body horizontal overflow;
- primary navigation viewport containment;
- established mobile navigation-height contract;
- Account control viewport containment and 44 px minimum touch-target dimensions;
- main-content viewport containment;
- horizontally clipped visible buttons, links, inputs, selects, and textareas;
- route-specific content rendered successfully.

All checks passed. No product/CSS defect was reproduced, so no runtime fix was made.

## Evidence boundaries

This milestone does **not** claim physical-device acceptance. It does not prove Android Chrome, Android Brave, browser UI interaction, OS-level PWA installation, or standalone installed-PWA presentation on a real device.

Legacy issue #6 predates the clean v3 shell and contains older implementation-specific acceptance language (including the old four-tab production navigation). The new v3 shell has its own established navigation contract. Therefore this matrix is useful evidence for the applicable v3 width/overflow/touch criteria, but it is not sufficient by itself to close issue #6 or claim every historical criterion is satisfied.

## Next gate

For mobile-width work, the remaining high-value evidence is real Android Chrome/Brave and installed-PWA acceptance at representative narrow and wide phone widths. Any product change must be driven by a reproduced v3 defect; do not redesign the v3 shell merely to satisfy obsolete legacy implementation details.
