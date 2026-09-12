# BibleQuest V4 Official Active Status

Updated: 2026-09-13 JST
Execution model: one serialized development stream
Official active integration branch: `v4/modern-ui-overhaul`
Tracking issue: #124

## Authority and reading rule

**This file is the single authoritative source for the current BibleQuest V4 development status, current phase state, current release path, and current blockers.**

Before selecting or evaluating any V4 work, the manual captain, ChatGPT development chat, agent, reviewer, or release operator must read this file first, then `V4_DOCUMENTATION_AUTHORITY.md`, then the release-blocking acceptance checklist as needed.

If another V4 document, old release record, pull request, issue comment, chat summary, or earlier checkpoint conflicts with this file about **what is current**, this file wins unless a later repository commit on the official integration line explicitly updates the authority chain.

Repository branch/commit/CI evidence overrides stale chat context. Historical certification documents remain valid evidence for the exact SHA they certified, but they do not automatically certify later application bytes.

Consolidation snapshot:

- branch: `v4/modern-ui-overhaul`
- head when rebased: `44728fc4ff543318202f76564606c1f1c4dc7ef6`
- active work: stabilization of the expanded 9-step Tutorial/Help flow and its browser/smoke coverage.

The branch may advance after this snapshot. The live branch head is always the current implementation state; update this file in the same development stream whenever phase status, release readiness, scope, or blockers materially change.

## Official release-state decision

The earlier frozen V4 RC1 is now a **historical certified checkpoint only**:

- branch: `release/v4-rc1`
- exact SHA: `cf58fa2e467f70f1c4a963b4ca50e33f11da9983`
- PR #151

RC1 passed its applicable automated and Cloudflare staging gates, but it is **not the current V4 release candidate** because official V4 development continued after that freeze.

Therefore:

- do not infer current V4 release readiness from RC1 certification;
- do not merge PR #151 as the current promotion path unless the user explicitly abandons the post-RC1 program and returns to RC1;
- post-RC1 runtime/product changes require a new exact candidate and new applicable certification;
- the next production candidate is expected to be a new RC (normally RC2 or later) frozen from the official integration line after the program below is complete and verified.

## Official post-RC1 development program

### Phase 1 — Assignment privacy tightening — IMPLEMENTED / REPOSITORY-VERIFIED

Checkpoint: `release/v4-phase1-assignment-privacy`.

Verified before implementation: actual answer text and leader feedback in `bible_assignment_progress` were already author/ministry-role restricted. Peer-visible data were response-presence metadata rather than private answer text.

Implemented:

- ordinary members see only their own assignment response/presence state;
- `bible_assignment_response_presence` RLS requires self OR a verified ministry role in the assignment congregation;
- member response-review UI exposes nothing about other members;
- ministry-role review remains available;
- dedicated static/edge coverage protects the tighter contract.

Account-switching, role-demotion and cross-congregation live/integrated scenarios remain part of the later integrated verification phase.

### Phase 2 — Admin emergency user management — IMPLEMENTED / LIVE BACKEND VERIFICATION OWED

Checkpoint: `release/v4-phase2-admin-emergency`.

Implemented by extending existing infrastructure:

- suspend/reactivate account;
- force sign-out;
- owner-only temporary-password action with minimum length and self-target protection;
- session-revocation attempts;
- owner protection rules;
- audit logging without storing the temporary password value;
- app-side authorization/guard behavior and static authorization contracts.

Release limitation: changed Supabase/Deno Edge Function behavior still requires real deployment and live execution against a safe target/test Supabase environment. Static contracts are not a substitute for that live verification.

Presentation follow-ons remain open unless explicitly removed from scope: richer user-management/new-user-card organization, severity-tier treatment, typed confirmation for destructive actions, and email-change handling.

### Phase 3 — Privacy-safe 30-minute presence indicator — IMPLEMENTED / LIVE DATABASE VERIFICATION OWED

Checkpoint: `release/v4-phase3-presence`.

A real privacy weakness was found: ordinary authenticated congregation members could read raw `bible_presence` rows, including other members' user IDs, to derive presence in client code.

Implemented:

- raw `bible_presence` SELECT tightened to ministry roles;
- `public.bible_presence_active_count(congregation_id, window_minutes=30)` provides a scope-checked `SECURITY DEFINER` integer aggregate;
- `presence.activeCount()` fails closed for signed-out, missing-congregation or out-of-scope callers;
- Home shows a privacy-safe recent-active count without exposing the underlying member list;
- the existing heartbeat is reused rather than duplicated;
- repository contracts and smoke fixtures were updated and verified.

Release limitation: the new RLS/function behavior still needs real Postgres/Supabase deployment and live verification.

### Phase 4 — Leader Center — OFFICIALLY SKIPPED

The Leader Center expansion (Overview, People, assignment review, Groups, Activity dashboards and richer ministry presence UI) is **explicitly and officially skipped by user instruction**.

