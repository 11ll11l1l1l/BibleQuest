# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after #88 Content Moderation complete functional verification.

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity ledger. Development continues under rebuild-and-verify with exact-SHA verification and one-owner boundaries.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase, production data, and production Cloudflare remain untouched.
- Latest frozen checkpoint: `release/v3.60-content-reporting` at `17071432a815ef5cf53f5f4538df982285114bd0`.
- Active branch: `feature/v3-content-moderation`.
- Normal v3 Actions remain `workflow_dispatch` only on product branches.
- Temporary `push:` triggers are restricted to isolated `verify/...` branches and are never release SHAs.

## Current bookkeeping candidate state

| State | Count |
|---|---:|
| Regression-tested | 87 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 12 |
| Total | 100 |

Strict implemented-or-better parity is **88/100**. Regression stability is **87/100**.

- #87 Content reporting — **Regression-tested** after surviving #88's complete accumulated functional suite.
- #88 Content moderation — **Verified** at exact functional candidate `8cd39e48eeb2affc7a4a2b27a319879bdda05b19`.
- #91 Content Review workbench — **Not started** and is the next dependency-safe milestone after v3.61 freezes.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred.

These lifecycle counts are now represented by changed bookkeeping files. They are not frozen until the final bookkeeping SHA passes its own complete accumulated exact-SHA gate. No PASS transfers from the functional candidate after documentation changes.

## #88 verified functional boundary

Content Moderation is a congregation-scoped policy application layer only. `src/app/content-moderation.js` owns decision normalization, scope selection, stale/fallback state and application rules. `src/core/api.js` remains the single Supabase browser boundary and owns bounded `bible_content_decisions` reads. `src/core/recall-packs.js` owns quarantine-pack access; Games consumes moderation policy rather than reading Supabase or quarantine files directly. Existing Session and Congregation Membership owners remain authoritative.

The retained policy contract is `include`, `exempt`, or `remove`. `exempt` and `remove` suppress approved content; an explicit matching `include` may restore a quarantined Recall item. Decision reads are congregation-scoped, capped at 4,000 rows and bounded by the retained 1.4-second timeout. Policy refresh failures preserve a previously loaded same-congregation decision map as stale; otherwise the feature fails closed/unavailable rather than inventing policy.

#88 adds no reviewer decision UI, schema migration, admin operation, scoring change or production deployment. Decision editing remains #91.

Permanent #88 evidence includes `CONTENT_MODERATION_V3.md`, `src/app/content-moderation.js`, the `contentModeration` API owner in `src/core/api.js`, quarantine loading in `src/core/recall-packs.js`, Games/bootstrap composition, `scripts/validate-v3-content-moderation.mjs`, `tests/v3-content-moderation-edge.mjs`, and accumulated invocation in `.github/workflows/v3-regression.yml`.

## Defect / root-cause ledger

- #87 bookkeeping was ultimately verified and frozen as `release/v3.60-content-reporting` at `17071432a815ef5cf53f5f4538df982285114bd0`.
- During #88 recovery, the clean service initially had no shared `bible_content_decisions` API reader and Recall discarded quarantined rows before policy could explicitly restore them. The architecture was corrected through existing API/Recall owners rather than adding direct Supabase/fetch bypasses.
- A #88 state-reset defect on congregation/session transitions was reproduced and corrected before the final candidate.
- Targeted run `34519519936`: **success** against exact functional candidate `8cd39e48eeb2affc7a4a2b27a319879bdda05b19`; #88 architecture, policy edge behavior, affected Recall/Games edge regressions, and 390px Games browser regression all passed.
- Full run `34519691125`: **success** against the same exact candidate; exact-SHA assertion, all accumulated architecture validators, all accumulated edge/security regressions, and the complete browser/mobile suite passed.
- The functional verifier `verify/v3.61-content-moderation-functional-8cd39e4-20260911` was reset to the clean candidate after the green run.

## Next major milestone: #88 bookkeeping and v3.61 freeze

1. Finish all #88 bookkeeping files on `feature/v3-content-moderation`.
2. Confirm the final live tip and treat that exact changed SHA as the bookkeeping candidate.
3. Create an isolated one-shot verifier from that exact SHA with branch-specific `push:` plus exact checkout/assertion.
4. Run the complete accumulated architecture, edge/security and browser/mobile suite, including inventory/status validation.
5. Correct only reproduced failures without weakening accumulated coverage.
6. On green, reset the verifier to the clean bookkeeping SHA and freeze `release/v3.61-content-moderation` at exactly that SHA.
7. Verify the release ref.
8. Only then create `feature/v3-content-review` from v3.61 and implement #91.

## #91 recovered boundary for the next milestone

Read-only recovery of the retained Content Review workbench establishes a reviewer queue over quarantined questions and member reports, congregation selection, filtering/search, reviewer notes, decisions and report resolution. Existing schema/RLS authorizes platform owner/admin or congregation leader/pastor/admin review actions.

The clean rebuild must not port standalone Supabase clients, direct localStorage congregation ownership, `MutationObserver` enhancement layers, `window.BQ*` registries or reload-driven state management. It must use v3 Session/Congregation/API/Router ownership. The real database contract allows only decision values `include`, `exempt`, and `remove`; a legacy editor path that attempted `delete` is invalid and must not be reproduced. #91 owns reviewer workflow only; broader admin console/operations remain #92/#93.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase/data and production Cloudflare remain unchanged throughout the rebuild.
