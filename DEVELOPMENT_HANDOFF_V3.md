# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after #87 Content Reporting complete functional verification.

GitHub live refs and exact executed verification evidence are authoritative. Recover live refs before writing because concurrent chats/agents may move development branches.

## Frozen baseline

- Repository: `11ll11l1l1l/BibleQuest`.
- Latest frozen release: `release/v3.59-accessibility-support`.
- Exact frozen SHA: `5594f9802e40b25c6df9b6331668c0bbfcedacc7`.
- Production v2, `main`, production Cloudflare, production data and production Supabase remain untouched.
- Normal v3 Actions are `workflow_dispatch` only. Temporary `push:` triggers belong only on isolated one-shot verifier branches and are never release SHAs.

## Current #87 state

- Active feature branch: `feature/v3-content-reporting`.
- Exact green functional candidate: `72ef635a5322e715c293de489bf37a170f05729d`.
- Targeted exact-SHA green run: `34509850415`.
- Complete accumulated functional green run: `34510669714`.
- The current bookkeeping transaction represents #86 as **Regression-tested** and #87 as **Verified**.
- Provisional inventory: **86 Regression-tested / 1 Verified / 0 Implemented / 13 Not started**.
- Provisional strict implemented-or-better parity: **87/100**.
- Provisional regression stability: **86/100**.
- These bookkeeping values require their own complete exact-SHA verification before v3.60 can freeze. Do not transfer the functional PASS to the changed bookkeeping SHA.

## #87 verified boundary

- `src/app/content-reporting.js` is the single reporting orchestration owner; it validates content context, bounded reason/note, authenticated user, and current congregation membership.
- `src/core/api.js` remains the sole Supabase browser implementation boundary and owns the single `bible_content_reports` insert.
- Session and Congregation Membership remain authoritative; #87 does not create competing auth/membership state.
- `src/ui/content-reporting.js` is presentation only and snapshots explicitly reportable authored/curated content while excluding form values, response/note containers, user-content markers, private/admin/community/workspace/couples/congregation surfaces, Reader, Transform, and Psychometrics.
- Router remains the only navigation/history owner. Reporting does not listen to `hashchange`; bootstrap refreshes its launcher after Router-owned route rendering.
- Existing RLS remains authoritative. #87 adds no migration, review permissions, moderation decisions, XP/scoring, or production deployment.

Permanent #87 evidence:
- `CONTENT_REPORTING_V3.md`
- `src/app/content-reporting.js`
- `src/ui/content-reporting.js`
- `src/ui/content-reporting.css`
- `src/core/api.js`
- `scripts/validate-v3-content-reporting.mjs`
- `tests/v3-content-reporting-edge.mjs`
- `tests/v3-content-reporting-smoke.mjs`
- accumulated invocation in `.github/workflows/v3-regression.yml`.

## Reproduced defects and permanent protection

- Targeted `34509524070`: validator representation defect around the root marker; corrected without weakening behavior.
- Targeted `34509633853`: Playwright close selector chose the scrim; corrected to the visible close button.
- Targeted `34509850415`: targeted #87 exact-SHA suite green.
- Full `34510145224`: real navigation-ownership defect found; direct `hashchange` subscription removed and refresh moved into bootstrap Router composition.
- Full `34510492091`: retained #65 validator was brittle to API export adjacency; corrected to require `encouragements` and `media` independently.
- Full `34510669714`: complete accumulated architecture, edge/security, and browser/mobile suite green against `72ef635a5322e715c293de489bf37a170f05729d`.

## #88 recovered next boundary

#88 Content moderation remains **Not started** until v3.60 freezes. Read-only recovery establishes:

- `bible_content_decisions` is congregation-scoped with primary key `(congregation_id, content_key)`.
- Decisions are `include`, `exempt`, or `remove`; origins are `quarantine`, `user_report`, or `review`.
- Existing RLS allows congregation members/reviewers to read policy and only authorized reviewers to insert/update decisions.
- Retained legacy behavior applied policy to question content: `exempt`/`remove` suppress content, while explicit `include` can restore quarantined content.
- Legacy `window.fetch` interception, direct localStorage caching, `window.BQ*` registries, unrestricted global listeners, and duplicate ownership must not be ported.
- #88 owns moderation-policy application only. Decision editing/reviewer workflow belongs to #91 Content Review workbench; admin console/operations remain #92/#93.

## Exact next executable sequence

1. Confirm the live tip of `feature/v3-content-reporting` after all #87 bookkeeping document changes.
2. Treat that exact live tip as the #87 bookkeeping candidate.
3. Create an isolated verifier from that exact SHA with only a temporary branch-specific `push:` trigger plus exact checkout/assertion.
4. Run the complete accumulated architecture validators, edge/security regressions, and browser/mobile suite on that exact bookkeeping SHA.
5. Correct only reproduced failures; never weaken or skip accumulated coverage.
6. On green, reset the verifier ref to the clean bookkeeping SHA and freeze `release/v3.60-content-reporting` at exactly that SHA.
7. Verify the release ref equals the green bookkeeping SHA.
8. Only then create `feature/v3-content-moderation` from v3.60 and implement #88 from the recovered contract.

## Non-negotiable safety

Rebuild-and-verify; one source of truth per responsibility; no PASS transfer between changed SHAs; normal Actions remain manual-only; temporary push triggers stay isolated; never modify `main`, production v2, production Cloudflare, production data or production Supabase without separate explicit authorization.
