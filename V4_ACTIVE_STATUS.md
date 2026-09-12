# BibleQuest V4 Official Active Status

Updated: 2026-09-13 JST
Execution model: one serialized development stream
Official active integration branch: `v4/modern-ui-overhaul`
Tracking issue: #124

## Authority

This file is the single authoritative source for current BibleQuest V4 release state. Repository branch/commit/CI/live-backend evidence overrides stale chat context. Historical files certify only their named scope/SHA.

## Verified application checkpoint

The latest fully accumulated application tree remains:

- exact certified application SHA: `4f908ad8b53f3feb00f21ae27dd4707597b5aa14`
- full accumulated regression run `34711333244` — PASS
- V4 Section I security/privacy run `34711333231` — PASS
- V4 Section H responsive/accessibility/performance/PWA automation run `34711333240` — PASS
- V4 whole-app browser audit run `34711333234` — PASS
- Cloudflare exact-SHA preview check `103600570475` — SUCCESS

Verification-only PR #167 also exercised the future `main` promotion path and passed all six automated promotion suites, including accumulated regression, Sections H/I, protected-page audit, Cloudflare preview smoke and whole-app browser audit. The preview passed the maintained 42-route 320/430 px deep-route audit, browser-state matrix, PWA install regression, offline shell and recovery.

Current integration release-control head before this owner-waiver branch: `cb4286d5b4bb7afdd22a2d3b4f1dc6d0ccffe5db`. Commits after the certified application SHA are release-control/documentation-only unless comparison proves otherwise.

## Ad hoc feature note: Videos merge (Live Recordings + Media Library)

Checkpoint: `release/v4-videos-merge`, exact-SHA verified, full accumulated suite green (including full browser/mobile). This was a user-requested change layered on top of the verified application checkpoint above, done and gated independently.

Live Recordings and Media Library were two routes rendering the exact same underlying data - merged into one Videos page. Leaders/pastors/admins can now curate (add) videos via a new form; the required database RLS already existed (`private.bible_can_review_content`), so no new migration was needed, only client code to use it. A design correction was needed mid-build: the first attempt (every video as its own always-visible iframe) violated the existing Audio owner's strict single-player model, caught by the architecture validator; reverted to click-to-select cards feeding the one shared player. A real bug was also caught and fixed before merge: a rejected curation submission would have shown the user a raw Postgres RLS error string instead of a clean message.

`src/app/media-library.js` / `src/features/media-library/index.js` remain in the codebase as a certified, still-tested architectural owner with no live route using them - a legitimate small cleanup item, not forgotten, not bundled into this change since removing them touches the main architecture validator's required-file list.

## Product-owner release decision

On 2026-09-13 the product owner explicitly directed that remaining tasks requiring personal/manual field execution be removed as pre-publication blockers so V4 can proceed to publication.

This decision is recorded in `V4_RELEASE_OWNER_WAIVER.md`.

The Phase 6 manual field gates A-G are therefore **OWNER-WAIVED for this release**. `WAIVED` is not `PASS` and must never be represented as field evidence. The detailed field procedures remain available for post-release validation and later regression work.

The previously required server-side `main` branch-protection/ruleset setup is also **OWNER-WAIVED as a pre-publication blocker** for this release. Promotion should still use the normal PR path and all available automated checks.

## Phase state

- Phase 1 — Assignment privacy tightening: IMPLEMENTED / LIVE RLS VERIFIED.
- Phase 2 — Admin emergency user management: IMPLEMENTED / DEPLOYED. Admin Console access was manually confirmed working by the product owner; the remaining destructive/recovery/session matrix is owner-waived for pre-publication.
- Phase 3 — Privacy-safe 30-minute presence: IMPLEMENTED / LIVE VERIFIED.
- Phase 4 — Leader Center: OFFICIALLY SKIPPED by product-owner instruction.
- Phase 5 — Tutorial + Help Center: CLOSED / ACCUMULATED GREEN.
- Phase 6 — Integrated verification: AUTOMATED/LIVE SUPPORTING EVIDENCE GREEN; manual Gates A-G OWNER-WAIVED for this release.
- Phase 7 — RC convergence and production promotion: UNBLOCKED BY OWNER WAIVER, subject to exact-candidate automated checks remaining green.

## Phase 6 gate disposition

`V4_PHASE6_FIELD_EVIDENCE.json` is the machine-readable release manifest. For this owner-directed release:

- Gate A — authenticated emergency-action matrix: WAIVED
- Gate B — browser account switching / stale-state clearing: WAIVED
- Gate C — true cross-congregation field isolation: WAIVED
- Gate D — physical Android Chrome at 100% zoom: WAIVED
- Gate E — physical Android Brave at 100% zoom: WAIVED
- Gate F — genuinely installed Android PWA acceptance: WAIVED
- Gate G — linked-activity multi-account field validation: WAIVED

No waived gate may be retroactively described as field-tested unless it is genuinely executed and the evidence manifest is updated.

## Release path now

1. Merge the owner-waiver release-control change into `v4/modern-ui-overhaul` after its applicable CI is green.
2. Freeze a new exact V4 release candidate from the resulting integration head, normally `release/v4-rc2` or later.
3. Run the full applicable exact-candidate automated release suite: build/architecture/static checks, accumulated regression, Section H, Section I, protected-page audit, whole-app browser audit, PWA/offline checks, field-evidence validator in production-complete mode, and Cloudflare preview deployment/smoke.
4. If any automated check fails, stop promotion and fix the demonstrated defect; the owner waiver does not waive automated failures.
5. Promote the exact green candidate to `main` through a PR.
6. Verify `Cloudflare Pages: mybiblequest` production deployment identity and basic production browser behavior.
7. Preserve the V3 rollback reference until post-promotion acceptance is complete.

The legacy `Cloudflare Pages: biblequest` project is not V4 release authority. `mybiblequest` remains authoritative.

## Current release readiness

V4 is **owner-approved to proceed to release-candidate freeze and production promotion**, with manual field validation explicitly waived rather than falsely marked PASS.

Remaining pre-publication work is now technical/release-automation work only; there are no required manual field tasks assigned to the product owner.

## Supabase/security note

Existing automated and live security/privacy evidence remains mandatory. The owner waiver does not authorize weakening RLS, authentication, authorization, audit-secret hygiene, or automated security checks. Any newly discovered privacy/auth/data-isolation defect remains release-blocking until corrected.

## Historical RC1

Historical only; do not promote by default:

- branch: `release/v4-rc1`
- SHA: `cf58fa2e467f70f1c4a963b4ca50e33f11da9983`

## Rollback reference

Preserve until final V4 production acceptance:

- branch: `release/v3.71-japanese-furigana`
- SHA: `c631bea8d5177a9a2ff68139cb104b6fbf26015b`

## Development safety rules

- Keep one serialized integration stream.
- Repository/CI/live-environment evidence overrides stale summaries.
- Never fabricate field evidence; use `waived` when an explicit product-owner waiver applies.
- Do not weaken automated security/privacy/authorization checks to obtain green status.
- Preserve single-owner architecture and privacy/isolation contracts.
- Historical checkpoint documents certify only their exact scope/SHA.
- Any later document using `current`, `release-ready`, `final candidate`, or `remaining blockers` must defer to this file.
- When blockers/scope/RC identity materially change, update this file in the same serialized stream.
