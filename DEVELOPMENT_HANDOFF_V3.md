# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after #88 Content Moderation complete functional verification.

GitHub live refs and exact executed verification evidence are authoritative. Recover live refs before writing because concurrent chats/agents may move development branches.

## Frozen baseline

- Repository: `11ll11l1l1l/BibleQuest`.
- Latest frozen release: `release/v3.60-content-reporting`.
- Exact frozen SHA: `17071432a815ef5cf53f5f4538df982285114bd0`.
- Production v2, `main`, production Cloudflare, production data and production Supabase remain untouched.
- Normal v3 Actions are `workflow_dispatch` only. Temporary `push:` triggers belong only on isolated one-shot verifier branches and are never release SHAs.

## Current #88 state

- Active feature branch: `feature/v3-content-moderation`.
- Exact green functional candidate: `8cd39e48eeb2affc7a4a2b27a319879bdda05b19`.
- Targeted exact-SHA green run: `34519519936`.
- Complete accumulated functional green run: `34519691125`.
- Functional verifier `verify/v3.61-content-moderation-functional-8cd39e4-20260911` has been reset to the clean functional candidate.
- Current bookkeeping represents #87 as **Regression-tested** and #88 as **Verified**.
- Provisional inventory: **87 Regression-tested / 1 Verified / 0 Implemented / 12 Not started**.
- Provisional strict implemented-or-better parity: **88/100**.
- Provisional regression stability: **87/100**.
- These bookkeeping values require their own complete exact-SHA verification before v3.61 can freeze. Do not transfer the functional PASS to the changed bookkeeping SHA.

## #88 verified boundary

- `src/app/content-moderation.js` is the single moderation-policy orchestration owner.
- `src/core/api.js` remains the sole Supabase browser boundary and owns congregation-scoped `bible_content_decisions` reads, capped at 4,000 rows and bounded by the retained 1.4-second timeout.
- Session and Congregation Membership remain authoritative for authenticated user and congregation scope.
- `src/core/recall-packs.js` owns approved and quarantined Recall pack access; Games does not fetch quarantine files or query Supabase directly.
- Policy values are exactly `include`, `exempt`, and `remove`; `exempt`/`remove` suppress normal content while explicit `include` can restore a matching quarantined Recall item.
- Same-congregation refresh failure may retain an already-loaded decision map as stale. A first-load failure does not invent policy.
- No reviewer UI, admin operation, schema change, scoring change or production deployment belongs to #88.

Permanent #88 evidence:
- `CONTENT_MODERATION_V3.md`
- `src/app/content-moderation.js`
- `src/core/api.js`
- `src/core/recall-packs.js`
- `src/app/games.js`
- `src/app/bootstrap.js`
- `scripts/validate-v3-content-moderation.mjs`
- `tests/v3-content-moderation-edge.mjs`
- accumulated invocation in `.github/workflows/v3-regression.yml`.

## Reproduced defects and permanent protection

- The first recovered #88 service could not compose against the shared API because `createApi()` had no decision reader. The missing read owner was added to `src/core/api.js`; no direct Supabase client was added to moderation.
- Recall originally discarded quarantine rows before policy application. Quarantine access was moved behind the Recall owner so explicit `include` can restore only matching quarantined content.
- A congregation/session state-reset bug was reproduced and corrected before the final functional candidate.
- Targeted `34519519936`: exact #88 architecture, moderation edge behavior, affected Recall/Games regressions and 390px Games browser checks all green.
- Full `34519691125`: exact candidate `8cd39e48eeb2affc7a4a2b27a319879bdda05b19` passed the complete accumulated architecture, edge/security and browser/mobile suite.

## #91 recovered next boundary

#91 Content Review workbench remains **Not started** until v3.61 freezes. Read-only recovery establishes:

- Reviewer queue covers quarantined questions and member reports.
- Existing RLS grants review writes to platform owner/admin or congregation leader/pastor/admin.
- Reviewer actions use `include`, `exempt`, or `remove` and may update matching open reports to reviewed.
- Search/filter, congregation selection, reviewer note and saved decision state are retained behavior.
- Legacy direct Supabase clients, localStorage congregation ownership, `MutationObserver` UI enhancement, `window.BQ*` globals and reload-driven ownership must not be ported.
- A legacy editor path attempted decision `delete`; the real database check permits only `include`, `exempt`, and `remove`, so `delete` must not be reproduced.
- #91 is reviewer workflow only. Broader admin console and operational actions stay separate as #92/#93.

## Exact next executable sequence

1. Confirm the final live tip of `feature/v3-content-moderation` after all bookkeeping changes.
2. Treat that exact tip as the #88 bookkeeping candidate.
3. Create an isolated verifier from that exact SHA with only a temporary branch-specific `push:` trigger and exact checkout/assertion.
4. Run the complete accumulated architecture validators, edge/security regressions and browser/mobile suite against that exact bookkeeping SHA.
5. Correct only reproduced failures; never weaken or skip accumulated coverage.
6. On green, reset the verifier to the clean bookkeeping SHA and freeze `release/v3.61-content-moderation` at exactly that SHA.
7. Verify the release ref equals the green bookkeeping SHA.
8. Only then create `feature/v3-content-review` from v3.61 and rebuild #91 from the recovered contract.

## Non-negotiable safety

Rebuild-and-verify; one source of truth per responsibility; no PASS transfer between changed SHAs; normal Actions remain manual-only; temporary push triggers stay isolated; never modify `main`, production v2, production Cloudflare, production data or production Supabase without separate explicit authorization.
