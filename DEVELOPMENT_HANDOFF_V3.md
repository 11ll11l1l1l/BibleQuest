# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after #91 Content Review complete functional verification.

GitHub live refs and exact executed verification evidence are authoritative. Recover live refs before writing because concurrent chats/agents may move development branches.

## Frozen baseline

- Repository: `11ll11l1l1l/BibleQuest`.
- Latest frozen release: `release/v3.61-content-moderation`.
- Exact frozen SHA: `dfbbb690c814a514714967f240262eec39b6e3ee`.
- Production v2, `main`, production Cloudflare, production data and production Supabase remain untouched.
- Normal v3 Actions are `workflow_dispatch` only. Temporary `push:` triggers belong only on isolated one-shot verifier branches and are never release SHAs.

## Current #91 state

- Active product branch: `feature/v3-content-review`.
- Exact green functional candidate: `68516bdbdb651dd144270bd5bc615909967130a8`.
- Corrected targeted exact-SHA green run: `34522099170`.
- Complete accumulated functional green run: `34522265269`.
- Functional verifier `verify/v3.62-content-review-functional-68516bd-20260911` has been reset to the clean functional candidate.
- Bookkeeping work is isolated on `work/v3.62-content-review-bookkeeping-chat-20260911` rooted at the functional candidate.
- Current bookkeeping represents #88 as **Regression-tested** and #91 as **Verified**.
- Provisional inventory: **88 Regression-tested / 1 Verified / 0 Implemented / 11 Not started**.
- Provisional strict implemented-or-better parity: **89/100**.
- Provisional regression stability: **88/100**.
- These bookkeeping values require their own complete exact-SHA verification before v3.62 can freeze. Do not transfer the functional PASS to the changed bookkeeping SHA.

## #91 verified boundary

- Session is the only authenticated-user owner.
- Congregation Membership is the only membership/role projection owner.
- `src/core/api.js` is the only browser Supabase implementation boundary.
- Recall remains the only bundled quarantine-file owner.
- `src/app/content-review.js` owns reviewer eligibility projection, selected congregation, review queue state, decision validation, snapshots, save orchestration and error state.
- Router remains the only route/history owner.
- Authorized reviewers are congregation `leader`, `pastor`, or `admin`, or platform `owner`/`admin`; database RLS remains final authority.
- Review queue covers quarantined Recall questions and congregation member reports.
- Valid decisions are exactly `include`, `exempt`, and `remove`; rationale is optional and bounded to 1,200 characters.
- A decision write failure is hard failure; successful decision followed by report-resolution failure is surfaced as partial-save rather than false atomic success.
- No broader Admin Console, Admin Operations, reset/recovery, schema deployment, bulk moderation, content editor, or production deployment belongs to #91.

Permanent #91 evidence:
- `CONTENT_REVIEW_V3.md`
- `src/app/content-review.js`
- `src/features/content-review/index.js`
- `src/core/api.js`
- `src/core/recall-packs.js`
- `src/app/bootstrap.js`
- `scripts/validate-v3-content-review.mjs`
- `tests/v3-content-review-edge.mjs`
- `tests/v3-content-review-smoke.mjs`
- accumulated invocation in `.github/workflows/v3-regression.yml`.

## Reproduced defect and permanent protection

- Initial targeted run `34521698454` failed only at the 390 px Content Review browser regression; architecture, service edge behavior, Recall and moderation checks had already passed.
- Root cause was a test expectation that treated a saved `include` item as though it should remain visible under the default Pending filter.
- The correction retained the acceptance requirement: after save the item must leave Pending, then appear under the Include filter with the persisted decision state and no page reload.
- Corrected targeted run `34522099170` passed against exact candidate `68516bdbdb651dd144270bd5bc615909967130a8`.
- Full run `34522265269` passed the complete accumulated architecture, edge/security and browser/mobile suite against the same exact candidate.

## Next capability boundary

#92 Admin console remains **Not started** until v3.62 freezes. It must be recovered from retained project evidence before implementation. #92 is the administrative console surface and permission boundary; #93 Admin operations remains separate and must not be silently folded into #92.

## Exact next executable sequence

1. Finish all #91 bookkeeping files on the isolated bookkeeping branch.
2. Confirm `feature/v3-content-review` still points to `68516bdbdb651dd144270bd5bc615909967130a8`; if unchanged, fast-forward it to the final clean bookkeeping SHA.
3. Treat that exact final tip as the #91 bookkeeping candidate.
4. Create an isolated verifier from that exact SHA with only a temporary branch-specific `push:` trigger and exact checkout/assertion.
5. Run the complete accumulated architecture validators, edge/security regressions, inventory/status validation and browser/mobile suite.
6. Correct only reproduced failures; never weaken or skip accumulated coverage.
7. On green, reset the verifier to the clean bookkeeping SHA and freeze `release/v3.62-content-review` at exactly that SHA.
8. Verify the release ref equals the green bookkeeping SHA.
9. Only then create the next feature branch from v3.62 and rebuild #92 from recovered evidence.

## Non-negotiable safety

Rebuild-and-verify; one source of truth per responsibility; no PASS transfer between changed SHAs; normal Actions remain manual-only; temporary push triggers stay isolated; never modify `main`, production v2, production Cloudflare, production data or production Supabase without separate explicit authorization.