# BibleQuest V4 Top-Down Lane Status

## Lane identity

- Lane: **A — Top-Down**
- Working branch: `v4/modern-ui-overhaul`
- Coordination contract: `V4_PARALLEL_COORDINATION.md`
- Integration authority: user / human-chat captain

## Assigned visual queue

1. Gate 8 — Ministry + Assignments + Workspace + Notifications — **CERTIFIED**
2. Gate 9 — Bible World + Progress + Personal Mission + Calendar — **CERTIFIED**
3. Gate 10 — Study family — **CERTIFIED**

Lane A's assigned top-down visual queue is complete. Do not enter Lane B tranches 11–13 unless the captain explicitly reassigns them.

## Current handoff

```text
LANE: A
LAST VISUAL TRANCHE: 10 — Study family
LAST CLASS C BLOCKER: Home Assignments notification/integration
BASE CHECKPOINT: release/v4-study @ 6a092de05b331be57efd49d4e9636987b42ae1a9
CERTIFIED CANDIDATE: d97e04829926aa8ce999101d64c45c539849187a
CHECKPOINT: release/v4-home-assignments @ d97e04829926aa8ce999101d64c45c539849187a
STATE: HOME ASSIGNMENTS CERTIFIED / NEXT CEBUANO-BISAYA DATA BLOCKER
TARGETED VERIFICATION: Home Assignments workflow run 34665387872 passed build, Home contracts, single-owner/Assignments validators, privacy/behavior regressions, 390px direct-open/privacy smoke, existing Assignments browser tests and mobile-width regression.
FULL CERTIFICATION: accumulated regression run 34665430650 passed Cloudflare build, all accumulated architecture validators, all accumulated edge regressions, guarded harness syntax and the complete accumulated browser/mobile suite on exact SHA d97e04829926aa8ce999101d64c45c539849187a.
OPEN FAILURES: none.
NEXT SAFE ACTION: implement the separate Cebuano/Bisaya Bible translation/data release blocker through the existing Bible registry, bundled-pack loader, Reader/search pipeline and offline cache. Use a redistribution-compatible source and preserve full attribution; do not add a second Bible-data owner or runtime API dependency.
```

## Home Assignments Class C certification

- Checkpoint: `release/v4-home-assignments` @ `d97e04829926aa8ce999101d64c45c539849187a`.
- Targeted run: `34665387872` — PASS.
- Full accumulated run: `34665430650` — PASS.
- Home reuses the existing singleton Assignments service already constructed in bootstrap and the existing `assignments` route.
- Current tasks are projected as safe metadata only and sorted by urgency: **Overdue**, **Due soon**, **In progress**, **Pending**.
- Completed and not-yet-open scheduled tasks do not appear on Home.
- Direct task action opens the task through the existing Assignments owner before routing to the existing Assignments page.
- Submission text, leader feedback, private review responses and peer answer text are not projected into Home.
- Load failures fail closed by hiding the Home assignment summary instead of exposing stale/partial data.
- New static, deterministic edge and 390px browser/privacy/direct-open tests protect the integration.

Full evidence: `V4_HOME_ASSIGNMENTS_CERTIFICATION.md`.

## Gate 10 implementation notes

- `src/ui/study-family-v4.css` gives Guided Study, Deep Questions, Story Journey, Wisdom Situations, Adaptive Learning and Open Smart Review one mature/editorial/calm visual family without merging their logic.
- Guided Study is presented as a structured reading workspace.
- Deep Questions uses a reflective editorial layout with prominent featured-question and private-note surfaces.
- Story Journey uses a narrative timeline treatment and deliberate numbered sequence markers rather than inherited emoji as the primary V4 card marker.
- Wisdom Situations is presented as a serious decision workspace with clearer scenario/choice/rationale hierarchy.
- Adaptive Learning is presented as a review dashboard and focus mode while preserving adaptive selection/scheduling behavior.
- Open Smart Review is presented as a source-first recall workspace with clearer answer/context/license/self-rating hierarchy.
- Source provenance and doctrinal-safety notices remain owned by the existing feature/content system and were revalidated.
- `tests/v4-study-family-static.mjs` protects the six feature-owner files and all critical interaction hooks, and enforces V4 responsive/accessibility/no-remote-asset expectations.

Full evidence: `V4_GATE10_CERTIFICATION.md`.

## Gate 9 retained evidence

- Checkpoint: `release/v4-journey` @ `31951dc82095bb4b6161913fbd3f427f0c0648ea`.
- Targeted run: `34664252703` — PASS.
- Full accumulated run: `34664306245` — PASS.
- A first-candidate Bible World 16:9 artwork regression was caught by existing browser coverage and corrected before certification.
- Full evidence: `V4_GATE9_CERTIFICATION.md`.

## Gate 8 retained evidence

- Checkpoint: `release/v4-ministry-ops` @ `6be293d00ab419b0543bb6b7827e891097e858f8`.
- Targeted run: `34663369219` — PASS.
- Full accumulated run: `34663418384` — PASS.
- Gate 8 was presentation-only; the separate Home assignment-notification Class C requirement was subsequently completed and certified at `release/v4-home-assignments`.

## Active separate Class C/data release blocker — Cebuano/Bisaya Bible

Use **Biblica® Open Ang Pulong sa Dios™ / Biblica® Open Cebuano Contemporary Bible™ 2024** (`CEBOCB` / `cebocb`, OCCB), distributed under CC BY-SA 4.0, rather than the older restrictive APSD-CEB source.

Implementation contract:

- integrate through the existing central Bible translation registry and Reader/search/offline pipeline;
- bundle a complete 66-book local/offline pack set rather than creating a new runtime API dependency;
- expose a clear Reader selector label containing both **Cebuano** and **Bisaya**;
- preserve canonical BibleQuest book codes and chapter/verse mapping with no cross-translation mismapping;
- preserve complete source, copyright, trademark, CC BY-SA 4.0 and adaptation/formatting disclosure in `data/packs/ATTRIBUTION.md`;
- validate all 66 canonical books, duplicate-free chapter/verse coordinates, valid chapter ranges, readable verse text, Reader navigation, verse lookup, search, and opened-pack offline persistence;
- if the delivery-pack conversion removes non-verse USFM material such as headings, footnotes or cross-references, disclose that packaging transformation while keeping Scripture verse text unmodified;
- do not bundle the older restrictive APSD-CEB text;
- keep audio outside this tranche unless its exact license is separately verified.
