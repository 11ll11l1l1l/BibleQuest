# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-11 JST

`FEATURE_INVENTORY_V3.md` remains authoritative.

## Current completion snapshot

- Total capabilities: 100
- Current bookkeeping candidate: 89 Regression-tested / 1 Verified / 0 Implemented / 10 Not started
- Implemented or better: **90/100**
- Regression stability: **89/100**
- Latest frozen checkpoint: `release/v3.62-content-review` at `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c`
- #92 exact functional candidate: `298ebcdd9b34a9582cbe24c856ec256292acb7a8`
- #92 focused run: `34528237689` — green
- #92 complete functional run: `34528950642` — green
- #93 Admin Operations is next only after v3.63 bookkeeping verification/freeze.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred.

## Recent frozen release line

- `release/v3.60-content-reporting` — `17071432a815ef5cf53f5f4538df982285114bd0`
- `release/v3.61-content-moderation` — `dfbbb690c814a514714967f240262eec39b6e3ee`
- `release/v3.62-content-review` — `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c`
- `release/v3.63-admin-console` — pending exact bookkeeping verification/freeze

## Recent milestone sequence

| Capability | State in current bookkeeping | Evidence |
|---:|---|---|
| #88 Content moderation | Regression-tested | frozen v3.61; survived #91/#92 complete suites |
| #91 Content Review workbench | Regression-tested | frozen v3.62; survived #92 complete suite |
| #92 Admin console | Verified | exact candidate `298ebcdd...`; full run `34528950642` |
| #93 Admin operations | Not started | waits for v3.63 freeze; retained contract recovered read-only |

## #91 closeout chronology

1. #91 functional candidate `68516bdbdb651dd144270bd5bc615909967130a8` passed complete functional run `34522265269`.
2. Bookkeeping candidate `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c` passed complete exact-SHA bookkeeping run `34523117239`.
3. `release/v3.62-content-review` and the clean Content Review product tip were reconciled to that exact bookkeeping SHA.

## #92 functional chronology

1. Started from frozen v3.62 at `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c`.
2. Recovered retained Admin Console behavior from the old standalone admin surface and existing `bq-admin` backend contract while keeping #93 Admin Operations and password/reset recovery out of scope.
3. Reused Session and the central API boundary; added one Admin Console state/orchestration owner and one rendering owner rather than retaining legacy direct-client/global ownership.
4. Added platform user access, congregation membership/role, congregation creation, small-group creation, group membership/role and ownership-transfer workflows with fail-closed Owner/Admin readiness.
5. Added permanent Admin Console architecture, edge/security and browser/mobile regressions, then accumulated them into the dispatch-only product regression workflow.
6. Initial full verifier run `34528132854` failed before product regressions because the verifier had temporarily added `push:` to product `.github/workflows/v3-regression.yml`. This was a verifier-infrastructure defect; the product validator correctly rejected it.
7. Focused isolated Admin Console run `34528237689` passed.
8. The verifier was corrected to use a separate verifier-only branch-trigger workflow that explicitly checked out and asserted exact product candidate `298ebcdd9b34a9582cbe24c856ec256292acb7a8` while leaving product CI manual-only.
9. Complete accumulated run `34528950642` passed exact-SHA assertion, all architecture validators, all edge/security regressions, and the complete browser/mobile suite.
10. Current bookkeeping promotes #91 to Regression-tested and #92 to Verified; this changed bookkeeping still requires its own complete exact-SHA gate before release.

## #93 read-only preparation

Retained `admin-operations.html` and `admin-operations.js` define a separate Owner/Admin Ministry Operations dashboard for system health, online presence, assignments, messages, polls, curated media and live rooms. Existing `supabase/functions/bq-admin-ops/index.ts` remains the server-authoritative access/data contract. No #93 implementation is allowed until v3.63 freezes.

## Next sequence

1. Finish #92 bookkeeping on `work/v3.63-admin-console-bookkeeping-20260911`.
2. Fast-forward `feature/v3-admin-console` only if it still equals exact green functional candidate `298ebcdd9b34a9582cbe24c856ec256292acb7a8`.
3. Run full exact-SHA bookkeeping verification including inventory/status validation and the accumulated architecture/edge/browser suites.
4. Freeze `release/v3.63-admin-console` only if the exact bookkeeping SHA is green.
5. Verify refs, then create `feature/v3-admin-operations` from frozen v3.63 and begin #93 from the recovered retained contract.

## Release discipline

Production v2, `main`, production Supabase/data and production Cloudflare remain untouched. Normal CI stays manual-only; temporary push triggers are isolated and removed after use.