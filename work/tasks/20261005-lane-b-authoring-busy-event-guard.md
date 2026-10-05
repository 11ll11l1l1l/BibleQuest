# Lane B — busy authoring event guard

Starting integration: `5ba187632a7c4a2b9c0bb50156c40650104f11bd`.

The authoring renderer disables editing controls while the controller is loading, saving, or checking readiness, but its delegated DOM handlers still trusted that visual state. Reject disabled buttons and stale authoring selection/action/submit events independently while busy, while keeping navigation callbacks available.

Focused regression proves reload, readiness, selection, and form submission cannot dispatch during a busy state even when a stale synthetic event reaches the handler. No schema, RLS, route ownership, or backend mutation changes.