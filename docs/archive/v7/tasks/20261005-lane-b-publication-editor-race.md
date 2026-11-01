# Lane B — publication/editor race

Starting integration: `d470ecd7b3d14e4b150ef36bc4bafeac1c08a113`.

The composed publication panel retained a publish action while the controller saved edits, loaded a hierarchy or checked readiness. Display readiness only when the authoring controller is ready, and reject publication/preparation event dispatch in any other controller state. This prevents an old DOM event from bypassing the UI guard. Atomic backend publication remains authority. No schema or global route changes.

Evidence: 15 focused publication/composition tests and all 283 V7 tests pass on Node 24.19.0; diff whitespace passes. Regression covers loading, saving, checking, idle and error states plus recovery to ready. Live backend/browser/mobile journey certification remains OPEN. Earlier database fixture issues are resolved by integrated #1208; pairing/lesson/Reader routes are integrated by #1212. No production changes.
