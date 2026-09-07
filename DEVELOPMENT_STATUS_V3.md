# BibleQuest v3 Development Status

Updated: 2026-09-07

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity matrix.

## Deployment safety

- Production v2 remains unchanged.
- `main` and production Cloudflare remain untouched.
- Current development branch: `feature/v3-study-core`.
- Normal v3 GitHub Actions remain manual-only. Isolated verification branches may temporarily use a push trigger for a one-shot full-suite execution, then are reset to the exact candidate SHA.
- Latest frozen checkpoint: `release/v3.24-nlt-licensed` at `37ff989dac122f31a53f9bc771639e3ca59b4b03`.
- Exact v3.24 bookkeeping run `34127324969` passed the complete accumulated suite before that freeze.
- #90 Source labels/attribution functional run `34130447654` passed the complete accumulated suite.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 51 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 48 |
| Total | 100 |

Strict verified-or-better parity is **52/100**. Fully regression-tested stability coverage is **51/100**.

Current promotions:
- #16 Japanese vocabulary learning — Regression-tested.
- #17 NLT licensed-link path — Regression-tested after surviving the later #90 full suite.
- #90 Source labels/attribution — Verified.
- #15 Japanese furigana — Not started and intentionally deferred.

## Milestone 11 — Reader language/source completion

Reader/source parity is closed through the recovered NLT behavior except the intentionally deferred furigana row.

- #14 Japanese 口語訳 — Regression-tested; frozen through `release/v3.22-japanese-kougo`.
- #16 Japanese vocabulary learning — Regression-tested; frozen through `release/v3.23-japanese-vocabulary`.
- #17 NLT licensed-link — Regression-tested; frozen in `release/v3.24-nlt-licensed` at `37ff989dac122f31a53f9bc771639e3ca59b4b03` after functional run `34126567141` and bookkeeping run `34127324969`.
- #15 Japanese furigana — intentionally deferred; no `kuromoji`, CDN tokenizer, legacy global, or direct DOM mutation runtime may leak into adjacent features.

## Milestone 12 — Source provenance

### #90 Source labels/attribution — Verified

Recovered legacy behavior established the content-provenance requirement: BibleQuest distinguished actual Bible translation text from unfoldingWord reference answers, story/retelling content, and BibleQuest-authored study/application prose. The old implementation used a MutationObserver/global injection layer; v3 does not recreate that architecture.

Clean v3 implementation:
- `src/core/content-provenance.js` is the immutable registry for BibleQuest-authored content types only: study material, retelling, wisdom/application, recall/context questions, and game content.
- `src/ui/source-labels.js` is a shared presentation helper only. It renders provenance notices and the Learn source guide but owns no translation, question-pack, or Scripture metadata.
- `src/core/bible.js` remains the owner of Scripture translation source/license/attribution metadata, including the licensed NLT handoff.
- `src/core/recall-packs.js` remains the owner of unfoldingWord Translation Questions source/license metadata and now exposes immutable `sourceInfo()` without loading a pack.
- `src/app/bootstrap.js` passes existing Reader/Bible translation metadata and Recall metadata to Learn instead of duplicating source strings.
- Learn retains the exact `<h1>Learn</h1>` and adds a source guide explaining that a Scripture reference is not presented as though it were a quotation.
- Guided Study, Deep Questions, Daily Journey, Wisdom Situations, Adaptive Learning, Story Journey, and Games render the correct BibleQuest-authored provenance label through the shared helper.
- Story Journey explicitly distinguishes authored retelling scenes from authored checkpoint questions.
- Per-book Recall keeps the actual unfoldingWord source/license from the Recall owner rather than being mislabeled as BibleQuest-authored content.
- Reader, STEPBible, Japanese, NLT, and Open Review retain their established source-owner contracts.
- No source-label MutationObserver, `window.BQ*` source injector, direct storage access, or source-fetch path was introduced.

