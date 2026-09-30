# V6 built-output browser acceptance evidence

Target checklist row: `Whole-app/protected-route/browser gates run against built output.`

Evidence class: BUILT-BROWSER.

Merged PR #839 exact head: `6bc69f477826f559e2a0bf5c8154a34d1c0bb29d`.

V6 Phase-1 workflow run: `36665434001`; build job: `109728980506`; conclusion: success.

The successful job sequence built V6 with exact commit identity before starting the built artifact preview. It then completed built-artifact Chromium parity, authenticated Assignments deep-link hydration, the built Leader Center Member/Leader/Pastor/Admin matrix, built PWA acceptance, and Reader accessibility/mobile acceptance.

This evidence is sufficient for the built-output browser-gate row only. It does not establish DEPLOYED Cloudflare exact-SHA identity or PHYSICAL-DEVICE PWA/push evidence.

A previous reconciliation candidate exists at `969f289da22c47a2f5bb5e7f4e1b7728089b6824`, but its branch diverged from current integration. The Integration Captain should reconcile the checklist/status change onto current integration rather than blindly merging stale documentation.
