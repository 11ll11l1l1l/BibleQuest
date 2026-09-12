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
BASE CHECKPOINT: release/v4-journey @ 31951dc82095bb4b6161913fbd3f427f0c0648ea
CERTIFIED CANDIDATE: 6a092de05b331be57efd49d4e9636987b42ae1a9
CHECKPOINT: release/v4-study @ 6a092de05b331be57efd49d4e9636987b42ae1a9
STATE: CERTIFIED / VISUAL QUEUE COMPLETE
OWNED FILES: src/ui/study-family-v4.css; tests/v4-study-family-static.mjs; .github/workflows/v4-gate10-study-verify.yml; index.html (one V4 stylesheet registration)
DELIBERATELY UNTOUCHED: src/features/study/index.js; src/features/deep-questions/index.js; src/features/story-journey/index.js; src/features/wisdom-situations/index.js; src/features/adaptive-learning/index.js; src/features/open-review/index.js; their content/session/reward/adaptive owners; Lane B runtime files
TARGETED VERIFICATION: Gate 10 workflow run 34664666134 passed build/static preservation contract, source/doctrinal validators, all targeted edge regressions, browser smokes and mobile-width regression.
FULL CERTIFICATION: accumulated regression run 34664722681 passed Cloudflare build, all accumulated architecture validators, all accumulated edge regressions, guarded harness syntax and the complete accumulated browser/mobile suite on exact SHA 6a092de05b331be57efd49d4e9636987b42ae1a9.
OPEN FAILURES: none.
NEXT SAFE ACTION: implement the separate Class C V4 release blocker — Home Assignments notification/integration — using the existing singleton Assignments service and existing Assignments route. Do not create a second store/service/API path.
```

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
- Gate 8 was presentation-only and did not complete the Home assignment-notification behavior requirement.

## Active Class C release blocker — Home Assignments

Repository inspection confirms Home currently has no Assignments dependency/card. The existing singleton Assignments service is already created in bootstrap and is the source of truth. The safe implementation contract is:

- pass that existing singleton into Home; never create another Assignments service/store/API path;
- load server-filtered assignment state without blocking the rest of Home;
- keep completed and not-yet-open scheduled tasks out of the active Home list;
- visibly distinguish **Pending**, **In progress**, **Due soon**, and **Overdue** states;
- show only non-sensitive assignment metadata such as title/type/status/due date;
- never expose submission text, private responses, leader feedback or unrelated private-study data on Home;
- direct task action must call the existing Assignments owner and navigate into the existing Assignments route;
- preserve correct congregation/user targeting and existing privacy/RLS boundaries;
- keep the card visible and useful on mobile, not buried inside More.

## Remaining separate Class C/data release blocker — Cebuano/Bisaya Bible

The requested Cebuano/Bisaya Bible translation remains separate from UI work. Preferred source remains Biblica Open Cebuano Contemporary Bible / Open Ang Pulong sa Dios 2024 (`CEBOCB` / `cebocb`, OCCB), CC BY-SA 4.0. It must be integrated through the existing translation registry/Reader/search/offline pipeline with attribution and canonical-book verification; the older restrictive APSD-CEB source must not be bundled.
