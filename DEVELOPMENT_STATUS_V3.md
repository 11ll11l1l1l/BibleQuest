# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after #91 Content Review complete functional verification.

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity ledger. Development continues under rebuild-and-verify with exact-SHA verification and one-owner boundaries.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase, production data, and production Cloudflare remain untouched.
- Latest frozen checkpoint: `release/v3.61-content-moderation` at `dfbbb690c814a514714967f240262eec39b6e3ee`.
- Active milestone branch: `feature/v3-content-review`.
- Normal v3 Actions remain `workflow_dispatch` only on product branches.
- Temporary `push:` triggers are restricted to isolated `verify/...` branches and are never release SHAs.

## Current bookkeeping candidate state

| State | Count |
|---|---:|
| Regression-tested | 88 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 11 |
| Total | 100 |

Strict implemented-or-better parity is **89/100**. Regression stability is **88/100**.

- #88 Content moderation — **Regression-tested** after surviving #91's complete accumulated functional suite.
- #91 Content Review workbench — **Verified** at exact functional candidate `68516bdbdb651dd144270bd5bc615909967130a8`.
- #92 Admin console — **Not started** and is the next dependency-safe milestone after v3.62 freezes.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred.

These lifecycle counts are represented by changed bookkeeping files. They are not frozen until the final bookkeeping SHA passes its own complete accumulated exact-SHA gate. No PASS transfers from the functional candidate after documentation changes.

## #91 verified functional boundary

Content Review is the reviewer workflow over quarantined Recall questions and congregation member reports. Session remains the authenticated-user owner, Congregation Membership remains the membership/role projection owner, `src/core/api.js` remains the sole browser Supabase boundary, Recall remains the quarantine-file owner, Router remains navigation owner, and `src/app/content-review.js` owns review-state orchestration.

Authorized reviewers are congregation `leader`, `pastor`, or `admin`, or platform `owner`/`admin`; unknown roles fail closed and database RLS remains final authority. Decisions are exactly `include`, `exempt`, or `remove`; optional rationale is bounded to 1,200 characters. Saving upserts `bible_content_decisions` and then resolves matching open reports. A decision-write failure is hard failure; decision success followed by report-resolution failure is surfaced as partial-save rather than false atomic success.

The UI provides congregation selection, quarantine/report tabs, search, decision-state filtering, explicit review actions, visible success/error states, and 390 px mobile behavior without direct Supabase, storage, global registry, or reload-driven ownership.

Permanent #91 evidence includes `CONTENT_REVIEW_V3.md`, `src/app/content-review.js`, `src/features/content-review/index.js`, central API/Recall/bootstrap composition, `scripts/validate-v3-content-review.mjs`, `tests/v3-content-review-edge.mjs`, `tests/v3-content-review-smoke.mjs`, and accumulated invocation in `.github/workflows/v3-regression.yml`.

## Defect / root-cause ledger

- #88 bookkeeping passed run `34520364924` and froze as `release/v3.61-content-moderation` at `dfbbb690c814a514714967f240262eec39b6e3ee`.
- #91 targeted run `34521698454` failed only in the 390 px Content Review browser regression. Architecture, edge behavior, Recall, and moderation checks were green. The browser assertion expected a newly included item to remain visible under the default Pending filter, which contradicted the implemented filter contract.
- The test was corrected without weakening acceptance: after save, the included item must leave Pending; selecting the Include filter must reveal the same saved state without reload.
- Corrected targeted run `34522099170`: **success** against exact candidate `68516bdbdb651dd144270bd5bc615909967130a8`.
- Complete accumulated functional run `34522265269`: **success** against the same exact candidate; exact-SHA assertion, all accumulated architecture validators, all edge/security regressions, and the complete browser/mobile suite passed.
- Functional verifier `verify/v3.62-content-review-functional-68516bd-20260911` was reset to the clean functional candidate after the green run.

## Next major milestone: #91 bookkeeping and v3.62 freeze

1. Finish #91 bookkeeping from exact functional candidate `68516bdbdb651dd144270bd5bc615909967130a8`.
2. Treat the final clean bookkeeping tip as a new exact candidate.
3. Create an isolated one-shot bookkeeping verifier with branch-specific `push:` plus explicit checkout/assertion of that exact candidate.
4. Run the complete accumulated architecture, edge/security, inventory/status, and browser/mobile suite.
5. Correct only reproduced failures without weakening accumulated coverage.
6. On green, reset the verifier to the clean bookkeeping SHA and freeze `release/v3.62-content-review` at exactly that SHA.
7. Verify the release ref.
8. Only then create the next feature branch from frozen v3.62 and begin #92 Admin console.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase/data and production Cloudflare remain unchanged throughout the rebuild.