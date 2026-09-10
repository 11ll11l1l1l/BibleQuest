# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after #87 Content Reporting complete functional verification.

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity ledger. Development continues under rebuild-and-verify with exact-SHA verification and one-owner boundaries.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase, production data, and production Cloudflare remain untouched.
- Latest frozen checkpoint: `release/v3.59-accessibility-support` at `5594f9802e40b25c6df9b6331668c0bbfcedacc7`.
- Active branch: `feature/v3-content-reporting`.
- Normal v3 Actions remain `workflow_dispatch` only on product branches.
- Temporary `push:` triggers are restricted to isolated `verify/...` branches and are never release SHAs.

## Current bookkeeping candidate state

| State | Count |
|---|---:|
| Regression-tested | 86 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 13 |
| Total | 100 |

Strict implemented-or-better parity is **87/100**. Regression stability is **86/100**.

- #86 Accessibility support — **Regression-tested** after surviving #87's complete accumulated functional suite.
- #87 Content reporting — **Verified** by exact functional candidate `72ef635a5322e715c293de489bf37a170f05729d` in complete accumulated run `34510669714`.
- #88 Content moderation — **Not started** and remains separate from #87.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred.

These lifecycle counts are represented by the current #87 bookkeeping transaction but are not frozen until the exact bookkeeping SHA itself passes a new complete accumulated gate. No PASS transfers from `72ef635a5322e715c293de489bf37a170f05729d` after documentation changes.

## #87 verified functional boundary

Content Reporting is rebuilt without the legacy global injector. `src/app/content-reporting.js` owns validation and submission orchestration; `src/core/api.js` owns the single Supabase insert; existing Session and Congregation Membership owners remain authoritative for user/membership state; and `src/ui/content-reporting.js` owns bounded content selection and presentation only. Bootstrap refreshes reporting after Router-owned route rendering, so no second navigation listener exists.

Reporting is limited to explicitly allowlisted authored/curated surfaces. Form fields, response/note containers, user-content markers, account/private/community/workspace/couples/congregation administration surfaces, Reader, Transform and Psychometrics are excluded. Success requires a returned report ID; backend/RLS/network failures remain visible errors. #87 adds no schema migration, moderation decision workflow, review workbench, scoring or production deployment.

Permanent evidence includes `CONTENT_REPORTING_V3.md`, `src/app/content-reporting.js`, `src/ui/content-reporting.js`, `src/ui/content-reporting.css`, the `contentReports` API owner in `src/core/api.js`, `scripts/validate-v3-content-reporting.mjs`, `tests/v3-content-reporting-edge.mjs`, `tests/v3-content-reporting-smoke.mjs`, and permanent accumulated invocation in `.github/workflows/v3-regression.yml`.

## Verification and defect ledger

- Targeted run `34509524070`: rejected because the #87 validator demanded a literal `data-content-reporting-root` token while runtime used the equivalent `dataset` marker. Validator corrected without reducing behavioral coverage.
- Targeted run `34509633853`: rejected because the Playwright test selected the full-screen scrim instead of the visible close button. Selector corrected; product close behavior was unchanged.
- Targeted run `34509850415`: exact-SHA #87 architecture, owner/validation edge, and 390px browser success/error/privacy checks passed at candidate `19bd25dadd12ac1981675d5f153cfd018547c04a`.
- Full run `34510145224`: rejected by the accumulated architecture gate because `src/ui/content-reporting.js` directly subscribed to `hashchange`. Root cause was a real Router ownership violation. The listener was removed and reporting refresh moved into bootstrap's Router composition.
- Full run `34510492091`: Router architecture passed, then retained #65 validation rejected the new API export ordering because it required literal adjacency `encouragements, media`. The validator was corrected to require both exported owners independently.
- Full run `34510669714`: **success** at exact candidate `72ef635a5322e715c293de489bf37a170f05729d`; all accumulated architecture validators, all edge/security regressions, and the complete browser/mobile suite passed.

## Next major milestone: #87 bookkeeping and v3.60 freeze

1. Confirm the live tip of `feature/v3-content-reporting` after this bookkeeping transaction.
2. Treat that exact changed SHA as the #87 bookkeeping candidate; do not reuse the functional PASS.
3. Verify the exact bookkeeping SHA with the complete accumulated architecture, edge/security and browser/mobile suite on an isolated verifier using exact checkout/assertion.
4. Correct only reproduced failures without weakening accumulated coverage.
5. On green, reset the verifier to the clean bookkeeping SHA and freeze `release/v3.60-content-reporting` at exactly that SHA.
6. Verify the release ref.
7. Only then create `feature/v3-content-moderation` from v3.60 and continue #88 from the recovered retained moderation contract.

## #88 recovered boundary for the next milestone

Read-only recovery already establishes congregation-scoped `bible_content_decisions` with decisions `include`, `exempt`, and `remove`, and origins `quarantine`, `user_report`, and `review`. Existing RLS permits congregation members/reviewers to read decisions and only authorized reviewers to insert/update them. Legacy behavior filtered question content according to those decisions and could restore explicitly included quarantined content. The old global `window.fetch` wrapper, localStorage cache, `window.BQ*` registry, and direct navigation/global ownership are reference evidence only and must not be ported.

#88 remains moderation-policy application only; leader decision editing belongs to #91 Content Review workbench and admin operations remain separate.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase/data and production Cloudflare remain unchanged throughout the rebuild.
