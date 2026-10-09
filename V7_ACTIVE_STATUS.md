# BibleQuest V7 Active Status

Updated: **2026-10-10 JST**  
State: **V7 initial foundation on main; image-first release incomplete; Lane A and Lane D active, Lanes B and C core work closed**  
Development branch: `v7/development`  
Reset baseline: `725646bcb512c489f05966ffe83090977c7f3fc3`  
Operative release override: `docs/v7/V7_RELEASE_RESET_20261007.md`  
Operative UI/UX release override: `docs/v7/V7_UI_UX_RELEASE_REQUIREMENTS_20261008.md`
Operative motion release addition: `docs/v7/V7_MOTION_AND_ANIMATION_REQUIREMENTS_20261008.md`

## Integration update — 2026-10-10 JST (development-only)

- **Lane D #1303 remains open.** Merged #1440 (visual source integrity + reduced-motion cancellation) at `77e32e3f7e684963dfacf48770529bc15bb1acc1`; #1463 (actual Chromium PNG screenshot SHA256 attestation) at `3ca0072dbde5033e402b33bc9235c9bd4d13eace`; #1472 (development push is non-strict while `main` and manual certification remain strict) at `52e3dce70a68f70b334e0b7ddc60d55be9009809`. All three PRs passed their individual exact-head V6 serialization, V7 Build/PWA, and V7 Release Convergence checks; development push run 37998783774 passed.
- **2026-10-10 runtime/QA continuation:** #1467 was rebased onto current development and merged at `3da0df924680193c4bc6687cda14a0898c394e36`, with all required CI checks passing. Its shared audited-art resolver now retries failed/offline/invalid registry fetches on subsequent loads without weakening source/schema/path/hash checks or caching a failed null forever. #1473 adds **800px tablet** to the exact built-artifact accessibility browser acceptance alongside 320/390/430, including keyboard focus, 200% text scale, contrast, reduced motion and horizontal overflow. Exact-head V6, Build/PWA and Release Convergence checks passed; merged at `ea7d86ffcda9e75b050099baecb22eee6f3a7412`.
- **Measured visual P0 baseline at Lane D release gate candidate `38bd5bfec35830d3572ca7a4c156e85f7429c912`:** source audit passed; **9/30 complete Feeling bundles**, **1/19 complete Need bundles** (launch P0 minimum 5), and **0/1 complete Home hero**. Still needed for P0: 21 complete Feeling, 4 more complete Need, and 1 Home hero bundles. Draft/uncertified candidate files do **not** contribute to those totals; counts may evolve as Lane A separately merges audited artwork.
- **No production promotion.** The image-first V7 release remains `OPEN` until all required Lane A image source/rights/locale/artistic QA and P0 quotas, Lane B immutable approval, Lane C auth/tenant privacy, Lane D browser/accessibility/motion/offline/PWA, exact-SHA strict main gate, and deployed identity/smoke jointly pass. Development CI success is **not** release readiness. The post-merge development push check for the latest tablet integration may still be running; do not misstate its status.

## Integration update — 2026-10-09 JST

The 2026-10-08 baseline below is retained as historical evidence, **not** the current blocker list.