Verification:
- `scripts/validate-v3-source-labels.mjs` protects registry ownership, owner-fed metadata, required active-surface labels, stable Learn heading, and the prohibition on the legacy injector pattern.
- `tests/v3-source-labels-edge.mjs` protects immutable registry/source metadata, exact Recall attribution, no-fetch metadata reads, source-guide composition, explicit Scripture-vs-authored distinction, and escaping.
- `tests/v3-source-labels-smoke.mjs` validates the real 390px flow across Learn, Reader, Guided Study, Deep Questions, Story Journey, Wisdom, Adaptive, Daily Journey, and Quick Recall with no horizontal overflow.
- Corrected complete functional run `34130447654` passed all architecture checks, every accumulated edge test, the new provenance browser test, and every downstream browser regression through Games.

Two pre-verification failures were test-fixture defects, not application defects:
- `V3-SOURCE-LABEL-TEST-001` — run `34129966606`: the new edge-test regex incorrectly rejected the valid phrase “not a direct Scripture quotation.” The test matcher was corrected; application code was unchanged.
- `V3-SOURCE-LABEL-SELECTOR-TEST-001` — run `34130146826`: the new browser test waited for nonexistent `[data-reader-source]` instead of the established `.bq-reader-source`. The test selector was corrected; the normal Reader regression had already passed in that same run.

## Next major milestone

Run the complete accumulated suite on the exact **52/100 parity / 51/100 stability** bookkeeping state. If fully green, freeze `release/v3.25-source-provenance` at that exact SHA.

After v3.25 is frozen, reassess the remaining core-content dependency order before implementation. **#89 Doctrinal safety/context is the leading candidate** because the recovered legacy policy layer classifies sensitive questions as allow/context/quarantine and source provenance is now available to support transparent context notices. Do not start #89 merely by copying the old regex/global runtime: first recover which current v3 content surfaces need policy evaluation, define one policy owner, preserve Scripture-first framing, and ensure reflection/application content is not converted into spiritual scoring. Private/cloud notes (#55–56), accessibility (#86), diagnostics/recovery (#95–96), and PWA/offline Bible behavior (#97–99) remain important alternatives if dependency analysis shows they should precede #89. #15 remains deferred unless explicitly reopened.

## Defect / root-cause ledger retained

- `V3-ROUTER-001` — single synchronous router fixed URL/view drift.
- `V3-AUTH-GATE-001` — static Supabase version pin is architecture-auditable.
- `V3-SHELL-001` — brand and primary navigation selectors are distinct.
- `V3-TRANSFORM-OWNER-001` — orchestration no longer defines a competing Transform calculation owner.
- `V3-RECORDINGS-FREEZE-001` — one Audio owner + Recordings owner, explicit teardown and one-player regression.
- `V3-MEDIA-OWNER-001` — Media Library composes verified Recordings/Audio owners.
- `V3-GAMES-OWNER-001` — game lifecycle is centralized in `src/app/games.js`.
- `V3-RECALL-PACK-001` — Recall pack loading/validation/cache is isolated.
- `V3-TIMELINE-XP-001` — repeated failed Timeline checks cannot farm XP.
- `V3-STUDY-BOUNDARY-001` — Study public state stays behind orchestration/Lesson boundaries.
- `V3-STORY-BOOKKEEPING-001` — validator protects required status headings.
- `V3-WISDOM-ESCAPE-001` — malformed presentation escaping fixed before promotion.
- `V3-OPEN-REVIEW-OWNER-001` — Open Review cannot directly own Games recall persistence.
- `V3-OPEN-REVIEW-FOCUS-TEST-001` — corrected an invalid deterministic tie-category test fixture.
- `V3-OPEN-REVIEW-SPACING-TEST-001` — isolated spacing fixture from legitimately older overdue items.
- `V3-STEP-PEEK-SELECTOR-001` — Verse Peek metadata is namespaced away from Scripture `[data-verse]`.
- `V3-JKO-SEMANTIC-CACHE-001` — invalid live Japanese payloads are evicted before retry.
- `V3-JKO-TOUCH-001` — Japanese recovery controls enforce >=44px.
- `V3-SOURCE-LABEL-TEST-001` — corrected the new provenance edge matcher; no app change.
- `V3-SOURCE-LABEL-SELECTOR-TEST-001` — corrected the new provenance smoke Reader selector; no app change.

## Release rule

#90 passed the complete corrected functional suite on run `34130447654`. Its exact bookkeeping state must pass the complete accumulated suite again before `release/v3.25-source-provenance` may be frozen. Production v2, `main`, and production Cloudflare remain unchanged.
