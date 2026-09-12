# BibleQuest V4 Official Active Status

Updated: 2026-09-13 JST
Execution model: one serialized development stream
Official active integration branch: `v4/modern-ui-overhaul`
Tracking issue: #124

## Authority

This file is the single authoritative source for current BibleQuest V4 release state. Repository branch/commit/CI/live-backend evidence overrides stale chat context. Historical files certify only their named scope/SHA.

## Current production release

BibleQuest V4 is now **LIVE IN PRODUCTION** on the authoritative Cloudflare Pages project `mybiblequest`.

- active production generation: **V4**
- frozen release candidate: `release/v4-rc3`
- exact RC3 application/release-control SHA: `7de1c53ddd33c028498b35bee77be30e56878dec`
- production promotion PR: #179 — MERGED
- resulting `main` merge SHA: `3c74d4f3600dbb05070ba57adb7c3c0b539a9aeb`
- canonical production host: `https://mybiblequest.pages.dev`
- post-main production verification workflow run: `34720411662` — PASS

The post-promotion workflow verified the exact `main` SHA was accepted by `Cloudflare Pages: mybiblequest`, confirmed canonical host readiness, passed deployed critical-route/state smoke, and passed deployed PWA offline/recovery smoke.

The older V3 line is no longer the active production generation. Preserve it only as the rollback reference until V4 has sufficient operating history.

## RC3 automated release evidence

The final RC3 candidate passed the required automated release path before promotion:

- accumulated regression run `34720222819` — PASS
- V4 Section H responsive/accessibility/performance/PWA run `34720222893` — PASS
- V4 Section I security/privacy run `34720222877` — PASS
- protected-page audit run `34720222888` — PASS
- whole-app browser audit run `34720223416` — PASS
- Phase 6 owner-waiver evidence validator run `34720222829` — PASS
- Cloudflare exact-candidate preview smoke run `34720222846` — PASS

Earlier duplicate exact-head runs also passed. No automated release/security/privacy failure was waived.

## Videos merge included in production

The current production V4 includes the user-requested consolidation of Live Recordings and Media Library into one Videos experience.

- Live Recordings and Media Library no longer compete as duplicate user-facing routes for the same underlying content.
- The Videos experience uses the existing single-player media ownership model rather than multiple always-live embeds.
- Leaders/pastors/admins can curate/add videos through the supported form and existing authorization/RLS path.
- Raw database/RLS error text is not surfaced to users by this feature.
- `src/app/media-library.js` and `src/features/media-library/index.js` remain as certified/tested architectural files with no live route currently using them; cleanup is optional post-release work and is not a production blocker.

## Product-owner release decision and Phase 6 disposition

On 2026-09-13 the product owner explicitly directed that remaining tasks requiring personal/manual field execution be removed as pre-publication blockers. The decision is recorded in `V4_RELEASE_OWNER_WAIVER.md`.

The Phase 6 manual field gates remain **OWNER-WAIVED for this release**, not PASS:

- Gate A — authenticated emergency-action matrix: WAIVED
- Gate B — browser account switching / stale-state clearing: WAIVED
- Gate C — true cross-congregation field isolation: WAIVED
- Gate D — physical Android Chrome at 100% zoom: WAIVED
- Gate E — physical Android Brave at 100% zoom: WAIVED
- Gate F — genuinely installed Android PWA acceptance: WAIVED
- Gate G — linked-activity multi-account field validation: WAIVED

`WAIVED` must never be represented as field-tested. The procedures remain available for post-release validation/regression work.

The previously requested server-side `main` branch-protection/ruleset setup is also owner-waived as a pre-publication blocker for this release. Production promotion still used the normal PR path and completed the automated gates.

## Phase state

- Phase 1 — Assignment privacy tightening: IMPLEMENTED / LIVE RLS VERIFIED.
- Phase 2 — Admin emergency user management: IMPLEMENTED / DEPLOYED; Admin Console access manually confirmed working; remaining manual destructive/recovery/session matrix owner-waived.
- Phase 3 — Privacy-safe 30-minute presence: IMPLEMENTED / LIVE VERIFIED.
- Phase 4 — Leader Center: OFFICIALLY SKIPPED by product-owner instruction.
- Phase 5 — Tutorial + Help Center: CLOSED / ACCUMULATED GREEN.
- Phase 6 — Integrated verification: AUTOMATED/LIVE SUPPORTING EVIDENCE GREEN; manual Gates A-G OWNER-WAIVED.
- Phase 7 — RC convergence and production promotion: **COMPLETE**.

## Current release status

V4 is **production-published and active on Cloudflare**. There are no remaining pre-publication tasks assigned to the product owner.

Future work is post-release only unless a newly discovered defect is release-critical. Automated security/privacy/RLS/authentication/authorization protections remain mandatory and must not be weakened because of the manual-field waiver.

The legacy/secondary Cloudflare project/check named `biblequest` is not the V4 release authority. `mybiblequest` remains authoritative.

## Rollback reference

Preserve until V4 post-release confidence is sufficient:

- branch: `release/v3.71-japanese-furigana`
- SHA: `c631bea8d5177a9a2ff68139cb104b6fbf26015b`

## Development safety rules

- Keep one serialized integration stream.
- Repository/CI/live-environment evidence overrides stale summaries.
- Never fabricate field evidence; use `waived` when an explicit product-owner waiver applies.
- Do not weaken automated security/privacy/authorization checks to obtain green status.
- Preserve single-owner architecture and privacy/isolation contracts.
- Historical checkpoint documents certify only their exact scope/SHA.
- Any later document using `current`, `release-ready`, `final candidate`, `production`, or `remaining blockers` must defer to this file.
- When production identity, blockers, scope, or release candidate materially changes, update this file in the same serialized stream.
