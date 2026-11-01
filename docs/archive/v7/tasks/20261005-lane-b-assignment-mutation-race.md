# Lane B — assignment mutation race recovery

Baseline: `6c6b2fa1525099d79d2c2cd0821a293acf714191`.

Stale reload/selection events during assignment creation could advance the page generation without clearing mutationBusy, suppress the creation acknowledgement and leave the UI permanently busy. Guard competing actions while the mutation or preparation read is active. Permit Back navigation for safe exit. Require ready preparation state before dispatching creation; backend RPC remains authority.

Evidence: 13 assignment-page tests and all 295 V7 tests pass locally on Node 24.19.0; whitespace check passes. Regressions dispatch stale enabled reload/selection buttons during a delayed authority call and verify the matching acknowledgement still appears and busy state clears. Loading/error/idle creation dispatch is denied. No schema, shared route or production changes. Browser/mobile/live-backend certification remains OPEN.
