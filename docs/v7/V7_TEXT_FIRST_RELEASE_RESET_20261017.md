# BibleQuest V7 — functionality-first release reset (owner direction, 2026-10-17)

Status: implementation proposal on `v7/text-first-release-20261017`; binding after integration into `v7/development`.

## Decision

Devotional covers and themed artwork are **optional polish**, not launch dependencies. Missing or not independently approved artwork renders as attractive, fully functional, color-coded **live localized title + metadata + action** cards and Feeling/Need selection buttons. Keep the canonical 300 devotional records, their source/rights/revision metadata, and any accepted image binaries; do not regenerate covers in order to ship V7. Image work is deferred, not automatically rejected or deleted.

This reverses only the 2026-10-08 image-first *release quota* for 30 Feelings, five launch Needs, the Home hero and 300 distinct cover masters. Images already published with valid, independently auditable bytes may remain visible; draft, failed and rights-unknown images remain excluded. Single-master/live-text and focal-crop contracts continue to apply if art is used.

## Non-negotiable V7 release

1. Library works end to end: browse/search/filter/details/read/book external links/teaching content, empty/error/offline/retry and return navigation.
2. Minimum 150 legitimately publishable devotionals with complete EN/TL/CEB/ILO source-revision-bound records, Scripture integrity, acceptable taxonomy and rights. The existing 300-content inventory is preserved, but quantity alone is **not** publication approval.
3. Eight launch book catalog entries with permitted-use links, and rights-clear Past Teachings with truthful attribution.
4. Automated Content Review may approve only genuinely revision-bound, verified content. Unknown rights, Scripture mismatch, or failed translation must remain blocked. In-app audit/override remains available to authorized roles.
5. ONE 2 ONE authenticates and correctly enforces pairing, mentor/mentee privacy, share revocation, tenant isolation and completion/progress.
6. Coherent labeled navigation, readable mobile-first UI, motion-reduction, accessible states, safe text scaling, PWA/offline, performance and V6 regressions.
7. Exact-SHA CI/build evidence, automated browser and backend journeys, deployment identity and post-deploy smoke. Never infer pass from a green unrelated workflow.

## Revised visual release gate (Lane D implementation required)

- Treat audited visual asset **coverage counts as informational only**, not P0 quotas.
- Fail closed for any artwork that **is** published: safe same-origin paths, real bytes/hash/format, allowed license/rights, correct ID/alt/localization and exclusion of staged candidates.
- Certify the **fallback interface** at 320/390/430/800 px, EN/TL/CEB/ILO, dark/light, 200% text, reduced motion, keyboard/touch, online/offline, missing/failed picture loads.
- Home can use an editorial color/typography hero with a functional Continue/Read CTA rather than requiring a generated image.
- Update `scripts/v7-release-visual-evidence.mjs`, `tests/v7/visual-assets-built-browser.mjs`, the strict `.github/workflows/v7-release-convergence.yml` branch, browser fixtures and associated acceptance tests **together**. Do not merely turn off CI.
- Keep a valid released bundle hash inventory and published-byte testing for any remaining approved assets; do not count candidates or fabricate artistic approval.

The implementation branch also updates `scripts/v7-release-visual-evidence.mjs` to remove only numeric image quotas, and updates the strict browser validation to examine every *published* CLEAN image (including partial bundles), with matching regression tests and a fallback browser pass. The full CI run, merge to development, strict release certification, deployed identity and content/privacy acceptance still require verified PASS before calling V7 released.

## Minimum finish sequence

1. Integrate accessible text-first fallback cards. The Library/Feeling/Need fallback implementation is in PR #1540; verify all Home and devotional-detail paths also avoid tall blank media frames.
2. Complete the release-gate migration above, including deterministic browser checks and strict published-image safety for any retained artwork.
3. Generate an exact-head content/approval report; fix only failing source/rights/Scripture/locale entries, backfilling eligible content to the 150 threshold. No unlicensed hosted book content.
4. Run the full authenticated ONE 2 ONE and tenant-denial journeys and close only observed P0 failures.
5. Execute 320/390/430/800 UI, accessibility, translation, reduced-motion, offline/PWA and performance certification.
6. Freeze one development SHA, run strict gate, preview and verify. Merge to main only after exact SHA and deployed smoke pass.
7. Archive/supersede the 300-image manual queue and TYPE/THUMB repair issues as **deferred to V8** only after the release-gate change lands; no deletion of approved masters or of rejected-hash evidence.

## Keep out of V7

300 cover generation, TYPE/THUMB derivative regeneration, new hero photography, Leader Conversation Deck, central Google Drive media pipeline, ALAM integration, broader book ingestion, full Bible/UI language rollout and advanced personalization. These remain V8+ candidates and do not hold up this V7 release.

## Evidence, not percentages by assumption

Report four counts separately: cataloged devotional records, rights-verified reviewed/publishable localized entries, live UI journeys passing, and strict release checks passing. Never use image production percentage as a proxy for product completion.
