# BibleQuest V4 Product-Owner Release Waiver

Authorized: 2026-09-13T05:49:21+09:00
Scope: V4 production release governance
Integration baseline at authorization: `cb4286d5b4bb7afdd22a2d3b4f1dc6d0ccffe5db`
Certified application tree: `4f908ad8b53f3feb00f21ae27dd4707597b5aa14`

## Decision

The product owner explicitly directed the release process to remove tasks that require the product owner to perform additional manual field validation so BibleQuest V4 can proceed to publication.

This is a **waiver**, not fabricated evidence and not a claim that an unperformed field scenario passed.

The following Phase 6 field gates are therefore non-blocking for this release and are recorded as `waived` in `V4_PHASE6_FIELD_EVIDENCE.json`:

- Gate A — authenticated emergency-action matrix;
- Gate B — account switching / stale-state clearing;
- Gate C — true cross-congregation field isolation;
- Gate D — physical Android Chrome acceptance;
- Gate E — physical Android Brave acceptance;
- Gate F — installed Android PWA acceptance;
- Gate G — linked-activity multi-account field validation.

The previously required server-side `main` branch-protection/ruleset setup is also waived as a release blocker for this owner-directed release. Promotion should still use a pull request and all available automated checks.

## Evidence that remains mandatory

This waiver does not waive or falsify automated evidence. Release promotion must continue to rely on the current green build/static/architecture/regression/security/privacy/responsive/accessibility/PWA/browser/protected-page/Cloudflare checks applicable to the exact release candidate.

Any automated failure remains a blocker. Any newly discovered functional, privacy, authentication, authorization, or data-isolation defect remains a blocker until corrected.

## Interpretation

`pass` means the required field scenario was actually observed and supported by evidence.

`waived` means the product owner knowingly accepted release without requiring that additional manual field scenario before publication. A waived gate must never be represented later as field-tested unless it is genuinely executed and the evidence record is updated.

The detailed procedures in `RELEASE_FIELD_VALIDATION_V4.md` remain useful for post-release validation and regression investigation, but waived items are no longer required pre-publication tasks for this owner-directed release.
