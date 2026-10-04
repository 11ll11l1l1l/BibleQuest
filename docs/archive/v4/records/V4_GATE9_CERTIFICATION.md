# BibleQuest V4 Gate 9 Certification

## Certified tranche

**Gate 9 — Bible World + Progress + Personal Mission + Calendar**

- Runtime candidate SHA: `31951dc82095bb4b6161913fbd3f427f0c0648ea`
- Intended checkpoint: `release/v4-journey`
- Change class: **Class A — presentation only**
- V4 layer: `src/ui/journey-v4.css`
- Preservation contract: `tests/v4-journey-static.mjs`

## Ownership preserved

The following feature owners were deliberately not modified in this tranche:

- `src/features/bible-world/index.js`
- `src/features/progress/index.js`
- `src/features/mission/index.js`
- `src/features/calendar/index.js`

The existing Bible World, Progress, Personal Mission and Calendar service/state/routing/reward/persistence owners remain authoritative. Gate 9 adds no second store, route owner, scoring path, recurrence engine, calendar persistence path, or Bible World progression owner.

## V4 presentation result

- **Bible World** now reads as an explorable progression route. The primary region cards use deliberate numbered progression markers instead of inherited emoji glyphs as their main V4 map marker. The existing world artwork remains intact and retains its required 16:9 presentation contract.
- **Progress** now reads as a growth dashboard with a dominant progress hero, clearer key metrics, transformation actions, badges, and rule explanation hierarchy.
- **Personal Mission** now presents one focused next step with a clear primary continuation action and restrained secondary action.
- **Calendar** now reads as a calm agenda/planner with clearer event grouping and authoring hierarchy while preserving existing personal/congregation event, recurrence, share, edit and removal behavior.
- Responsive treatment covers tablet/narrow layouts and compact phone layouts; certified V4 touch-target, reduced-motion and increased-contrast expectations are preserved.

## Regression found and corrected before certification

The first targeted candidate changed the Bible World artwork frame away from its existing 16:9 contract. Existing browser regression `tests/v3-bible-world-artwork-smoke.mjs` correctly failed with a measured `354x265.5` frame. The V4 override was corrected to retain `aspect-ratio:16/9` at all widths before certification. No feature/service behavior was changed to fix the failure.

## Verification evidence

Targeted Gate 9 run: `34664252703` — **PASS** on exact SHA `31951dc82095bb4b6161913fbd3f427f0c0648ea`.

Passed:
- Cloudflare deployment gate
- `tests/v4-journey-static.mjs`
- Bible World architecture validator
- Bible World artwork validator
- Calendar architecture/ownership validator
- Bible World edge + artwork edge regressions
- Progress edge + Phase B static contracts
- Mission Phase B static contract
- Calendar edge + Phase B static contracts
- Bible World browser + artwork browser regressions
- Progress browser + Phase B browser regressions
- Mission Phase B browser regression
- Calendar browser + Phase B browser regressions
- final mobile-width regression

Complete accumulated regression run: `34664306245` — **PASS** on the same exact SHA.

Passed:
- Cloudflare deployment gate
- all accumulated architecture validators
- all accumulated edge regressions
- guarded field-harness syntax checks
- Playwright/Chromium setup
- complete accumulated browser/mobile regression suite

## Next Lane A gate

**Gate 10 — Study family**: Guided Study, Deep Questions, Story Journey, Wisdom Situations, Adaptive Learning, and Open Smart Review.
