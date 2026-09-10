# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-11 JST

`FEATURE_INVENTORY_V3.md` remains authoritative.

## Current completion snapshot

- Total capabilities: 100
- Current bookkeeping: 88 Regression-tested / 1 Verified / 0 Implemented / 11 Not started
- Implemented or better: **89/100**
- Regression stability: **88/100**
- Latest frozen checkpoint: `release/v3.61-content-moderation` at `dfbbb690c814a514714967f240262eec39b6e3ee`
- #91 functional candidate: `68516bdbdb651dd144270bd5bc615909967130a8`
- #91 corrected targeted run: `34522099170` — green
- #91 complete functional run: `34522265269` — green
- #92 Admin console is next only after v3.62 bookkeeping verification/freeze.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred.

## Recent frozen release line

- `release/v3.59-accessibility-support` — `5594f9802e40b25c6df9b6331668c0bbfcedacc7`
- `release/v3.60-content-reporting` — `17071432a815ef5cf53f5f4538df982285114bd0`
- `release/v3.61-content-moderation` — `dfbbb690c814a514714967f240262eec39b6e3ee`
- `release/v3.62-content-review` — pending exact bookkeeping verification/freeze

## Recent milestone sequence

| Capability | State now | Evidence |
|---:|---|---|
| #87 Content reporting | Regression-tested | frozen v3.60; survived #88/#91 full suites |
| #88 Content moderation | Regression-tested | frozen v3.61; survived #91 full suite |
| #91 Content Review workbench | Verified | exact candidate `68516bdb...`; targeted `34522099170`; full `34522265269` |
| #92 Admin console | Not started | waits for v3.62 freeze and contract recovery |

## #91 functional chronology

1. Started from frozen v3.61 at `dfbbb690c814a514714967f240262eec39b6e3ee`.
2. Recovered the retained reviewer workflow without porting legacy direct Supabase clients, localStorage congregation ownership, `MutationObserver` enhancement, reload-driven state, or `window.BQ*` globals.
3. Reused Session, Congregation Membership, central API, Recall and Router ownership.
4. Added the Content Review service/UI, queue normalization for quarantined questions and member reports, bounded reviewer rationale, exact `include`/`exempt`/`remove` writes, report resolution and explicit partial-save handling.
5. Added permanent architecture, edge and 390 px browser regressions plus accumulated workflow invocation.
6. Targeted run `34521698454` exposed a browser-test expectation mismatch: a saved included item was incorrectly expected to remain visible under the default Pending filter. The test was corrected to verify the item leaves Pending and appears under Include without reload.
7. Exact product candidate `68516bdbdb651dd144270bd5bc615909967130a8` passed corrected targeted run `34522099170` and complete accumulated functional run `34522265269`.
8. #91 is promoted to Verified in bookkeeping and #88 advances to Regression-tested; changed bookkeeping still requires its own exact-SHA full gate.

## Next sequence

1. Complete #91 bookkeeping on an isolated branch rooted at the exact green functional candidate.
2. Fast-forward the product branch only if it still matches the green functional candidate.
3. Run full exact-SHA bookkeeping verification including inventory/status validation.
4. Freeze v3.62 only if green.
5. Recover and rebuild #92 Admin console from the frozen v3.62 release while keeping #93 Admin operations separate.

## Release discipline

Production v2, `main`, production Supabase/data and production Cloudflare remain untouched. Normal CI stays manual-only; temporary push triggers are isolated and removed after use.