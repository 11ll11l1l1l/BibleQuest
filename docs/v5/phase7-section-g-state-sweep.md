# V5 Phase 7 Section G state sweep

Purpose: close the deferred loading / empty / error / offline verification debt on the current V5 architecture without redesigning feature owners.

Evidence classes:

- **STATIC**: `tests/v5-section-g-state-sweep.mjs` verifies the maintained Section G dependency inventory and executes the whole-app static audit on the exact candidate.
- **BROWSER-AUTO**: `.github/workflows/v5-section-g-state-sweep.yml` executes the maintained whole-app state matrix, deep-route/mobile audit, Assignments and Daily Journey browser checks, plus offline-shell and operational-recovery browser contracts on the same exact candidate.
- **BACKEND-E2E**: not claimed by this sweep.
- **DEVICE/FIELD**: not claimed by this sweep.

The browser state matrix exercises loading -> ready-empty, signed-out, offline/local-preview, no-congregation, sanitized error, successful completion and mobile overflow behavior. The deep-route audit walks the maintained route inventory at narrow/mobile widths and fails on blank surfaces, startup/recovery fallback, route errors or horizontal overflow. Existing Assignments and Daily Journey checks remain independent companion coverage rather than being replaced by new V5 UI behavior. Offline-shell and operational-recovery checks are deliberately classified as browser evidence, not static evidence.

This tranche changes no Reader/Games engine, state owner, backend, schema, RLS, localization mechanism, offline architecture or production configuration. A failure in any inherited contract is evidence of a current behavior/regression problem and must not be hidden by weakening the assertion.

Final acceptance note: this sweep provides STATIC + BROWSER-AUTO evidence for the deferred Section G verification debt on one exact candidate. It does not substitute for BACKEND-E2E or DEVICE/FIELD gates elsewhere in V5. Phase 5's real-browser no-network Scripture reopening requirement is tracked independently and is already evidenced by its dedicated accepted workflow.