- **Development integration:** exact-head validated #1400 (Lane A browser/three-binary artwork QA, including independently triggered manual integrity regressions) merged at `0b9f44545820eed1e574b77d5985aa96902b7b1b`; exact-head validated #1401 (Lane B reject embedded data/blob/file/javascript image, derivative and fallback resources) merged at `6becd6d74a392f566e6ef5daf54307f527741945`. Both changes are present on `v7/development` and were read back by blob SHA after merge. **Their successful individual PR checks do not by themselves certify the resulting combined release SHA.**
- **Lane statuses:** A #1300 remains **open** for image production/binary/artistic coverage. B #1301 is **closed** for core Library/approval/deck delivery; follow-up image-URL fail-closed hardening #1401 is integrated. C #1302 is **closed** after merged typing focus #1387, sharing-controls #1392 and privacy/auth #1396/#1397. D #1303 remains **open**, owning consolidated release gates and deployment.
- **Artwork candidates:** Agent-created image bundles #1398 and #1399 remain **drafts** with built-app QA pending in their records. A verified file/URL check or CI screenshot is not independent visual, text, rights or publication approval. Keep pending assets excluded from production registry until actual full checks pass.
- **Stale PR cleanup:** older Lane A #1377, #1389 and #1391 are closed as superseded by merged #1400; older Lane C #1257 and #1390 closed as superseded. Old main-target #1354 is closed, not deployed as the final V7 image-first release.
- **Next strict convergence:** integrate only artwork that passes binary SHA/dimensions, rights, locale/type and built browser QA; consume B's immutable approval evidence; certify **one** exact combined candidate at 320/390/430 plus tablet, normal/reduced motion, EN/TL/CEB/ILO as supported, auth/tenant privacy, PWA/offline/performance, and deployed identity. No unverified promotion to `main`.

## Command contract

The user may issue:
- `Continue V7 lane A`
- `Continue V7 lane B`
- `Continue V7 lane C`
- `Continue V7 lane D`

Resolve the live issue below and continue immediately. Do not ask which phase or sub-lane to use.

The old **A1/A2/A3/A4** subdivision is retired. The old phase-specific A–D map is historical only for remaining V7 work.

## Historical factual baseline — verified 2026-10-08 (superseded by the update above)

