# BibleQuest V4 Official Active Status

Updated: 2026-09-13 JST
Execution model: one serialized development stream
Official active integration branch: `v4/modern-ui-overhaul`
Tracking issue: #124

## Authority

This file is the single authoritative source for current BibleQuest V4 release state. Repository branch/commit/CI/live-backend evidence overrides stale chat context. Historical files certify only their named scope/SHA.

## Current production release

BibleQuest V4 RC3 is **PROMOTED TO PRODUCTION / AUTOMATED POST-PROMOTION ACCEPTANCE GREEN**.

Production promotion identity:

- frozen RC branch: `release/v4-rc3`
- exact RC application SHA: `7de1c53ddd33c028498b35bee77be30e56878dec`
- promotion PR: #179 — `release(v4): promote RC3 Videos update to production`
- production merge SHA: `3c74d4f3600dbb05070ba57adb7c3c0b539a9aeb`
- authoritative Cloudflare project: `mybiblequest`
- canonical production host: `https://mybiblequest.pages.dev`

The exact RC3 candidate passed all applicable automated promotion gates before merge:

- accumulated regression run `34720118393` — PASS
- V4 Section H responsive/accessibility/performance/PWA run `34720118381` — PASS
- V4 Section I security/privacy run `34720118364` — PASS
- V4 protected-page audit run `34720118382` — PASS
- V4 whole-app browser audit run `34720118387` — PASS
- V4 Phase 6 field-evidence release validator run `34720118344` — PASS under the recorded owner-waiver semantics
- Cloudflare exact-SHA preview smoke run `34720118302` — PASS

Post-promotion production acceptance also passed:

- authoritative `Cloudflare Pages: mybiblequest` check `103625153154` — SUCCESS for exact production merge SHA `3c74d4f3600dbb05070ba57adb7c3c0b539a9aeb`
- canonical production smoke run `34720411662` — PASS
- production smoke covered exact-SHA deployment identity, host readiness, maintained critical/deep routes and browser-state handling, PWA install behavior, offline shell behavior, and operational recovery

The legacy `Cloudflare Pages: biblequest` project is not V4 release authority.

## RC3 scope note: Videos consolidation

RC3 includes the post-RC2 Videos consolidation. Live Recordings and Media Library were two routes rendering the same underlying congregation media and are now presented through one Videos experience.

Leaders/pastors/admins can curate videos through the Videos page. Authorization remains server-side: `bible_media_library` RLS requires `created_by = auth.uid()` and `private.bible_can_review_content(congregation_id)` for inserts, while updates are also gated by `private.bible_can_review_content(congregation_id)`. The UI does not treat form visibility as authorization and does not surface raw database/RLS errors to users.

Playback remains under the existing single Audio owner. The implementation uses one selected-player instance rather than one persistent iframe per video.

`src/app/media-library.js` / `src/features/media-library/index.js` remain as a certified, still-tested architectural owner with no current live route using them. Removing that dead owner is a post-release cleanup item only and is not part of the RC3 production acceptance scope.

## Product-owner release decision

On 2026-09-13 the product owner explicitly directed that remaining tasks requiring personal/manual field execution be removed as pre-publication blockers so V4 could proceed to publication. This decision is recorded in `V4_RELEASE_OWNER_WAIVER.md`.

The Phase 6 manual field gates A-G are therefore **OWNER-WAIVED for this release**. `WAIVED` is not `PASS` and must never be represented as field evidence. The detailed field procedures remain available for optional post-release validation and later regression work.

The previously required server-side `main` branch-protection/ruleset setup is also **OWNER-WAIVED as a pre-publication blocker** for this release. Promotion still used the normal PR path and the full available automated release gates.

## Phase state

- Phase 1 — Assignment privacy tightening: IMPLEMENTED / LIVE RLS VERIFIED.
- Phase 2 — Admin emergency user management: IMPLEMENTED / DEPLOYED. Admin Console access was manually confirmed working by the product owner; the remaining destructive/recovery/session matrix is owner-waived for this release.
- Phase 3 — Privacy-safe 30-minute presence: IMPLEMENTED / LIVE VERIFIED.
- Phase 4 — Leader Center: OFFICIALLY SKIPPED by product-owner instruction.
- Phase 5 — Tutorial + Help Center: CLOSED / ACCUMULATED GREEN.
- Phase 6 — Integrated verification: AUTOMATED/LIVE SUPPORTING EVIDENCE GREEN; manual Gates A-G OWNER-WAIVED for this release.
- Phase 7 — RC convergence and production promotion: COMPLETE / RC3 PROMOTED / AUTOMATED PRODUCTION ACCEPTANCE GREEN.

## Phase 6 gate disposition

`V4_PHASE6_FIELD_EVIDENCE.json` is the machine-readable release manifest. For this owner-directed release:

- Gate A — authenticated emergency-action matrix: OWNER-WAIVED
- Gate B — browser account switching / stale-state clearing: OWNER-WAIVED
- Gate C — true cross-congregation field isolation: OWNER-WAIVED
- Gate D — physical Android Chrome at 100% zoom: OWNER-WAIVED
- Gate E — physical Android Brave at 100% zoom: OWNER-WAIVED
- Gate F — genuinely installed Android PWA acceptance: OWNER-WAIVED
- Gate G — linked-activity multi-account field validation: OWNER-WAIVED

No waived gate may be retroactively described as field-tested unless it is genuinely executed and the evidence manifest is updated.

## Current release readiness

V4 is **RELEASED TO PRODUCTION** on the authoritative Cloudflare `mybiblequest` project with automated post-promotion acceptance green.

There is no remaining pre-publication blocker for RC3. Any subsequent work is post-release maintenance, cleanup, hardening, or new development and must start from the accepted production state rather than reopening RC3 history.

## Security / backend note

Existing automated and live security/privacy evidence remains mandatory. The owner waiver does not authorize weakening RLS, authentication, authorization, audit-secret hygiene, or automated security checks. Any newly demonstrated privacy/auth/data-isolation defect remains release-blocking for a future candidate until corrected.

A live post-RC3 check confirmed that `public.bible_media_library` has RLS enabled and that media read/insert/update policies remain scoped through congregation membership and `private.bible_can_review_content(congregation_id)` as expected by the Videos feature.

The Supabase security advisor currently reports leaked-password protection as disabled. This is recorded as a post-release authentication-hardening follow-up; it was not an existing RC3 gate and no production auth behavior was changed during RC3 promotion solely to clear that advisory.

## Historical RCs

Historical only; do not promote by default:

- RC1 branch: `release/v4-rc1`, SHA `cf58fa2e467f70f1c4a963b4ca50e33f11da9983`
- RC2 production line is superseded by RC3.

## Rollback reference

Retain as a safety reference after V4 acceptance unless intentionally retired in a later maintenance change:

- branch: `release/v3.71-japanese-furigana`
- SHA: `c631bea8d5177a9a2ff68139cb104b6fbf26015b`

## Development safety rules

- Keep one serialized integration stream.
- Repository/CI/live-environment evidence overrides stale summaries.
- Never fabricate field evidence; use `OWNER-WAIVED` when an explicit product-owner waiver applies.
- Do not weaken automated security/privacy/authorization checks to obtain green status.
- Preserve single-owner architecture and privacy/isolation contracts.
- Historical checkpoint documents certify only their exact scope/SHA.
- Any later document using `current`, `release-ready`, `final candidate`, or `remaining blockers` must defer to this file.
- When blockers/scope/RC identity materially change, update this file in the same serialized stream.