This is a deliberate scope decision, not forgotten work and not a release blocker. If resumed in a later version, it should build on the completed Phase 1 response-review boundary and Phase 3 ministry-role presence boundary.

### Phase 5 — Tutorial + Help Center — ACTIVE / STABILIZATION

This is the current active post-RC1 development tranche at the consolidation snapshot.

Implemented on the official integration line:

- guided onboarding expanded to a 9-step tour;
- broader core flow covers Reader, Assignments, Play, installation and Help;
- trainer states extended for the 9-step tour;
- `TUTORIAL_STEP_COUNT` updated to 9;
- always-available Help and Tutorial Center added;
- Help visual/icon added to More;
- Help Center entry point and route wired;
- dedicated Phase 5 contract coverage registered;
- stale smoke assumptions about the old step count/order are being corrected;
- Daily Journey action/navigation moved to the correct new tutorial step.

The post-RC1 Help/Tutorial line has produced successful Cloudflare preview deployments, which proves deployability of tested snapshots, **not full RC certification**.

Phase 5 remains stabilization work until the applicable accumulated tests and intended acceptance behavior are green on the final Phase 5 head and a checkpoint is recorded.

### Phase 6 — Integrated security/backend/role-transition verification — NEXT RELEASE-BLOCKING VERIFICATION

After Phase 5 stabilization, execute the post-RC1 verification matrix, including where technically applicable:

- deploy and live-test Phase 2 admin Edge Function changes;
- deploy and live-test Phase 3 RLS/`SECURITY DEFINER` presence aggregate;
- two-account assignment isolation;
- account switching with stale client state cleared;
- role demotion / privilege-loss behavior;
- cross-congregation isolation;
- suspended/reactivated/forced-sign-out behavior;
- owner/admin authorization boundaries;
- temporary-password flow without secret leakage into logs/audit surfaces;
- presence aggregate visibility for member vs ministry roles;
- regression of existing Section I account-isolation protections;
- complete accumulated static/security/edge/browser/mobile suite on the integrated head.

Do not mark this phase complete from static source inspection alone when a requirement specifically concerns live Supabase/Postgres/Edge behavior.

### Phase 7 — New release-candidate convergence and V4 release — PENDING

Once the official post-RC1 scope and Phase 6 verification are closed:

1. reconcile `V4_ACTIVE_STATUS.md` and `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` against the actual integration head;
2. freeze a **new exact V4 candidate** from `v4/modern-ui-overhaul` (normally RC2 or later);
3. run complete applicable build, architecture, static, security, edge, browser/mobile, accessibility/PWA and whole-app gates on that exact SHA;
4. deploy that exact candidate to Cloudflare preview/staging and verify deployment identity plus critical runtime behavior;
5. complete still-required physical-device gates unless explicitly changed: installed PWA on real Android, Android Chrome at 100% zoom, Android Brave at 100% zoom;
6. promote only that exact verified new candidate to `main`;
7. independently verify Cloudflare production build identity/bytes and production browser behavior;
8. keep the known-good V3 rollback reference until post-promotion acceptance is complete.

## Current status summary

- V4 development is **active**, not frozen at RC1.
- Phase 1: implemented; integrated role/account-transition scenarios still feed Phase 6.
- Phase 2: implemented; live Supabase verification and listed presentation follow-ons remain.
- Phase 3: implemented; live database/RLS verification remains.
- Phase 4: intentionally skipped.
- Phase 5: active/stabilizing.
- Phase 6 live/integrated verification: pending.
- New RC freeze and exact-SHA recertification: pending.
- Production promotion: pending.
- V4 is **not production-live and not currently release-certified at the active integration head**.

## Historical RC1 evidence — preserved, not current

- full accumulated RC1 regression `34694787827` — PASS;
- Section I RC1 security/privacy `34694787800` — PASS;
- Section H RC1 responsive/accessibility/performance/PWA automation `34694787772` — PASS;
- RC1 whole-app browser audit `34694787823` — PASS;
- Cloudflare exact-RC1 deployment check `103560676216` — SUCCESS;
- remote RC1 staging smoke `34697229965` — PASS.

These certify RC1 only. They do not certify post-RC1 integration bytes.

## Rollback reference

Preserve until the final post-RC release is accepted:

- `release/v3.71-japanese-furigana`
- `c631bea8d5177a9a2ff68139cb104b6fbf26015b`

## Development safety rules

- Keep one serialized integration stream; avoid concurrent uncoordinated runtime ownership changes.
- Repository evidence overrides stale chat summaries.
- Do not weaken a valid test to obtain green status.
- Preserve single-owner architecture and privacy/isolation contracts.
- Treat historical checkpoint documents as evidence for their exact scope/SHA, not global current status.
- Any document using “current”, “feature-complete”, “release-ready”, “final candidate”, or “remaining blockers” must defer to this file for current V4 meaning.
- When a phase materially advances, update this file in the same development stream so an older release narrative cannot again masquerade as current status.
