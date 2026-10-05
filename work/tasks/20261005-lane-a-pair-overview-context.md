# Task: restore ONE 2 ONE overview after context hydration

Owner: Lane A
Branch: `lane-a/pair-overview-context-20261005`
Integration base: `6c6b2fa1525099d79d2c2cd0821a293acf714191`, including invitation recovery PR #1216 and the concurrent Lane B/D fixes.
Status: COMPLETE — implementation and affected checks; automatic integration follows.

The overview previously retained English introduction/control/status text in translated UI, displayed raw repository errors, and required manual reload after account/congregation hydration. Use shared registered EN/TL/CEB pairing copy for the overview; show the existing localized recovery message; clear context immediately and reload only when shared account and selected-congregation owners are ready. Generations and disposal prevent late content or further reads after teardown. Existing pair read/RLS authority and entry routes are preserved.

Verification: all 296 V7 tests and five affected inherited bootstrap/router tests pass after refresh with Lane B publication readiness and Lane D Library-notice localization. New mounted-page tests cover positive hydration without inferred tenancy, suppressed old-context reads, routing and cleanup, actual EN/TL/CEB locale switching and backend-error redaction. Combined unit command also passes all 880 V6 tests; build, typecheck, lint, format and whitespace pass locally on Node 24.19.0. Real-browser/mobile/live-backend journeys remain OPEN, as do reviewed representative content and pair-private capability reconciliation. No schema or production action.

Recovery dependency integrated at `6c6b2fa1`; exact head `20e4bf08` passed pinned Build/PWA/Performance run 37290363462. Local overview refresh preserves the same tested code tree.
