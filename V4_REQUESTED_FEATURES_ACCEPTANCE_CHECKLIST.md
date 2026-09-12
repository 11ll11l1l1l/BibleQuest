# BibleQuest V4 Requested Features & Acceptance Checklist

Updated: 2026-09-13 JST
Purpose: release-blocking acceptance inventory for the **official post-RC1 V4 development line**.

## Authority notice

Read `V4_ACTIVE_STATUS.md` first. It is the single authority for the current branch, active phase, release readiness, and remaining blockers. Read `V4_DOCUMENTATION_AUTHORITY.md` for the repository-wide documentation hierarchy.

This checklist preserves requested behavior and exact acceptance requirements. It must **not** be used to revive an older RC1-era “feature-complete” conclusion when `V4_ACTIVE_STATUS.md` shows newer official development.

Repository evidence overrides stale chat summaries. Historical exact-SHA certifications remain valid for the bytes they tested, but later integration bytes require their own applicable verification.

## A. Core V4 product family — CERTIFIED BASELINE, MUST REMAIN GREEN

The following pre-RC1 V4 work is already certified and becomes regression-protected baseline for the post-RC1 line:

- [x] Home V4 assignment/status card with signed-out, offline/local preview, no-congregation, loading, failure, empty, one/multiple, started, due-soon, overdue and completed states.
- [x] Direct Assignments action remains available from Home.
- [x] Daily Journey remains prominent on Home.
- [x] Home horizontal shortcut rail supports touch/swipe, normal scrolling, scroll snap, mouse/trackpad, keyboard/focus, icon + text labels and 320 px+ layouts without document overflow.
- [x] High-value Home shortcuts include Daily Journey, Reader, Assignments, Calendar and Progress/Grow.
- [x] Dedicated Calendar V4 UX/presentation.
- [x] Full Assignments page/workflow V4 acceptance.
- [x] Daily Journey page-level V4 acceptance.
- [x] Progress/Grow V4 acceptance.
- [x] Home, Learn, Play, Grow and More remain a coherent modern app family.
- [x] Community, Couples, Journey Groups, Teams, Live Rooms, Recognition, Leaderboards, Media, Recordings and Encouragements retain certified V4 presentation/functionality.

Important historical evidence includes `release/v4-home-assignments`, `release/v4-home-rail`, `release/v4-calendar`, `release/v4-assignments-page`, `release/v4-daily-journey`, `release/v4-progress-grow`, `release/v4-primary-family`, and `release/v4-community-family`.

## B. Exact named user-request flows — CERTIFIED BASELINE, MUST REMAIN GREEN

### Memory Meadow / Kids Memory Match #38

- [x] Mobile: 6 pairs / 12 cards / 3 columns.
- [x] Wide: 8 pairs / 16 cards / 4 columns.
- [x] Correct-match delay: 350 ms.
- [x] Mismatch delay: 650 ms.
- [x] Input locks correctly during resolution, including stale delayed-callback protection.
- [x] Rewards remain stars + coins, with zero XP.

Historical certification: `release/v4-memory-meadow`; see `V4_MEMORY_MEADOW_CERTIFICATION.md`.

### Couples Journey

- [x] Husband-wife communication-level journey and self-assessment are implemented.
- [x] 12-item self-assessment produces a 5-level communication ladder plus domain scores.
- [x] Safety-priority routing exists for abuse/coercion/violence indicators rather than forcing ordinary “both sides” exercises.
- [x] Private local-device history remains capped.

Historical certification: `release/v4-couples-journey`; see the dedicated smoke coverage and certification records.

### Cebuano/Bisaya Reader

- [x] CEBOCB/Bisaya Reader integration remains protected through later V4 changes.
- [x] Preservation contract covers 66 books / 30,552 text records / 31,103 verse addresses / 457 preserved bridges.

See `V4_CEBOCB_READER_CERTIFICATION.md`.

## C. Protected architecture / feature owners — CERTIFIED BASELINE, MUST REMAIN GREEN

- [x] Design system and shell.
- [x] Learn and Reader.
- [x] Play / Games and Avatar Vault.
- [x] Account.
- [x] Private/cloud Notes.
- [x] Transform.
- [x] Personality/Psychometrics.
- [x] Accessibility settings.
- [x] Admin Console / Admin Operations / Content Review.
- [x] Congregation.
- [x] Diagnostics / recovery.
- [x] Ministry Hub / Workspace.
- [x] Single-owner architecture and existing service/API ownership remain protected.

The protected-page and whole-app certification records remain regression evidence; they do not replace new verification when later changes touch those surfaces.

## D. Custom artwork / visual system — CERTIFIED BASELINE, MUST REMAIN COHERENT

- [x] 160 custom assets exist across 10 themed sheets.
- [x] Transparent-background multi-asset sheets use deterministic ordering/metadata.
- [x] Position-aware extraction/canonical filenames exist under `assets/v4/...`.
- [x] Referenced custom files are guarded against broken paths.
- [x] Custom Pinoy-in-Japan visual identity is applied where it improves the product without overriding better semantic/system presentation.
- [x] Avatar Vault portraits, Home rail/tiles, Learn cards and More hub destinations have custom-art wiring.
- [x] Existing gradients/forced-colors behavior and intentional Bible World numbered progression are preserved.
- [x] Unused generated assets are not automatically release defects; use them only where they improve semantics/quality.

