# BibleQuest V4 Active Development Status

Updated: 2026-09-12 JST
Execution model: one serialized development stream
Active integration branch: `v4/modern-ui-overhaul`
Tracking issue: #124

Repository and CI evidence override stale chat summaries. `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` remains release-blocking.

## Current release state

BibleQuest V4 is feature-complete and the first final release candidate has passed all applicable automated repository/browser gates.

- Frozen RC branch: `release/v4-rc1`
- Exact RC1 SHA: `cf58fa2e467f70f1c4a963b4ca50e33f11da9983`
- Final draft/promotion PR: #151, targeting `main`
- Automated certification: `V4_RC1_AUTOMATED_CERTIFICATION.md`
- PR #151 remains intentionally unmerged.

Exact-SHA RC1 evidence:

- Full accumulated build/architecture/static/security/edge/browser-mobile regression `34694787827` — **PASS**.
- Section I security/privacy gates `34694787800` — **PASS**.
- Section H responsive/accessibility/performance/PWA browser gates `34694787772` — **PASS**.
- Whole-app browser audit `34694787823` — **PASS**.

The accumulated RC1 regression also executes the protected-page architecture validators, static/edge contracts, and protected browser scenarios. The standalone protected-page workflow is base-branch limited to V4 integration PRs, so no duplicate standalone protected-page run is required to establish RC1 behavioral coverage.

## Product/security checkpoints preserved

Important certified checkpoints remain available:

- Primary Home/Learn/Play/Grow/More family: `release/v4-primary-family`
- Couples Journey communication-level/self-assessment: `release/v4-couples-journey`
- Custom artwork program: `release/v4-custom-art`
- Final Games artwork cleanup: `release/v4-games-art-final`
- Whole-app browser/polish audit: `release/v4-whole-app-browser-audit`
- Section H automated release gates: `release/v4-section-h`
- Section I security/privacy/multi-account gates: `release/v4-section-i` @ `9f8c530668b2d9cbaa0cca226750fe9278f0a24f`

Section I closed real stale-account state risks in Assignments, Journey Groups, Team Center, Couples and Live Rooms without changing Supabase schema, RLS policy, Edge Functions, production-data contracts, or canonical API/service ownership. See `V4_SECTION_I_SECURITY_PRIVACY_CERTIFICATION.md`.

No additional product feature tranche is required by `DEVELOPMENT_PLAN_V4.md`, issue #124, or the requested-feature checklist before release consideration.

## Rollback reference

The verified V3 rollback remains preserved and must remain available until post-promotion V4 acceptance is complete:

- `release/v3.71-japanese-furigana`
- `c631bea8d5177a9a2ff68139cb104b6fbf26015b`

## Remaining release blockers

Automated RC1 certification does not authorize production promotion by itself. The remaining required evidence is:

1. Preview/staging smoke against the intended exact RC1 deployment or an equivalent exact-candidate environment.
2. Installed-PWA behavior on a real device.
3. Physical Android Chrome at 100% zoom.
4. Physical Android Brave at 100% zoom.
5. Promotion of the exact verified V4 state to `main` only after the preceding gates are satisfied.
6. Post-promotion confirmation that Cloudflare production serves the intended V4 bytes/build identity and passes production browser smoke.

The canonical Cloudflare production target follows `main`; the currently deployed production site therefore cannot be counted as RC1 preview evidence before promotion.

## Section H field boundary

Headless Chromium and responsive emulation already certify 320/360/390/412/430 px, tablet/desktop, orientation, safe areas, keyboard/focus, browser accessibility semantics, reduced motion, resource ceilings, offline shell and reconnect recovery.

They do **not** certify the three physical-device checks above. Those remain deliberately open and must never be inferred from CI.

## Release safety rules

- Do not merge PR #151 while preview/staging or required physical-device evidence remains open.
- Any runtime/product-byte change to `release/v4-rc1` invalidates the exact-candidate certification and requires a new RC with complete applicable reruns.
- Do not weaken a valid test to obtain green status.
- Preserve current single-owner architecture and privacy/isolation contracts.
- Preserve the verified V3 rollback route until V4 production acceptance is complete.
- After promotion, verify deployment identity and production behavior rather than assuming a GitHub merge equals Cloudflare propagation.