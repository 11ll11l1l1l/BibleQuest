# Lane B — authoring operation/context race

Starting integration: `39ea6bb7725379d8934be678436c34d58a5ec8a3`.

The curriculum authoring page could surface a stale generic failure after a newer account/congregation change because asynchronous load/select/save/readiness operations had no page-level operation generation. Track the current operation, invalidate older operations on newer actions, context changes, and disposal, and only render an operation error when its token is still current.

Focused regression proves a late load rejection cannot replace the newer localized context-change state. No schema, RLS, route ownership, publication authority, or production mutation changes.