Historical certification: `release/v4-custom-art`, `release/v4-games-art-final`, and associated artwork tests/certifications.

## E. Whole-app polish / responsive / accessibility / PWA automated baseline

- [x] Loading, empty, error, success/completion, signed-out and offline/recovery states audited.
- [x] All maintained routes protected against document overflow at certified mobile sizes.
- [x] 320 / 360 / 390 / 412 / 430 px automated responsive coverage.
- [x] Tablet and desktop coverage.
- [x] Orientation and safe-area coverage where applicable.
- [x] Keyboard operation and focus-state coverage.
- [x] Browser accessibility-name/landmark/focus semantics coverage.
- [x] Reduced-motion coverage.
- [x] Localization/text-expansion resilience for representative English/Japanese/Cebuano surfaces.
- [x] Offline shell and reconnect recovery automated coverage.
- [ ] Installed-PWA behavior on a real Android device.
- [ ] Physical Android Chrome at 100% zoom.
- [ ] Physical Android Brave at 100% zoom.

The last three remain physical-device gates and must not be inferred from headless/browser emulation.

## F. Pre-RC1 security/privacy baseline — CERTIFIED, MUST REMAIN GREEN

Historical Section I certification established:

- [x] Authentication boundaries.
- [x] Existing RLS/security rules at that checkpoint.
- [x] Account isolation.
- [x] Multi-account isolation for Assignments.
- [x] Multi-account isolation for Groups/Teams.
- [x] Multi-account isolation for Couples.
- [x] Multi-account isolation for Live Rooms.
- [x] No duplicate state/API owners introduced by the presentation overhaul.
- [x] No production database shortcuts or weakened privacy controls.

Section I also fixed stale-account in-memory state risks in Assignments, Journey Groups, Team Center, Couples and Live Rooms. These protections remain regression requirements for the post-RC1 line.

## G. Official post-RC1 Phase 1 — Assignment privacy tightening

Current-state authority: `V4_ACTIVE_STATUS.md`.

- [x] Verify whether actual private answers/leader feedback were peer-readable before changing policy. Finding: actual answer/feedback data were already restricted; peer-visible data were response-presence metadata.
- [x] Ordinary members see only their own assignment response/presence state.
- [x] `bible_assignment_response_presence` policy requires self OR verified ministry role.
- [x] Member-facing response-review UI does not expose other-member response presence.
- [x] Ministry-role review remains available.
- [x] Static/edge contracts protect the tightened rule.
- [ ] Carry account-switching, role-demotion and cross-congregation scenarios into the integrated live verification phase.

Checkpoint: `release/v4-phase1-assignment-privacy`.

## H. Official post-RC1 Phase 2 — Admin emergency user management

- [x] Suspend account.
- [x] Reactivate account.
- [x] Force sign-out.
- [x] Owner-only temporary-password operation with self-target protection and minimum length.
- [x] Attempt immediate session revocation after applicable actions.
- [x] Audit emergency operations without logging the temporary password value.
- [x] Protect another owner from inappropriate suspension and preserve authorization boundaries.
- [x] App-side guards and static authorization contracts.
- [ ] Deploy changed `bq-admin-ops` Edge Function behavior to a safe target/test Supabase environment.
- [ ] Live-verify suspend/reactivate/force-sign-out/temp-password behavior and audit records.
- [ ] Verify session-revocation behavior against real auth sessions.
- [ ] Richer user-management/new-user-card presentation, severity tiers, typed destructive confirmation and email-change flow remain open unless explicitly removed from V4 scope.

Checkpoint: `release/v4-phase2-admin-emergency`.

## I. Official post-RC1 Phase 3 — Privacy-safe 30-minute presence

- [x] Confirmed and fixed the prior raw-row privacy weakness for ordinary members.
- [x] Restrict raw `bible_presence` SELECT to ministry roles.
- [x] Provide a scope-checked `SECURITY DEFINER` active-count aggregate.
- [x] `presence.activeCount()` fails closed for signed-out/missing-congregation/out-of-scope callers.
- [x] Home shows a privacy-safe “active in the last 30 min” aggregate state.
- [x] Reuse the existing heartbeat rather than create a second presence owner.
- [x] Repository contracts/fixtures/smokes updated.
- [ ] Deploy the new RLS/function migration to a safe target/test Supabase/Postgres environment.
- [ ] Live-verify member vs ministry-role visibility and aggregate behavior.

Checkpoint: `release/v4-phase3-presence`.

## J. Official post-RC1 Phase 4 — Leader Center

- [x] **OFFICIALLY SKIPPED by explicit user instruction.**

The Leader Center expansion is not a forgotten requirement and is not a V4 release blocker. Do not silently re-add it to the required V4 path without a new explicit scope decision.

