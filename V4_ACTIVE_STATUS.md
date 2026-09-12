## Phase 3 — 30-minute presence indicator on Home

Checkpoint: `release/v4-phase3-presence`, exact-SHA verified, full accumulated suite green (including full browser/mobile).

**Real privacy finding, verified before writing code:** the existing `bible_presence` RLS policy let any authenticated congregation member read every raw presence row - other members' `user_id` included - not just a count. Same class of "member list exposed to compute an aggregate in JS" problem the governing plan warned against, confirmed directly from the migration SQL.

**Implemented:**
- Migration tightens raw `bible_presence` SELECT to ministry roles only (Leader Center); adds `public.bible_presence_active_count(congregation_id, window_minutes=30)`, a `SECURITY DEFINER` function that checks congregation membership server-side and returns only an integer count, window clamped to 1-1440 minutes.
- `presence.activeCount()` app-service method: fails closed (`null`) for signed-out, missing-congregation, or out-of-scope callers, without ever hitting the API boundary in those cases.
- Home's existing Congregation card now shows "● N active in the last 30 min" (or "No recent activity." / hidden, per state), reusing `presence`'s already-running heartbeat rather than starting a second presence system.

**Two real bugs my own tests caught:**
1. Adding the new required `api.activeCount` broke 4 existing presence-edge fixtures and 1 smoke fixture that construct the service without it - found and fixed all 5.
2. A prior tranche had byte-locked `bootstrap.js` in its entirety. This is the **second time** this exact class of over-broad lock has blocked a legitimate change (first was Congregation Recognition's icon fix). `bootstrap.js` is the shared composition root and *must* change whenever a new service is wired into an existing route - locking it byte-for-byte is fighting the architecture, not protecting it. Replaced with a structural check (the five primary routes must still map to the right page factories) that actually catches what the original lock was trying to prevent (a duplicated/replaced shell) without blocking normal service wiring.

**Same honest limitation as Phases 1-2:** the RLS policy and `SECURITY DEFINER` function have never executed against real Postgres. Static contract test locks in the authorization logic; live deployment verification is still owed.

**Not done from Phase 3's full scope:** the Leader Center's own richer presence view (names + timestamps for ministry roles) - the raw-row RLS now correctly allows this, but no UI consumes it yet. That's naturally Phase 4 (Leader Center) work, not duplicated here.

## Phase 2 — Admin emergency user management

Checkpoint: `release/v4-phase2-admin-emergency`, exact-SHA verified, full accumulated suite green.

**Reused existing infrastructure rather than duplicating it**, once found: `bible_app_access.active` was already the exact suspend/reactivate flag needed (no new migration required); `bible_admin_audit_log` already existed with the right shape; `supabase/functions/bq-admin-ops` already had the owner-only, audited `delete_user` action to extend rather than a new function to build.

**Added, all inside `bq-admin-ops`:**
- `suspend_account` / `reactivate_account` - owner or admin, mutual self-action block, another owner is immune to suspension (mirroring the existing delete-owner-immunity rule), suspension immediately attempts session revocation, both actions audited.
- `force_sign_out` - any owner/admin, audited.
- `set_temp_password` - **owner-only**, 12-character minimum enforced server-side, owner cannot target their own account, calls `auth.admin.updateUserById`, immediately attempts session revocation, the password value itself is never written to the audit log (only that the action happened).
- New `forceSignOutUser()` helper using the documented GoTrue admin REST endpoint (`POST /auth/v1/admin/users/{id}/logout`), since supabase-js v2's `auth.admin.signOut()` takes a JWT, not a user id, and can't target an arbitrary other user.

**Real bug caught by my own test before it shipped:** `setTempPassword`'s owner-only check ran before its ready/authorized check, so a signed-out/unauthorized call returned the wrong error code (`OWNER_REQUIRED` instead of `NOT_READY`) - fixed the check order.

**Honest limitation:** the Edge Function is TypeScript/Deno - I cannot execute or deploy it from this environment, so it has never actually run against live Supabase. I wrote a static contract test locking in every authorization/audit invariant (owner-gating, self-action blocks, no-password-in-audit-log, the specific REST endpoint used) as the closest available proof, but **real deployment + live verification against a test Supabase project is still owed** before this can be trusted in production. The app-layer (`admin-operations.js`) and its guards are fully tested and verified, since that part runs in Node/the browser where I can actually execute it.

**Not done from Phase 2's full scope:** the new-user-card UI (identity/congregation/security sections), the three severity-tier UI treatment, typed-confirmation for destructive actions, and email-change. Those are presentation-layer work on top of this now-real backend capability - a natural next tranche once someone has verified the Edge Function actually works live.

## Phase 1 — Assignment privacy tightening (self-only for members)

**Verification finding, before any code changed:** the alarming "Member B can read Member A's private answer" scenario proposed in the new governing plan was checked directly against the live migrations, not assumed true. `bible_assignment_progress` (the table holding actual answer text + leader_feedback) was already correctly restricted by RLS to the author plus verified ministry roles (facilitator/leader/pastor/admin), and the client already gated the private-answer render block behind the same role check. **No confirmed leak of actual answer content or leader feedback exists or existed.**

What genuinely was peer-visible to ordinary members, exactly as the governing plan itself described: other members' display name + "Completed" + completion date, via `bible_assignment_response_presence` (a table with no answer/feedback columns at all). This was intentional prior design, not a bypass.

**Implemented as a real, deliberate tightening per the new requirement** ("ordinary members see only their own assignment state; nothing about other members' responses"):
- Checkpoint: `release/v4-phase1-assignment-privacy`, exact-SHA verified, full accumulated suite green.
- New migration `20260912090000_assignment_presence_self_only.sql`: RLS on `bible_assignment_response_presence` now requires `user_id = auth.uid()` OR a verified ministry role in that assignment's congregation. Ordinary members can no longer see any other member's presence row.
- `src/features/assignments/index.js`: `responseReviewView` now returns nothing at all for members (`if(!readOnly)return ''`) — no names, no completion count, no error state, nothing. Section renamed "Member Responses" and clearly scoped to ministry roles only. Privacy-boundary disclosure text rewritten to accurately describe the new self-only contract.
- 3 tests added/updated: a new edge test proving members get an empty view in every review state (idle/loading/error/ready), a new RLS static contract locking the policy text, and 2 pre-existing tests updated where they asserted the now-superseded peer-visible wording (found via running the *complete* registered edge/smoke suite locally before each gate attempt, not a partial spot-check - this caught both stale-assertion regressions before they reached a wasted CI run... one still slipped through to a live gate once and was fixed from the CI failure directly).

**Not yet done from the full 7-phase plan:** Phase 0's two-account live reproduction test (moot given the verification finding above, but the account-switching/role-demotion/cross-congregation security test matrix from Phase 1's own requirements list is still owed as dedicated test coverage beyond what's implemented here). Phases 2-7 (Admin emergency console, 30-minute presence indicator, full Leader Center, Tutorial/Help rewrite, integrated test matrix, RC2 release) are not started.

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
