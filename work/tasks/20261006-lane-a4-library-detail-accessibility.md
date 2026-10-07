# Lane A4 — Library detail accessibility recovery

Baseline: `50e19078e9daa6b6b587b5595e81acacd100e2c9`, `v7/development`.

Owned surface: Library detail retry/failure accessibility semantics and focused regression coverage. This tranche is disjoint from the authenticated populated-browser work in PR #1256 and does not claim assistive-technology, physical-device, reviewed-content or final-candidate acceptance.

The Library detail retry control previously became hidden as soon as the retry triggered a loading state, leaving keyboard focus on a control that was no longer exposed. The detail status region is now a programmatic focus target. Retry moves focus there before re-reading the same item, so the persistent region carries the subsequent loading/result announcement without changing repository or routing behavior.

Normal loading/ready/context updates remain `role="status"` with polite live announcements. Error and not-found states switch the same persistent region to `role="alert"` / `aria-live="assertive"`, then return to polite status semantics when recovery starts.

Focused unit coverage verifies the static focus target, error and unavailable announcement priority, focus transfer on Retry, return to polite loading semantics, same-item retry behavior and localized offline recovery. Exact-SHA repository CI remains the executable verification authority for this branch.

This improves deterministic UI semantics only. Actual announcement quality with a named screen reader/browser, populated-content keyboard journeys, contrast measurement, mobile-device evidence and release-candidate certification remain OPEN under `docs/v7/P5_A_BROWSER_MOBILE_ACCESSIBILITY_EVIDENCE_PREP.md`.
