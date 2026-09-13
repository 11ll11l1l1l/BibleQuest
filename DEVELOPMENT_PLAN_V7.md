# BibleQuest V7 Development Plan

Updated: 2026-09-13 JST
Authority: this document is the forward-looking sketch for V7; it becomes binding only once V6 Phase 12 (certification/promotion) is complete and a dedicated `V7_ACTIVE_STATUS.md` supersedes it, following the same governance pattern as V4 and V6.
Depends on: V6 Phase 11's Motion and Sound System (architecture must be built, tested, and proven on reference surfaces before V7 begins).

## 1. V7 line in the sand

V3 established/recovered broad product capability. V4 modernized presentation without touching architecture. V6 is the deliberate architecture-replacement version - real build tooling, real database testing, decomposed Reader/Games, a real media platform, push, offline reading, Leader Center, multi-congregation, and the foundational Motion and Sound System.

V7 is **not** another architecture version. V7 is the deliberate full-coverage application of what V6 built: sound, animation, and consistent polish applied everywhere, plus the cross-cutting cohesion work that only makes sense once every surface shares the same design/motion/sound language. Where V4's mandate was "modernize the look," V7's mandate is "make the whole app feel like one considered, alive product" - not a collection of well-built independent pages.

V7 must not re-litigate V6's architecture. If V7 work reveals the Motion/Sound System itself has a real gap (not just "this one page needs a custom exception"), that is a V6 defect to fix in V6, not a reason to invent a second system in V7.

## 2. Why this needs its own major version, not a V6 sub-phase

V6 Phase 11 deliberately proves the Motion/Sound System on only 2-3 reference surfaces and stops there. Rolling it out to *every* page, game, dialog, and transition in the app - and then doing the cross-page cohesion pass that a partial rollout can never achieve - is comparable in scope to V4's entire family-by-family visual rollout (which took the majority of that version's work). Bundling it into V6 would either bloat V6's architecture-focused scope past a reviewable size, or force a rushed, shallow rollout that undermines the very point of building the system properly first.

## 3. Execution model

Same discipline as V4 and V6: one serialized integration stream, exact-SHA verified checkpoints per tranche, full accumulated regression before every freeze, honest recording of what's deferred versus done. V7 additionally requires, per tranche:

1. confirm the tranche's target surface(s) do not require any Motion/Sound System change (if they do, stop and route that fix through V6 first);
2. apply registered animation/sound presets from the V6 registry - do not hand-author new one-off effects unless the registry genuinely lacks the pattern, in which case add it to the registry first (keeps the system canonical, not fragmented again);
3. verify with sound/motion both enabled and both disabled (matching the V6 exit-gate discipline);
4. verify on real device classes for haptics/audio-unlock behavior, not just desktop browser emulation;
5. update `V7_ACTIVE_STATUS.md` and the V7 acceptance checklist in the same stream.

## 4. Proposed phase sequence

### Phase 0 - Registry completion and cohesion audit
Before rolling out to every page, do a single pass identifying every distinct "moment" across the whole app that deserves a considered animation/sound treatment (completions, unlocks, streaks, errors, route transitions, form success/failure, notification arrival, real-time presence changes) and ensure each has a registered preset. This prevents the family-by-family rollout from inventing slightly-different treatments for the same conceptual moment in different corners of the app - the single biggest risk to "feels integrated" rather than "feels like many small polish passes."

**Exit gate:** a complete, reviewed moment-to-preset mapping exists and is checked into the registry before any page-family rollout begins.

### Phase 1 - Explore/Home/Journey family
Home's daily-continuation flow, streak increments, Bible World region reveals, Calendar interactions, Daily Journey completion. This family is first because it's the highest-traffic surface and the best proof that the rollout methodology (registry-first, not bespoke-per-page) actually holds up under real page complexity.

### Phase 2 - Play/Games/Avatar family
The family with the most legitimate reason for playful, tactile motion and sound - game round completions, Memory Meadow match/mismatch feedback, Avatar Vault unlocks, badge reveals. Directly builds on V6 Phase 5's Games engine decomposition, since a proper component-based Games UI is what makes per-interaction animation hooks tractable instead of another emoji-and-innerHTML patch.

### Phase 3 - Learn/Read/Study family
Reader page-turn/chapter-transition motion, Guided Study step progression, Smart Review reveal/rate feedback. Deliberately restrained here - this family's personality (per V4's own established design language) is editorial and calm, so the register of animation/sound is quieter than Play's, using the same underlying system with different preset choices.

### Phase 4 - Grow/Reflect family
Progress milestones, Transformation reflection saves, Personality Profile/Psychometrics completion. Calm, personal register again - reinforces that "integrated" means one system used with situational judgment, not one animation style stamped everywhere.

### Phase 5 - Community/Relational family
Encouragement-sent confirmation, Recognition/badge-award reveals, Live Rooms join/leave presence cues, Journey Group activity. People-first register - warmth over spectacle.

### Phase 6 - Ministry/Ops/Admin family
Deliberately the *lightest* touch. Per the standing "never treat like games" rule already established in V4/V6 governance, Assignments, Leader Center, Admin Console, and Content Review get functional micro-feedback only (a save confirmed, an action completed) - restrained, professional, trustworthy. Explicitly verify no celebratory/playful preset ever appears here.

### Phase 7 - Cross-page cohesion pass
The step a family-by-family rollout cannot do by itself: consistent route-transition motion between every page regardless of family, a single consistent "you did something right" audio signature reused everywhere it's earned (not six different chimes), and an audit that nothing from Phase 1-6 accidentally drifted from the Phase 0 registry into a one-off exception.

**Exit gate:** a full-app audit (mirroring V4's whole-app polish audit methodology) finds zero unregistered animation/sound implementations outside the approved family-appropriate exceptions from Phase 6.

### Phase 8 - Integrated V7 certification and promotion
Full accumulated regression, sound/motion on/off matrix across every migrated route, physical-device haptic/audio-unlock verification, exact-SHA candidate freeze, staged promotion following the same rollback-preserving discipline as V4 RC and V6 Phase 12.

## 5. What "fully polished, integrated" means here, precisely

To keep this from becoming an unbounded aesthetic goal with no exit criteria:

- **Polished** = every registered moment has a deliberate, tested, accessible treatment - not merely "something moves."
- **Integrated** = the same conceptual moment (a completion, an error, a reward) uses the same preset everywhere it occurs, and the register of intensity (playful vs. restrained) is consistent within each family and deliberately different across families, per the boundaries already established for "game-like" scope in V4.
- **Fully** = the Phase 7 cohesion audit finds no gaps, not merely "most pages got attention."

## 6. Non-goals

- V7 is not a redesign. Visual identity, layout, and information architecture from V4/V6 are not up for revision here except where a motion/sound treatment genuinely requires a small structural hook (e.g. a container to animate into).
- V7 does not touch backend/RLS/data architecture. If a V7 tranche seems to need that, it has scoped itself incorrectly.
- V7 does not invent new sound/animation infrastructure. Every tranche consumes the V6 registry; gaps get fixed by extending the registry, not by one-off page code.
