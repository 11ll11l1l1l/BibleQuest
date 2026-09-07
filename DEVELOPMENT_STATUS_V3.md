# BibleQuest v3 Development Status

Updated: 2026-09-08 JST

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity matrix. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main` and production Cloudflare remain untouched.
- Current development branch: `feature/v3-study-core`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary push triggers are permitted only on isolated one-shot verification branches and are removed by resetting the branch to the exact candidate SHA after each gate.
- Latest frozen checkpoint is `release/v3.26-doctrinal-safety` at `e223ac5e5022db2dc609e8fe15df9f9d020d4e75`.
- Exact v3.26 bookkeeping run `34168229627` passed the complete accumulated suite before that freeze.
- Previous frozen checkpoint was `release/v3.25-source-provenance` at `04f20094a03cd0b189d1626ef4f372917ce599e3`; exact v3.25 bookkeeping run `34160651319` passed the complete accumulated suite.
- #89 Doctrinal safety/context functional run `34166910207` passed the complete accumulated suite.
- #89 exact green implementation candidate before bookkeeping: `827e5edc5af48bb76a805fcb3d546975bfc14ec1`.
- #89 exact v3.26 bookkeeping/release candidate: `e223ac5e5022db2dc609e8fe15df9f9d020d4e75`.

## Progress summary

Inventory row states after the #89 bookkeeping/release gate:

| State | Count |
|---|---:|
| Regression-tested | 53 |
| Verified | 0 |
| Implemented | 0 |
| Not started | 47 |
| Total | 100 |

Strict verified-or-better parity is **53/100**.

Official regression stability is **53/100** because the authoritative inventory now contains 53 rows in Regression-tested state. The earlier projected 52/100 post-v3.26 figure was stale bookkeeping language and is superseded by the actual inventory count.

Current promotions:
- #89 Doctrinal safety/context — **Regression-tested** after bookkeeping run `34168229627` and freeze at `release/v3.26-doctrinal-safety`.
- #90 Source labels/attribution — **Regression-tested** after surviving the later #89 full functional and bookkeeping suites.
- #17 NLT licensed-link path — Regression-tested.
- #16 Japanese vocabulary learning — Regression-tested.
- #15 Japanese furigana — Not started and intentionally deferred.

## Milestone 11 — Reader language/source completion

Reader/source parity remains closed through the recovered NLT behavior except the intentionally deferred furigana row.

- #14 Japanese 口語訳 — Regression-tested; frozen through `release/v3.22-japanese-kougo`.
- #16 Japanese vocabulary learning — Regression-tested; frozen through `release/v3.23-japanese-vocabulary`.
- #17 NLT licensed-link — Regression-tested; frozen through `release/v3.24-nlt-licensed`.
- #15 Japanese furigana — intentionally deferred; no `kuromoji`, CDN tokenizer, legacy global, or direct DOM mutation runtime may leak into adjacent features.

## Milestone 12 — Source provenance

### #90 Source labels/attribution — Regression-tested

#90 remains owned by the immutable BibleQuest content provenance registry plus the existing Scripture and Recall source owners. It survived the complete #89 functional suite on run `34166910207` and the v3.26 bookkeeping suite on run `34168229627`, including its architecture, edge, and 390px browser regressions.

Frozen checkpoint:
- `release/v3.25-source-provenance`
- SHA `04f20094a03cd0b189d1626ef4f372917ce599e3`
- bookkeeping run `34160651319` — fully green.

No source-label MutationObserver, `window.BQ*` source injector, direct storage access, or source-fetch path was reintroduced by #89.

## Milestone 13 — Doctrinal safety/context

### #89 Doctrinal safety/context — Regression-tested

Recovered legacy behavior is represented by one pure doctrinal-safety owner rather than the old runtime/global injection layer.

Classification contract:
- `TEXTUAL_FACT` — factual Scripture recall that may participate in normal binary/scored play.
- `PASSAGE_CONTEXT` — passage-sensitive comprehension tied to an explicit Scripture passage. It may participate in recall only with BibleQuest contextual framing and must not be presented as a complete universal doctrinal formulation.
- `INTERPRETIVE_OR_DOCTRINAL` — universal/disputed doctrinal claims are quarantined from normal binary/scored play until rewritten or pastor-reviewed.

Authority order retained for framing:
1. Scripture text and immediate/broader context.
2. Official CAMACOP Statement of Faith.
3. Alliance World Fellowship where compatible and CAMACOP is silent.
4. Pastor-reviewed local teaching.
5. Secondary study resources such as unfoldingWord, STEPBible, OpenBible.info, and Open Bible Stories as aids only.

Clean v3 implementation:
- `src/core/doctrinal-safety.js` is the single doctrinal classification/admission owner.
- `src/core/recall-packs.js` re-evaluates imported unfoldingWord questions through the current policy and never trusts a stale embedded `safety:{action:"allow"}` tag.
- Missing/unsafe imported safety metadata fails closed. High-risk universal/disputed doctrine is quarantined.
- A reviewed `PASSAGE_CONTEXT` Recall item exposes a separate immutable `contextNote`; the imported answer and Scripture reference are preserved unchanged.
- Per-book Recall renders the BibleQuest context note only after answer reveal and keeps unfoldingWord source/license separate.
- `src/app/open-review.js` transports the trusted context note but deliberately withholds answer, reference, and context note before reveal.
- Open Smart Review renders the note only after reveal and does no doctrinal classification in its UI.
- Shared Games/Adaptive, Story Journey checkpoints, Guided Study observation questions, and Daily Journey retrieval questions retain safety admission at their established service/content boundaries.
- Deep Questions remains non-binary and does not score spiritual quality.
- Wisdom Situations remains a strongest-supported-judgment exercise; +8 XP/+1 situation is participation-based and does not increment `quizCorrect` merely for selecting a doctrinally preferred answer.
- Lesson and Progress ownership was not changed and no #89 XP scheme was introduced.
- Learn retains the exact `Learn` heading and safety/source transparency.

Permanent protection:
- `scripts/validate-v3-doctrinal-safety.mjs`
- updated `scripts/validate-v3-architecture.mjs`
- `tests/v3-doctrinal-safety-edge.mjs`
- updated `tests/v3-recall-packs-edge.mjs`
- `tests/v3-doctrinal-context-presentation-edge.mjs`
- `tests/v3-doctrinal-safety-smoke.mjs`
- `tests/v3-doctrinal-context-presentation-smoke.mjs`

Functional verification history:
- Run `34166578446` — failed immediately in the general architecture validator because it still required the obsolete pre-#89 raw `row?.safety?.action!=='allow'` Recall contract. Root cause was a stale validator, not runtime classification. The validator now requires current re-evaluation via `reviewImportedRecall`, quarantine filtering, trusted context projection, and rejects raw imported allow-tag admission.
- Run `34166769435` — all architecture/edge checks and early browser regressions passed, then the existing doctrinal mobile smoke exposed the global shell account button at 38px. Root cause was `.bq-session-chip{min-height:38px}` outside Wisdom’s already-correct 44px controls. The shell owner now enforces 44px and the existing mobile regression remains permanent coverage.
- Run `34166910207` — complete accumulated suite fully green through Games, including the real 390px Acts per-book Recall → Review again → Open Smart Review passage-context reveal path.

Bookkeeping/release verification:
- Candidate `e223ac5e5022db2dc609e8fe15df9f9d020d4e75` added the #89 architecture owner/boundaries and aligned the four bookkeeping documents without changing runtime code.
- Isolated branch `verify/v3-doctrinal-safety-bookkeeping` temporarily enabled push only for the verification run.
- Run `34168229627` passed the complete accumulated architecture, edge, Playwright, browser, mobile, Transform, recordings, media, Recall, and Games suite.
- The verification branch was reset back to the exact clean candidate SHA, removing the temporary push-trigger commit.
- `release/v3.26-doctrinal-safety` was created and SHA-verified at exactly `e223ac5e5022db2dc609e8fe15df9f9d020d4e75`.

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
- `V3-SOURCE-LABEL-TEST-001` — corrected the provenance edge matcher; no app change.
- `V3-SOURCE-LABEL-SELECTOR-TEST-001` — corrected the provenance smoke Reader selector; no app change.
- `V3-DOCTRINE-ARCH-VALIDATOR-001` — run `34166578446`; removed obsolete raw-only-allow validator contract and replaced it with reviewed-safety invariants.
- `V3-SHELL-TOUCH-001` — run `34166769435`; shell account button increased from 38px to the 44px mobile touch-target contract.

## Next major milestone

v3.26 is frozen. Reassess remaining study/core parity debt against the authoritative inventory, recovered loaded old source, dependencies, partial v3 work, user value, and architectural risk before choosing the next implementation. Do not blindly start Kids #38–40 or ministry/devotional work while higher-value core Bible-study parity debt remains.

Potential core candidates to assess include #55 private local notes, #56 cloud notes, #86 accessibility support, #87 content reporting, #88 content moderation, #91 Content Review workbench, #95 client diagnostics, #96 operational recovery/error boundary, and #97–99 PWA/offline behavior. Also assess whether any remaining Bible-content path depends on content-review infrastructure.

## Release rule

#89 passed the complete functional suite on run `34166910207` and the exact v3.26 bookkeeping state passed the complete accumulated suite on run `34168229627`. `release/v3.26-doctrinal-safety` is frozen at `e223ac5e5022db2dc609e8fe15df9f9d020d4e75`. Production v2, `main`, and production Cloudflare remain unchanged.
