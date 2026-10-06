# Lane A4 — Library browse accessibility recovery

Baseline: `621f80cb0a21afb9f4c14b21f32785b0dda77a13`, `v7/development`.

Owned surface: Library browse retry/status accessibility semantics and focused regression coverage. This tranche is disjoint from the authenticated populated-browser acceptance work in PR #1256 and does not claim assistive-technology, physical-device, representative-content or final-release acceptance.

The Library browse Retry control previously became hidden immediately when the retry triggered a loading state, leaving keyboard focus on a control that was no longer exposed. The persistent browse status region is now a programmatic focus target, and Retry moves focus there before re-running the last submitted request.

Normal idle/loading/empty/ready announcements remain `role="status"` with polite live semantics. Primary read failures and incremental `moreError` failures use `role="alert"` / `aria-live="assertive"`, then return to polite status semantics after recovery.

Focused unit coverage verifies the static focus target, primary error announcement priority, Retry focus transfer, return to polite loading semantics, pagination error priority, and preservation of the prior request/filter contract.

Actual named screen-reader/browser observation, physical-device evidence, representative editorial/rights approval, connected production verification and release-candidate promotion remain OPEN under the existing P5 acceptance plan.
