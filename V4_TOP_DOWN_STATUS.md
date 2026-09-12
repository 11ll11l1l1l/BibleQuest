# BibleQuest V4 Top-Down Lane Status

## Lane identity

- Lane: **A — Top-Down**
- Working branch: `v4/modern-ui-overhaul`
- Coordination contract: `V4_PARALLEL_COORDINATION.md`
- Integration authority: user / human-chat captain

## Assigned queue

1. Gate 8 — Ministry + Assignments + Workspace + Notifications — **CERTIFIED**
2. Gate 9 — Bible World + Progress + Personal Mission + Calendar — **CERTIFIED**
3. Gate 10 — Study family — **ACTIVE / NEXT IMPLEMENTATION**

Do not enter Lane B tranches 11–13 unless the captain explicitly reassigns them.

## Current handoff

```text
LANE: A
TRANCHE: 9 — Bible World + Progress + Personal Mission + Calendar
BASE CHECKPOINT: release/v4-ministry-ops @ 6be293d00ab419b0543bb6b7827e891097e858f8
CERTIFIED CANDIDATE: 31951dc82095bb4b6161913fbd3f427f0c0648ea
CHECKPOINT: release/v4-journey @ 31951dc82095bb4b6161913fbd3f427f0c0648ea
STATE: CERTIFIED / NEXT GATE 10
OWNED FILES: src/ui/journey-v4.css; tests/v4-journey-static.mjs; .github/workflows/v4-gate9-journey-verify.yml; index.html (one V4 stylesheet registration)
DELIBERATELY UNTOUCHED: src/features/bible-world/index.js; src/features/progress/index.js; src/features/mission/index.js; src/features/calendar/index.js; their service/state/scoring/persistence owners; Lane B runtime files; V4 foundation; shared icons
TARGETED VERIFICATION: Gate 9 workflow run 34664252703 passed build/static preservation contract, Gate 9 architecture validators, Gate 9 edge/presentation regressions, browser smokes and final mobile-width regression.
FULL CERTIFICATION: accumulated regression run 34664306245 passed Cloudflare build, all accumulated architecture validators, all accumulated edge regressions, guarded harness syntax, and the complete accumulated browser/mobile suite on exact SHA 31951dc82095bb4b6161913fbd3f427f0c0648ea.
OPEN FAILURES: none.
OVERLAP RISK: low. Lane B remains isolated on v4/bottom-up-tranches and owns tranches 13→11.
NEXT SAFE ACTION: Gate 10 — modernize Guided Study, Deep Questions, Story Journey, Wisdom Situations, Adaptive Learning and Open Smart Review as one mature/editorial/calm family while preserving each existing feature/content/session/reward owner byte-for-byte where possible.
```

## Gate 9 implementation notes

- `src/ui/journey-v4.css` establishes one warm, aspirational Explore/Journey visual family without adding state or service ownership.
- Bible World now reads as an intentional progression route: wide layouts use a two-column region map, the next region receives dominant emphasis, and region-card emoji glyphs are visually replaced by deliberate numbered route markers. Existing artwork assets and fallback behavior remain owned by the existing Bible World code.
- Progress is presented as a growth dashboard with a dominant hero, clearer core metrics, transformation actions and badges without changing XP, streaks, counters, rewards or badge logic.
- Personal Mission is presented as one focused next step without changing recommendation ownership or action routing.
- Calendar is presented as a calm agenda/planner while preserving personal/congregation event ownership, recurrence metadata, sharing, edit and remove behavior.
- Responsive rules cover tablet/narrow and compact phone layouts; certified touch-target, reduced-motion and increased-contrast behavior are retained.
- `tests/v4-journey-static.mjs` protects critical data hooks and compares all four feature-owner files byte-for-byte with `release/v4-ministry-ops` whenever that checkpoint ref is available.

## Regression caught before Gate 9 certification

The first V4 candidate changed the Bible World artwork frame away from its established 16:9 contract. `tests/v3-bible-world-artwork-smoke.mjs` failed with a measured 354x265.5 frame. The V4 stylesheet was corrected to retain `aspect-ratio:16/9` at all widths. No feature or service behavior was changed to fix it. The corrected candidate then passed both the targeted Gate 9 run and the full accumulated regression suite.

Full evidence: `V4_GATE9_CERTIFICATION.md`.

## Gate 10 scope prepared

Gate 10 keeps six separate existing owners and gives them one compatible V4 editorial presentation layer:

- Guided Study — `src/features/study/index.js`
- Deep Questions — `src/features/deep-questions/index.js`
- Story Journey — `src/features/story-journey/index.js`
- Wisdom Situations — `src/features/wisdom-situations/index.js`
- Adaptive Learning — `src/features/adaptive-learning/index.js`
- Open Smart Review — `src/features/open-review/index.js`

Protected behavior includes content provenance and doctrinal notices, lesson/session state, Reader handoffs, private responses, current XP/reward contracts, adaptive scheduling/selection logic, and open-review self-rating behavior.

## Release-blocking follow-ons kept separate

The requested Home-page Assignment notification/integration remains a separate Class C release-blocking requirement. Gate 8/9 presentation certification does not satisfy it.

The requested Cebuano/Bisaya Bible translation remains a separate translation/data/content release requirement and must not be silently folded into Gate 10 presentation work.
