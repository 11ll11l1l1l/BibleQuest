# Lane D shared V7 motion and visual handoff (contract v1)

**Owner:** Lane D. **Consumers:** Lane B Library decks and review; Lane C lesson transitions; Lane A remains sole producer of image files and audit metadata.

The ES module `src/ui/motion.js` exports `V7_MOTION_API_VERSION = 1`, `V7_MOTION_TOKENS`, `motionEnabled(environment)`, `pressFeedback(element, options)`, `pageTransition(element, options)`, `cardReveal(element, options)`, `deckSpring(element, {delta, environment})`, and `cleanupMotion(element)`. Durations (milliseconds) are micro 150, standard 220, page 300, card/settle 280; easing is compositor-friendly.

Each primitive returns a synchronous cancellation function, or a no-op when CSS reduced motion or in-app `data-bq-effective-motion="reduce"` applies, or when WAAPI is missing. Replaying an animation on the same element cancels the previous one. Route and recovery navigation cancel old content animation on unmount; actions/focus/content updates never await animation completion. No layout/margin/height animation or hidden-until-finish content. B owns swipe semantics and keyboard/touch controls; C owns lesson state transitions. Both can integrate with static fake elements without waiting for art.

`src/ui/v7-motion.css` provides the matching version-1 token variables and stable labeled bottom-nav selected marker with reduced-motion CSS fallback. The shell uses page/hero animations and non-blocking nav press feedback.

`src/ui/visual-assets.js` exports `normalizeV7VisualRegistry`, `findV7Visual`, `loadV7VisualRegistry`. Lane D's build script `scripts/v7-publish-visual-assets.mjs` runs the exact authoritative Lane A visual audit. It copies only manifest-listed clean/type/thumbnail binaries and generated `data/v7/visual-assets.json` into `dist-v6`, before final artifact integrity hashing. Staged/partial/invalid derivatives never ship. B/C may query `emotion:<canonical_id>` or `devotional:<id>`, and select locale- and exact-label-matched text art; otherwise use approved CLEAN master or readable text-only state.

Tests: `node --test tests/v7/motion-primitives.test.mjs tests/v7/shared-visual-runtime.test.mjs tests/v7/visual-publication.test.mjs`; the existing V7 exact-head PWA and convergence workflows remain mandatory. The original Library-specific deck experiment in superseded PR #1360 is not part of Lane D's merged surface; Lane B owns it.

P0 motion release checks remain broader than this primitive interface: built-device screenshots and interaction verification for all four locales, 320/390/430/tablet, 200% text, reduced motion, no double navigation or focus loss, B deck evidence, C step evidence and exact-SHA published identity.