- **V7 initial release merged into `main`** through PR #1335. This is the already-shipped foundation, not proof the newer image-first requirements have passed.
- **Lane A core content complete:** 300 original audited devotionals with EN/TL/CEB/ILO, 30 canonical emotions, 8 launch books and 5 first-party Past Teachings (#1334 plus earlier integrated batches).
- **Lane B core approval complete:** exact-revision fail-closed automatic approvals, immutable review evidence, in-app Books/Devotionals/Past Teachings Content Review and reviewer overrides (#1306).
- **Lane C core ONE 2 ONE complete:** pairing/curriculum/lesson/privacy/progress journey integrated (#1308). The later mobile polish PR #1349 has an authenticated mentor-congregation test failure; do not treat it as complete.
- **Lane D first release merged:** remaining work is new whole-app visual design, public Library/mobile usability, PWA/offline polish and strict re-certification; PRs #1346 and #1348 remain integration inputs.
- **New visual scope remains outstanding:** A's #1351 validates real CLEAN/TYPE/THUMB artwork; several image records are on development, but do not call P0 visual coverage complete until the registry/variant audit passes. The image-first requirements themselves are integrated through #1352.
- The original lane A/B/C issues were closed for their earlier scope; they are **reopened for 2026-10-08 image-first follow-up**. All **four lanes are active concurrently**. The current allocation below overrides older phase descriptions, including D's earlier claim to own all Library deck UI.

## Speed-track ownership and active work (2026-10-08)

| Lane | Current independent assignment | Owned surface / integration handoff |
| --- | --- | --- |
| **A — #1300** | Visual asset factory, 30 feeling concepts, Needs and featured art; audited 3-binary variants, rights/locale/text metadata and catalog coverage. Complete #1351. | Own `content/v7/**`, `data/v7/visual-assets/**`, `public/v7/images/**`, visual scripts/tests. Output versioned `byContent` registry, actual hashes and QA. No Library/runtime changes. |
| **B — #1301** | Close #1350 visual approval/review pagination; build **Library-specific image cards and the Feelings/Needs decks** with swipe/tap/keyboard/localization/fallback. | Own `src/features/content-review/**`, approval modules, **Library feature presentation** `src/features/library/**` and their tests. Implement *new isolated deck modules now*, but do not edit files currently in D's #1346 until D's hotfix integrates. B owns final Library feature wiring; D only owns generic art resolver. |
| **C — #1302** | Repair #1349 authenticated mentor congregation fixture, finish 7-step readable mobile ONE 2 ONE + private sharing/resume and exact tenant-denial E2E. | Own `src/features/one-to-one/**`, `src/features/lesson-runner/**`, feature-scoped styles/tests. Can use mocked shared asset interface, CLEAN/live-text fallback. |
| **D — #1303** | Close #1348 strict main CI and #1346 guest Library/offline hotfix, then **global Home/Bible/Reader, shell/nav, design tokens, generic visual resolver, PWA/a11y/perf and release integration**. | Own `src/ui/**` global shell/design, V7 release workflows, CI and deploy. Give Library-specific deck implementation to B; do not build a competing Library deck. D serializes merges/evidence and preview/production certification, not feature development. |

**Parallel execution contract:** Each lane branches from the current `v7/development` head, owns non-overlapping files, ships a bounded PR with affected tests, then continues its next task. Use stable versioned interfaces and fixture/mock inputs for incomplete dependencies. Finish #1346/#1348 main-target hotfixes with exact-head evidence; synchronize their changes into `v7/development` before B wires Library UI. Never overwrite A/B/C work from D or re-run every integrated suite for each isolated edit. D alone assembles the exact-SHA release candidate once affected slices pass.

**Acceptance:** visual files proven by actual hash/dimensions/rights and exact text; localized CLEAN fallback; guest Library usable; rolling 80–90% Feelings and Needs decks; accessible mobile 320/390/430px; ONE 2 ONE auth/tenant pass; responsive/Home/Reader tests; offline/PWA, security, approvals, performance, exact SHA and deployed smoke all pass. Remaining unproved work is OPEN, not PASS; the user's post-release app audit is not a pre-release gate.

See `docs/v7/V7_IMAGE_FIRST_AND_PARALLEL_LANES_20261008.md` and live issues #1300–#1303 for scope. This status file is the single progress authority.

## Prior baseline lane reference (superseded by speed-track allocation above)

| Lane | Canonical issue | Mission | Primary owned surface |
|---|---|---|---|
| **A** | #1300 | Release Content Factory | devotional/book/past-teaching corpus, translations, content metadata |
| **B** | #1301 | Automated Approval + In-App Audit | review policy, publication decisions, Content Review Library workflow |
| **C** | #1302 | ONE 2 ONE Final Closure | authenticated end-to-end ONE 2 ONE runtime and journey tests |
| **D** | #1303 | Global UI/UX + Release Convergence + Deployment | app shell/design system, browser/a11y/PWA/performance/release workflows, exact candidate, deployment |

All four are authorized to work simultaneously from the live `v7/development` head.

### Lane A — #1300

Deliver actual launch content:
- >=150 release-ready devotionals, then continue toward 300;
- EN source plus TL/CEB/ILO for every selected devotional;
- separate translation QA;
- complete source/provenance/rights/permitted-use/checksum metadata;
- content visual/cover metadata with source type, rights/provenance, alt/decorative state, crop/focal data and fallback key where appropriate;
- emotion/need/topic/life-situation and BSB mappings;
- 8 launch books with safe permitted-use behavior;
- rights-clear Past Teachings launch content.

Lane A does not own Content Review runtime, ONE 2 ONE, or release workflows.

### Lane B — #1301

Replace human-gated publishing with fail-closed automated policy review:
- source/provenance/rights;
- source fidelity;
- Scripture validity/context;
- theology/editorial/audience quality;
- mapping relevance/diversity;
- translation completeness/fidelity/naturalness;
- exact revision + metadata integrity;
- independent second-pass/adversarial QA.

Add truthful automated reviewer identity/policy evidence and extend protected Content Review with Books / Devotionals / Past Teachings plus post-release user overrides. Validate visual-asset rights/provenance and expose relevant visual evidence in the audit UI.

Lane B does not edit Lane A corpus files.

### Lane C — #1302

Finish ONE 2 ONE using automated authenticated journeys:
- pairing lifecycle;
- author/publish track-module-lesson;
- assignment/start;
- complete seven-step lesson flow;
- private/shared response boundaries;
- resume/completion;
- QR/deep-link;
- account/congregation switch denial;
- responsive/localized browser journey;
- V7 typography/color/icon/state-pattern adoption across ONE 2 ONE surfaces.

Absorb/rebase the useful work from PR #1257.

### Lane D — #1303

Prepare and then own the global UI/UX overhaul and final release convergence:
- implement/normalize global design tokens for typography, color, spacing, focus and states;
- implement the consistent primary app-shell/navigation model;
- implement reusable image-led content card/cover primitives and deliberate fallbacks;
- apply coherent Home, Library and reader presentation patterns where not owned by another lane;
- absorb/rebase useful work from PR #1265;
- automated populated Library browser journeys;
- automated keyboard/focus/contrast/text scaling/responsive checks;
- build/PWA/offline/performance/bundle/inherited regression;
- exact-SHA evidence aggregation;
- final candidate freeze;
- supported deployment;
- deployed identity and smoke verification.

Lane D preparation runs in parallel. Final candidate freeze naturally occurs after A/B/C outputs have landed.

## No-human-blocker policy

The user's audit occurs after V7 release and is not a release gate.

Do not create tasks whose only next action is “human review”, “manual browser check”, “physical-device observation”, “owner approval”, or “wait for another lane”.

Self-regulate:
- unclear rights -> substitute/exclude unsafe hosted content;
- failed translation -> repair and re-QA;
- insufficient approved count -> backfill;
- failing automation -> fix;
- stale branch -> refresh/rebase;
- merge conflict -> resolve against live integration;
- accessibility defect -> fix;
- flaky evidence -> make deterministic.

A lane may truthfully reject an individual content item, but that rejection must trigger automated replacement/backfill rather than block the release.

## Integration protocol

Each lane:
1. starts from live `v7/development`;
2. works only its owned primary surface;
3. runs targeted affected checks;
4. refreshes before merge if the head moved;
5. integrates safe bounded completed work itself;
6. continues to the next unresolved item in its canonical issue.

Do not wait for a separate integration command.

Shared-file collision must be minimized by ownership. When a shared edit is unavoidable, refresh against the current head and make the smallest compatible change.

## Retired/superseded work

The following no longer define active lane ownership:
- old A1/A2/A3/A4 issues;
- old A1–A4 integration map;
- old phase-specific remaining-work assignments;
- manual/physical evidence tasks that can be replaced by deterministic automation;
- human-only editorial approval as the sole publication path.

Historical tests/evidence remain valid inputs and should be reused.

## Definition of V7 done

V7 is finished when all four canonical reset issues are complete and one exact deployed candidate satisfies the consolidated automated release gate, including every ship-blocking UI/UX criterion in `docs/v7/V7_UI_UX_RELEASE_REQUIREMENTS_20261008.md`.

The user's subsequent in-app audit may change, reject or request changes to content through Content Review, but that audit is post-release quality stewardship rather than a prerequisite to finish V7.

## 2026-10-08 active motion addition — apply to every lane continuation

The user approved animation for V7, in parallel with current image-first work. Canonical task issues #1300–#1303 each contain a **motion requirement addendum** and the binding details live in `docs/v7/V7_MOTION_AND_ANIMATION_REQUIREMENTS_20261008.md`.

- **A:** continue three independently audited still-image variants and optional motion-safe crop hints, no animated-media release dependency.
- **B:** feature-scoped spring-like Feelings/Needs deck settling/swipes, card feedback, stable Content Review focus and reduced-motion/static fallback.
- **C:** state-safe ONE 2 ONE lesson/step progress transitions and tenant/privacy-safe rapid Back/Next/resume.
- **D:** shared motion tokens/primitives, Home/navigation/reader transitions and exact-SHA built-browser normal/reduced-motion/mobile/a11y/offline/perf gates; *never* implement a competing Library deck.

P0 interaction and reduced-motion gates are part of V7 acceptance. Rich multilayer cinematic scenery is P2, not a ship gate. These are newly **assigned** tasks, not evidence that they are implemented or tested. Original content, rights, Scripture fidelity and release safeguards remain unchanged.
