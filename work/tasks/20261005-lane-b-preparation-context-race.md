# Lane B — assignment preparation callback race

Starting integration: `08c530b2eeef4abe3199eb022e7428b4d4485b82`.

The assignment creation path already suppressed stale acknowledgements after account/congregation changes, but preparation-only callbacks could reject late and replace a newer context-change or subsequent-action state with a stale generic error. Keep a page-local interaction generation separate from preparation state emissions, invalidate it on newer preparation actions, creation, context changes, and disposal, and only surface callback failure for the still-current interaction.

Focused regressions cover a late preparation failure after a context switch and an older failure after a newer preparation request. No schema, RLS, global route, backend authority, or production mutation changes. Browser/live-backend ONE 2 ONE journey certification remains separate.