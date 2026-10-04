# P3-B feature-local authoring controller

`src/features/curriculum-authoring/controller.js` composes Lane B's scoped track, hierarchy, lesson-revision/step, and publication-readiness repositories without taking ownership of global routing, session, congregation selection, schema, RLS, publication, or assignment mutation.

The controller exposes one observable state for the authoring surface: tracks, selected track/module/lesson/revision, child collections, current lesson steps, publication readiness, operation status, and recoverable errors. Selection is hierarchical; choosing a parent clears deeper stale selections. Create/update operations use the loaded optimistic revision IDs supplied by the repositories. Step saves immediately recompute readiness. A newer operation supersedes late responses from older selections, while `invalidate()` clears all authoring data for account/congregation lifecycle changes and `dispose()` cancels pending work.

This controller intentionally has no `publish`, `archive`, `withdraw`, or `assign` method. Atomic publication/archive is waiting on #1168. Race-safe assignment authority is waiting on #1170. When those shared mutation boundaries exist, the feature surface can consume them without adding a second authorization or tenant owner.

Global page registration/navigation remains a Lane A shared-surface handoff. Until then, this controller is independently testable and can be mounted by an authorized existing ministry/content surface without inventing a new route key.
