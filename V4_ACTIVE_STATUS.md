# BibleQuest V4 Active Development Status

Updated: 2026-09-12 JST
Execution model: one serialized development stream
Active branch: `v4/modern-ui-overhaul`
Tracking issue: #124

Repository and CI evidence override stale chat summaries. `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` remains release-blocking and must agree with this file before final RC freeze.

## Current repository state

Section I has been integrated into the active V4 line.

- Exact fully tested Section I runtime candidate: `9f8c530668b2d9cbaa0cca226750fe9278f0a24f`
- Preserved checkpoint: `release/v4-section-i`
- Full accumulated regression: `34693803229` — PASS
- Dedicated Section I security/privacy run: `34693803309` — PASS
- Section H run on the same exact candidate: `34693803249` — PASS
- Whole-app browser audit on the same exact candidate: `34693803222` — PASS
- Protected-page audit on the same exact candidate: `34693802698` — PASS
- Integration PR: #149
- Integration merge commit: `87ffdf439f21438afe8402b0c6502c276cd0dc37`
- Certification: `V4_SECTION_I_SECURITY_PRIVACY_CERTIFICATION.md`

Documentation-only commits after a certified runtime SHA do not create a new runtime/product identity. They still must be included in the final RC exact-SHA verification so the release candidate is one immutable commit.

## Completed release tranches

The requested V4 product/UX implementation queue is closed through the automated release-gate stages. Important current checkpoints include:

- Primary Home/Learn/Play/Grow/More family: `release/v4-primary-family`
- Couples Journey communication-level/self-assessment: `release/v4-couples-journey`
- CEBOCB Reader preservation: certified and guarded
- Protected-page audit: certified
- Custom artwork program: `release/v4-custom-art`
- Final Games artwork cleanup: `release/v4-games-art-final`
- Whole-app browser/polish audit: `release/v4-whole-app-browser-audit`
- Section H automated responsive/accessibility/performance/PWA gates: `release/v4-section-h`
- Section I security/privacy/multi-account gates: `release/v4-section-i`

No additional feature tranche is currently required by `DEVELOPMENT_PLAN_V4.md`, issue #124, or the requested-feature checklist before final RC convergence.

## Section H field checks intentionally still open

Headless/browser CI does not count as physical-device proof. These remain release evidence to collect before production promotion:

1. Installed-PWA behavior on a real device.
2. Physical Android Chrome at 100% zoom.
3. Physical Android Brave at 100% zoom.

Automated Section H coverage for 320/360/390/412/430 px, tablet, desktop, orientation, safe areas, keyboard/focus, browser accessibility semantics, reduced motion, resource ceilings, offline shell and reconnect recovery is already certified by `V4_SECTION_H_CERTIFICATION.md`.

## Section I result

Section I is complete as an automated security/privacy gate. The final exact candidate proved account isolation and stale-account invalidation for Assignments, Journey Groups, Team Center, Couples and Live Rooms while preserving existing auth/RLS/API ownership.

No Supabase schema, migration, RLS policy, Edge Function, production-data contract or service owner was replaced. See `V4_SECTION_I_SECURITY_PRIVACY_CERTIFICATION.md`.

## Remaining serialized release queue

Proceed in this order unless new repository evidence exposes a higher-severity blocker:

1. Reconcile `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` against this status, `DEVELOPMENT_PLAN_V4.md`, and issue #124.
2. Close obsolete V4 verification/draft PRs that are superseded by certified checkpoints; do not merge them into the RC.
3. Confirm no unmerged runtime branch contains required V4 product work.
4. Cut one final V4 RC branch/commit from the reconciled active V4 line.
5. Run build, architecture, complete accumulated static/security/edge, browser/mobile, Section H, Section I, whole-app, protected-page, Home acceptance and all applicable changed-feature gates against that unchanged exact SHA.
6. Perform preview/staging smoke against the exact RC.
7. Collect the three real-device/installed-PWA field checks above.
8. Promote only after exact-candidate evidence is green, while preserving the verified V3 rollback reference.
9. After promotion, verify production bytes/build identity and production browser behavior before declaring V4 accepted.

## Release safety rules

- Do not merge V4 to `main` merely because a subset of workflows is green.
- Do not weaken a valid test to obtain green status.
- Preserve current single-owner architecture and privacy/isolation contracts.
- Physical-device evidence must never be inferred from headless Chromium or responsive emulation.
- Preserve the verified V3 rollback route until post-promotion V4 acceptance is complete.
- Repository evidence overrides stale documentation; when documentation drifts, reconcile it before RC freeze.