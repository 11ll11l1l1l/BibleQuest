# Lane B — busy authoring event guard

Originally started from `5ba187632a7c4a2b9c0bb50156c40650104f11bd`; refreshed onto integration `dde24cbd75c76787495c8d92e7a05556fa9fa45d` after non-overlapping devotional provenance PR #1222 landed.

The authoring renderer disables editing controls while the controller is loading, saving, or checking readiness, but its delegated DOM handlers still trusted that visual state. Reject disabled buttons and stale authoring selection/action/submit events independently while busy, while keeping navigation callbacks available.

Focused regression proves reload, readiness, selection, and form submission cannot dispatch during a busy state even when a stale synthetic event reaches the handler. No schema, RLS, route ownership, or backend mutation changes.