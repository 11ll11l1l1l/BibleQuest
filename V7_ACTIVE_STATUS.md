# BibleQuest V7 Active Status

Updated: **2026-10-08 JST**  
State: **Release-convergence reset active**  
Development branch: `v7/development`  
Reset baseline: `725646bcb512c489f05966ffe83090977c7f3fc3`  
Operative release override: `docs/v7/V7_RELEASE_RESET_20261007.md`  
Operative UI/UX release override: `docs/v7/V7_UI_UX_RELEASE_REQUIREMENTS_20261008.md`

## Command contract

The user may issue:
- `Continue V7 lane A`
- `Continue V7 lane B`
- `Continue V7 lane C`
- `Continue V7 lane D`

Resolve the live issue below and continue immediately. Do not ask which phase or sub-lane to use.

The old **A1/A2/A3/A4** subdivision is retired. The old phase-specific A–D map is historical only for remaining V7 work.

## Current factual baseline

Core Library browse/detail/discovery, emotion/need discovery, tenant-safe query plumbing, provenance/rights boundaries and major accessibility hardening are integrated.

Structured ONE 2 ONE pairing/curriculum/lesson/progress/security is substantially integrated and has extensive automated backend/tenant coverage.

The largest remaining release gap is content completion:
- 173 devotional candidate pointers exist in the A2 research pool;
- only 6 actual in-app devotional records are currently materialized;
- the requested launch target is now **at least 150 release-ready devotionals**, continuing toward **300**;
- every selected English devotional requires Tagalog, Cebuano and Ilocano translation plus QA;
- 8 launch books exist but need the new automated publication policy;
- Past Teachings needs a rights-clear launch set;
- Content Review exists, but V7 Library audit/review still needs to be integrated into it.

Useful unmerged automation exists in PR #1257 (authenticated ONE 2 ONE) and PR #1265 (authenticated populated Library/build browser). They are inputs to the reset lanes, not separate old-lane obligations.

A 2026-10-08 owner scope override adds a **whole-app UI/UX release overhaul** to V7. Typography, color/contrast, primary navigation, iconography, image-led content cards, Library/Home/reader presentation and designed loading/empty/offline/error states are release-blocking requirements under `docs/v7/V7_UI_UX_RELEASE_REQUIREMENTS_20261008.md`.

## New parallel lanes

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
