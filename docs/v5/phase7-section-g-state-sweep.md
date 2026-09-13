# V5 Phase 7 Section G state sweep

Purpose: close the deferred loading / empty / error / offline verification debt on the current V5 architecture without redesigning feature owners.

Evidence classes:

- **STATIC**: `tests/v5-section-g-state-sweep.mjs` executes the maintained whole-app static audit, offline-shell contract and operational-recovery contract on the exact candidate.
- **BROWSER-AUTO**: `.github/workflows/v5-section-g-state-sweep.yml` executes the maintained mobile whole-app state matrix and maintained deep-route audit, plus Assignments and Daily Journey browser checks, on the same exact candidate.
- **BACKEND-E2E**: not claimed by this sweep.
- **DEVICE/FIELD**: not claimed by this sweep.

The browser state matrix explicitly exercises loading -> ready-empty, signed-out, offline/local-preview, no-congregation, sanitized error, successful completion and mobile overflow behavior. The deep-route audit walks the maintained route inventory at 320 px and 430 px and fails on blank surfaces, startup/recovery fallback, route errors or horizontal overflow. Existing Assignments and Daily Journey browser checks remain independent companion coverage rather than being replaced by a new V5 UI implementation.

This tranche changes no Reader/Games engine, state owner, backend, schema, RLS, offline architecture or production configuration. A failure in any inherited contract is evidence of a current behavior/regression problem and must not be hidden by weakening the assertion.

Final acceptance note: this automated sweep provides STATIC + BROWSER-AUTO evidence for the deferred Section G verification debt. It does not substitute for Phase 5's separate real no-network Scripture reopening requirement, which still needs DEVICE/FIELD or equivalent browser network-disabled evidence under the V5 acceptance checklist.