## K. Official post-RC1 Phase 5 — Tutorial + Help Center

Status at the consolidation snapshot: **ACTIVE / STABILIZATION**.

- [x] Expand guided onboarding to 9 steps.
- [x] Cover Reader, Assignments, Play, installation and Help in the expanded tour.
- [x] Extend trainer states for the 9-step flow.
- [x] Update `TUTORIAL_STEP_COUNT` to 9.
- [x] Add an always-available Help and Tutorial Center.
- [x] Add a proper Help visual/icon.
- [x] Wire Help into More.
- [x] Wire the Help route.
- [x] Add dedicated Phase 5 contract coverage.
- [x] Correct stale smoke references from the old step count/order.
- [x] Move Daily Journey tutorial action/navigation to the correct new step.
- [ ] Run/finalize the applicable accumulated verification on the final Phase 5 head and record the exact green checkpoint.
- [ ] Update `V4_ACTIVE_STATUS.md` when Phase 5 changes from active/stabilization to closed.

Snapshot integration head at documentation rebase: `44728fc4ff543318202f76564606c1f1c4dc7ef6`. Post-RC1 Cloudflare preview deployments have succeeded, but preview deployability alone is not release certification.

## L. Integrated post-RC1 security/backend verification — RELEASE BLOCKING

Before a new RC freeze:

- [ ] Live Phase 2 Supabase Edge Function verification.
- [ ] Live Phase 3 Postgres/RLS/function verification.
- [ ] Two-account assignment isolation.
- [ ] Account switching / stale-state clearing.
- [ ] Role demotion / privilege-loss behavior.
- [ ] Cross-congregation isolation.
- [ ] Suspend/reactivate/force-sign-out behavior.
- [ ] Owner/admin authorization boundaries.
- [ ] Temporary-password flow with no secret leakage to logs/audit UI.
- [ ] Member vs ministry-role presence visibility.
- [ ] Regression of the pre-RC1 Section I isolation protections.
- [ ] Complete accumulated static/security/edge/browser/mobile suite on the final integrated head.

Static contracts do not count as live verification where the requirement specifically concerns deployed Supabase/Postgres/Edge behavior.

## M. New V4 release candidate / production gates — RELEASE BLOCKING

### RC1 historical record

RC1 remains valid **historical exact-SHA evidence only**:

- `release/v4-rc1`
- `cf58fa2e467f70f1c4a963b4ca50e33f11da9983`
- full accumulated run `34694787827` — PASS;
- Section I run `34694787800` — PASS;
- Section H run `34694787772` — PASS;
- whole-app browser audit `34694787823` — PASS;
- Cloudflare RC1 check `103560676216` — SUCCESS;
- remote RC1 staging smoke `34697229965` — PASS.

Those checks certify RC1 only. Official development continued after RC1, so PR #151 is **not the default current promotion path**.

### Required new-candidate path

- [ ] Reconcile this checklist and `V4_ACTIVE_STATUS.md` against the final official integration head.
- [ ] Freeze a new exact candidate from `v4/modern-ui-overhaul` (normally RC2 or later).
- [ ] Run build/deployment gate on that exact candidate.
- [ ] Run architecture validation on that exact candidate.
- [ ] Run complete accumulated static/security/edge regression on that exact candidate.
- [ ] Run complete browser/mobile/whole-app coverage on that exact candidate.
- [ ] Run the integrated post-RC1 account/privacy/backend matrix on that exact candidate or immutable equivalent evidence.
- [ ] Deploy the exact new candidate to Cloudflare preview/staging.
- [ ] Verify Cloudflare preview build identity matches the frozen candidate.
- [ ] Run critical-route/runtime/offline/reconnect staging smoke against that exact deployment.
- [ ] Complete installed-PWA real-device verification.
- [ ] Complete physical Android Chrome 100% verification.
- [ ] Complete physical Android Brave 100% verification.
- [x] Preserve V3 rollback reference `release/v3.71-japanese-furigana` @ `c631bea8d5177a9a2ff68139cb104b6fbf26015b` until final V4 acceptance.
- [ ] Promote only the exact newly certified candidate to `main`.
- [ ] Verify Cloudflare production serves the intended new V4 build/bytes.
- [ ] Run production browser smoke after propagation.

## Official audit conclusion

V4 is **actively developing on the post-RC1 line**. The certified pre-RC1 visual/product work remains protected baseline, while post-RC1 privacy, admin, presence and Help/Tutorial work is now part of the official V4 scope.

Current interpretation must come from `V4_ACTIVE_STATUS.md`. At this consolidation snapshot:

- Phase 1: implemented;
- Phase 2: implemented, live backend verification still owed;
- Phase 3: implemented, live database verification still owed;
- Phase 4: explicitly skipped;
- Phase 5: active/stabilizing;
- integrated post-RC1 verification: pending;
- new RC freeze/certification: pending;
- production promotion: pending.

Therefore V4 must **not** be described as currently feature-complete, currently RC1-certified, or ready for production merely because the old RC1 exact-SHA gates were green.
