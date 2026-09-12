# BibleQuest V4 Active Development Status

Updated: 2026-09-12 JST
Execution model: one serialized development stream
Active integration branch: `v4/modern-ui-overhaul`
Tracking issue: #124

Repository and CI evidence override stale chat summaries. `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` remains release-blocking.

## Current release state

BibleQuest V4 is feature-complete. RC1 has passed all applicable automated repository/browser gates **and the exact-RC Cloudflare preview/staging gate**.

- Frozen RC branch: `release/v4-rc1`
- Exact RC1 SHA: `cf58fa2e467f70f1c4a963b4ca50e33f11da9983`
- Final draft/promotion PR: #151, targeting `main`
- Automated certification: `V4_RC1_AUTOMATED_CERTIFICATION.md`
- Field/staging record: `V4_RC1_FIELD_ACCEPTANCE.md`
- PR #151 remains intentionally unmerged.

Exact-SHA RC1 automated evidence:

- Full accumulated build/architecture/static/security/edge/browser-mobile regression `34694787827` — **PASS**.
- Section I security/privacy gates `34694787800` — **PASS**.
- Section H responsive/accessibility/performance/PWA browser gates `34694787772` — **PASS**.
- Whole-app browser audit `34694787823` — **PASS**.

The accumulated RC1 regression also executes the protected-page architecture validators, static/edge contracts, and protected browser scenarios. The standalone protected-page workflow is base-branch limited to V4 integration PRs, so no duplicate standalone protected-page run is required to establish RC1 behavioral coverage.

## Exact-RC Cloudflare preview/staging — PASS

Cloudflare successfully deployed the unchanged RC1 candidate before production promotion:

- Cloudflare Pages check run `103560676216` — **SUCCESS**.
- Check head SHA: `cf58fa2e467f70f1c4a963b4ca50e33f11da9983` — exact RC1.
- Deployment id: `9748307b-66e4-44d6-857d-80aa3b7a6e42`.
- Immutable preview: `https://9748307b.mybiblequest.pages.dev`.
- Branch preview: `https://release-v4-rc1-preview.mybiblequest.pages.dev`.
- Final verification-only remote staging workflow run `34697229965`, job `103562690126` — **PASS**.

The final staging smoke used a 390x844 Chromium viewport against the deployed Cloudflare preview and passed Home, Reader, Play, Assignments, Calendar, Community, Backup, More, Account and Grow with no document-level horizontal overflow. It also passed Home rail -> Grow, More -> Backup, Memory Meadow launch/return, active service worker, offline reload, and reconnect -> Reader, with no page errors/startup-failure surface.

The verifier lives only on `verify/v4-rc1-cloudflare-smoke`; it is not part of the frozen RC. The RC1 application bytes remain unchanged.

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

Repository automation and exact-RC Cloudflare staging are green. The remaining required evidence is now strictly:

1. Installed-PWA behavior on a real Android device.
2. Physical Android Chrome at 100% zoom.
3. Physical Android Brave at 100% zoom.
4. Promotion of the exact verified V4 state to `main` only after those three field gates pass.
5. Post-promotion confirmation that Cloudflare production serves the intended V4 bytes/build identity and passes production browser smoke.

The canonical Cloudflare production target follows `main`; V4 is **not production-live yet**.

## Section H field boundary

Headless Chromium, responsive emulation and exact-RC staging now certify the web-deployable candidate, including 320/360/390/412/430 px automated coverage, tablet/desktop, orientation, safe areas, keyboard/focus, browser accessibility semantics, reduced motion, resource ceilings, service worker, offline shell and reconnect recovery.

They do **not** certify installed-PWA behavior on an actual phone or physical Chrome/Brave rendering. Those three checks remain deliberately open and must never be inferred from CI.

## Release safety rules

- Do not merge PR #151 while required physical-device evidence remains open.
- Any runtime/product-byte change to `release/v4-rc1` invalidates the exact-candidate certification and requires a new RC with complete applicable reruns.
- Do not weaken a valid test to obtain green status.
- Preserve current single-owner architecture and privacy/isolation contracts.
- Preserve the verified V3 rollback route until V4 production acceptance is complete.
- Keep preview-trigger PR #153 unmerged; it exists only to preserve access to the exact-RC Cloudflare preview for field testing.
- After promotion, verify deployment identity and production behavior rather than assuming a GitHub merge equals Cloudflare propagation.
