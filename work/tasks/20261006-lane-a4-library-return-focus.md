# Lane A4 — Library detail return focus

Baseline: `250667b84e8f809339585481761474c9d5c70ff9`, `v7/development`.

Owned surface: deterministic Library keyboard/focus semantics only.

After the prior navigation-focus tranche, Library detail entry and terminal pagination had explicit focus behavior, but the in-app **Back** path from a Library item still destroyed the originating browse card without an explicit restoration target. That could leave keyboard focus on the document body after the browse page remounted.

This tranche keeps the behavior feature-local:

- the Library item **Back** control stages its item ID in a one-shot in-memory focus handoff;
- the next Library browse mount consumes that handoff only after its initial list request reaches a terminal state;
- if the originating card is present in the rendered results, focus returns to that card;
- if filters/data changed and the card is unavailable, focus moves to the persistent Library status region instead of the document body;
- the handoff is consumed once and does not steal focus on later Library state changes or normal visits;
- starting a new browse/search clears any still-pending return target.

Focused regression coverage verifies the one-shot handoff, deferred origin-card restoration, missing-card fallback, detail-entry focus, and pagination focus behavior.

This remains automated deterministic coverage only. Browser-native Back behavior outside the Library control contract, named screen-reader/browser observation, contrast measurement, populated approved-content journeys, physical-device evidence, authenticated role journeys, deployment identity, and final release-candidate certification remain outside this tranche.
