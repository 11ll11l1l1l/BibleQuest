# Lane A — inherited unit-command contract reconciliation

The broader test pass after pairing/Reader integration found an inherited policy assertion expecting `npm run unit` to run only V6. The existing integration package script already includes V7. Update only that stale test contract and require the exact V6 and V7 suite commands independently; no runtime, package or workflow changes.

Verification: `npm run unit` passes all 880 V6 and 282 V7 tests on Node 24.19.0. Diff whitespace passes. Automatically integrate after the pairing-route batch; refresh onto its live merge before publishing. Remaining real-browser/live-backend/content acceptance gates are unchanged.

Refreshed onto `6be271c50d3981c18188c1f00ebf8ab5471cbb1f`, following pairing/navigation PR #1212 (`87174c2e`) and completed Lane D localization fallback PR #1207. Combined V7 tests include the fallback regression. Pairing exact-head CI run 37272154341 passed pinned build, Chromium, PWA and automated accessibility. Canonical development status records the integration and distinguishes regression evidence from live journey acceptance.
