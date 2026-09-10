# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-11 JST

`FEATURE_INVENTORY_V3.md` remains authoritative.

## Current completion snapshot

- Total capabilities: 100
- Current bookkeeping candidate: 90 Regression-tested / 1 Verified / 0 Implemented / 9 Not started
- Implemented or better: **91/100**
- Regression stability: **90/100**
- Latest frozen checkpoint: `release/v3.63-admin-console` at `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`
- #93 exact functional candidate: `2e93349e686242e2a48d6ca0ee1a60ade8ca85d7`
- #93 final targeted run: `34531588788` — green
- #93 complete functional run: `34531751123` — green
- Initial #93 bookkeeping run: `34532442314` — bookkeeping checks green, then failed a stale #92 lifecycle assertion; corrected candidate pending complete rerun.
- #94 Reset/recovery is next only after v3.64 bookkeeping verification/freeze.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred.

## Recent frozen release line

- `release/v3.60-content-reporting` — `17071432a815ef5cf53f5f4538df982285114bd0`
- `release/v3.61-content-moderation` — `dfbbb690c814a514714967f240262eec39b6e3ee`
- `release/v3.62-content-review` — `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c`
- `release/v3.63-admin-console` — `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`
- `release/v3.64-admin-operations` — pending corrected exact bookkeeping verification/freeze

## Recent milestone sequence

| Capability | State in current bookkeeping | Evidence |
|---:|---|---|
| #88 Content moderation | Regression-tested | frozen v3.61; survived later complete suites |
| #91 Content Review workbench | Regression-tested | frozen v3.62; survived #92/#93 complete suites |
| #92 Admin console | Regression-tested | frozen v3.63; survived #93 complete suite `34531751123` |
| #93 Admin operations | Verified | exact functional candidate `2e93349e...`; full run `34531751123`; corrected bookkeeping gate pending |
| #94 Reset/recovery page | Not started | waits for v3.64 freeze and retained-boundary recovery |

## #92 closeout chronology

1. #92 functional candidate `298ebcdd9b34a9582cbe24c856ec256292acb7a8` passed complete functional run `34528950642`.
2. Initial bookkeeping run `34529629974` failed because required durable status headings were renamed; runtime and inventory values were not implicated.
3. Corrected bookkeeping candidate `8a759218edbd1c7f9f71591a9e6aa6cca70dc465` passed complete exact-SHA bookkeeping run `34529824942`.
4. `release/v3.63-admin-console` and the clean Admin Console product tip were reconciled to that exact bookkeeping SHA.

## #93 functional chronology

1. Started `feature/v3-admin-operations` from frozen v3.63 at `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`.
2. Recovered retained Ministry Operations behavior from `admin-operations.html`, `admin-operations.js`, repository history and existing `bq-admin-ops` server authority. Repository history established that Owner account deletion was introduced with Admin Operations and belongs to #93 parity.
3. Rebuilt the standalone dashboard against Session plus the central API boundary, with a dedicated Admin Operations authorization/data owner and rendering owner rather than retained direct Supabase globals.
4. Preserved system health, online presence, assignment/progress aggregates, devotionals/announcements, poll aggregates, curated media and live-room aggregates. Privileged client-error identifiers and individual voter identity are not rendered.
5. Rebuilt Owner-only account deletion through the #93 service and composed it into #92's existing user cards without giving #92 direct `bq-admin-ops` ownership. Self-delete refusal and exact typed confirmation are retained; server-side ownership/audit/Auth-delete guards remain authoritative.
6. Added permanent #93 architecture, edge/security and browser/mobile regressions and accumulated them into the dispatch-only product regression workflow.
7. Initial targeted run `34531083463` failed in the neighboring #92 guard because its old regex scanned beyond the bounded Admin Console facade and its API-export assertion depended on adjacency. The validator was corrected to preserve the same ownership prohibition while allowing later independent facades.
8. Corrected targeted run `34531492122` then failed only because the #93 contract document did not use the exact self-delete invariant wording required by its validator. Documentation was aligned; runtime behavior was unchanged.
9. Final targeted run `34531588788` passed against exact candidate `2e93349e686242e2a48d6ca0ee1a60ade8ca85d7`.
10. Complete accumulated functional run `34531751123` passed exact-SHA assertion, all accumulated architecture validators, all edge/security regressions and the complete browser/mobile suite against that same candidate.
11. Bookkeeping writer run `34532182063` first asserted the bookkeeping branch still equaled the green functional candidate, then promoted #92 to Regression-tested and #93 to Verified in the authoritative inventory.
12. Initial bookkeeping gate `34532442314` passed exact-SHA and bookkeeping assertions, then failed because the retained #92 validator still hard-coded #93 as `Not started`. The validator now requires a valid #93 lifecycle state while retaining every #92/#93 ownership boundary.
13. The corrected changed bookkeeping candidate requires a new complete exact-SHA gate before v3.64 can freeze.

## #94 read-only boundary reminder

#94 is the retained standalone Reset/recovery page and remains separate from #100 Backup/export/import/reset and from account password/recovery-code flows. No #94 implementation is allowed until v3.64 freezes; retained behavior and clean ownership must be recovered first.

## Next sequence

1. Treat the corrected #93 bookkeeping tip as a new exact candidate and reconcile `feature/v3-admin-operations` only by safe fast-forward after checking live refs.
2. Run full exact-SHA bookkeeping verification including inventory/status/timeline validation and the accumulated architecture/edge/browser suites.
3. Freeze `release/v3.64-admin-operations` only if the corrected exact bookkeeping SHA is green.
4. Verify refs, then create the next feature branch from frozen v3.64 and recover #94 before implementation.

## Release discipline

Production v2, `main`, production Supabase/data and production Cloudflare remain untouched. Normal CI stays manual-only; temporary push triggers are isolated and removed after use.
