# BibleQuest V7 — functionality-first release reset (owner direction, 2026-10-17)

Status: binding owner-directed V7 release contract; text-first implementation integrated by PR #1540.

## Binding release plan — 2026-10-17 owner instruction

This is the mandatory first read for EVERY V7 chat, lane, scheduled task and agent. It supersedes older image-first quotas and instructions to generate/repair artwork. The compromise is artwork coverage only: existing V7 features, redesign and P0 motion requirements remain required.

- STOP image generation, rerendering and derivative production for V7. Use only existing independently passed, rights-cleared immutable image bytes that also pass production registration/served-byte checks. Staged QA PASS is not production approval; until eligible use the color/text fallback. Never promote pending, rejected, quarantined or rights-unknown images to fill a slot.
- Preserve approved assets and the 300 devotional inventory. Missing art uses deliberate colored cards/buttons with live localized text, metadata and working actions; no broken-image icons, empty media frames or disabled feature because a picture is missing. Future images are deferred to V8+ and require future authorization.
- Retain the redesign in `V7_UI_UX_RELEASE_REQUIREMENTS_20261008.md` and P0 motion in `V7_MOTION_AND_ANIMATION_REQUIREMENTS_20261008.md`, except requirements that specifically demand image coverage/large photographic layouts incompatible with this text-first decision. Preserve typography, spacing, coherent Home/Library/reader, labeled navigation, responsive states and accessible interaction.
- Do not silently defer existing V7 feature commitments. If a scope conflict is found, record it explicitly in active status; only artwork is newly deferred by this decision.

### Execution order and completion evidence

1. **Reconcile the actual release candidate.** Start with live `v7/development`, `V7_ACTIVE_STATUS.md`, this file and main-target PR #1541. PR #1540 is MERGED (888ef27b766b3a1d0bf0ee117822c9e495ac2e56); do not rebuild its fallback implementation.
2. **Close observed blockers.** Assessment baseline 7da68699eab5f5484ddd8b2773748c2117b3960e: V7 Release Convergence passed (run 39001206350), but protected-page acceptance failed (39001206408) and inherited browser regression failed (39001206422). Diagnose failure logs and fix root causes; do not disable checks or call unrelated green jobs proof. Refresh live results before working; these are baseline observations, not permanent open-task claims.
3. **Prove features and content.** Library browse/search/filter/details/read, eight permitted-use book entries, rights-clear teachings, automated revision-bound Content Review, and ONE 2 ONE pairing/lesson/progress/consent/revocation/privacy/tenant denial must work through real entry routes. Preserve 300 records and prove at least 150 legitimately publishable devotionals with EN/TL/CEB/ILO revision-bound translation, rights and Scripture evidence; report catalog and publishable counts separately.
4. **Prove the finished redesign.** Built-app Home/Library/reader and primary navigation; loading/empty/error/retry/offline states; 320/390/430/800 widths, EN/TL/CEB/ILO, light/dark, 200% text, keyboard/touch, normal/reduced motion. Test missing art and failed image requests plus retained approved assets. Keep existing performance/PWA/update/offline and V6 regression contracts.
5. **Certify and release one candidate.** One integration owner serializes merges. Freeze an exact candidate; all required checks and strict releaseReady evidence must match it, including authenticated backend privacy checks and published-image hashes. Preserve rollback identity, promote through the existing production path, then verify deployed identity and essential production smoke. Pre-merge certification and post-deploy verification are separate steps. Any source change creates a new candidate.
6. **Close with durable evidence.** Update V7_ACTIVE_STATUS.md with candidate/deployed SHA, check links, catalog/publishable counts, observed remaining defects and deferred artwork. A PR, staged image QA or passing units alone does not mean released.

### Cross-chat operating rule

Every new instance reads the live repository plan before work, selects the next unfinished item, checks existing PR ownership, makes a bounded fix and leaves exact SHA/check/next-action evidence. Do not restart image queues, duplicate completed implementation, weaken security/rights/Scripture checks, or silently start V8. Existing scheduled art instructions are superseded by this freeze; they must not generate or repair pixels. Already-passed-image validation is allowed; optional pending-art QA must not delay the release.

This repository contract is the shared handoff. A chat that does not read the repository cannot be technically forced to obey it; never claim universal enforcement from documentation alone.

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
