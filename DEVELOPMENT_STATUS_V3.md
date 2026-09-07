# BibleQuest v3 Development Status

Updated: 2026-09-08 JST

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity matrix. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main` and production Cloudflare remain untouched.
- Current development branch: `feature/v3-study-core`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary push triggers are permitted only on isolated one-shot verification branches and are removed by resetting the branch to the exact clean candidate SHA after each gate.
- Latest frozen checkpoint remains `release/v3.26-doctrinal-safety` at `e223ac5e5022db2dc609e8fe15df9f9d020d4e75` until the v3.27 bookkeeping gate and freeze finish.
- Exact v3.26 bookkeeping run `34168229627` passed the complete accumulated suite before that freeze.
- #55 Private local notes functional implementation candidate: `14893c5987234325165b3990e4f513423f3c1992`.
- #55 functional verification run `34169365596` passed the complete accumulated suite.
- The temporary verification branch `verify/v3.27-private-notes` was reset to the exact clean implementation candidate after the green run, removing its push trigger.

## Progress summary

Inventory row states after the #55 functional gate:

| State | Count |
|---|---:|
| Regression-tested | 53 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 46 |
| Total | 100 |

Strict verified-or-better parity is **54/100**.

Official regression stability remains **53/100**. #55 is Verified, not Regression-tested, because the regression-promotion rule requires a later feature milestone to run the full suite with #55 still green.

Current promotions:
- #55 Private local notes — **Verified** after complete functional run `34169365596`; awaiting the v3.27 bookkeeping/release gate.
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

#90 remains owned by the immutable BibleQuest content provenance registry plus the existing Scripture and Recall source owners. It survived the complete #89 functional suite on run `34166910207` and the v3.26 bookkeeping suite on run `34168229627`, including architecture, edge, and 390px browser regressions.

Frozen checkpoint:
- `release/v3.25-source-provenance`
- SHA `04f20094a03cd0b189d1626ef4f372917ce599e3`
- bookkeeping run `34160651319` — fully green.

No source-label MutationObserver, `window.BQ*` source injector, direct storage access, or source-fetch path was reintroduced.

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
- Per-book Recall and Open Smart Review render BibleQuest context only after answer reveal and keep source/license separate.
- Shared Games/Adaptive, Story Journey checkpoints, Guided Study observation questions, and Daily Journey retrieval questions retain safety admission at their established service/content boundaries.
- Deep Questions and Wisdom remain non-spiritual-scoring workflows.
- Lesson and Progress ownership was not changed and no #89 XP scheme was introduced.

Permanent protection includes the doctrinal-safety validators plus edge and 390px browser regressions.

Verification history:
- Run `34166578446` exposed a stale architecture-validator assumption; validator contract was corrected, not runtime behavior.
- Run `34166769435` exposed a 38px global shell account control; the shell owner was corrected to the 44px mobile target.
- Run `34166910207` passed the complete accumulated functional suite.
- Run `34168229627` passed the exact v3.26 bookkeeping state before freeze.

## Milestone 14 — Private local notes

### #55 Private local notes — Verified

The implementation deliberately separates standalone Private Notes from Deep Questions' existing inline Lesson response. No second Lesson or Progress owner was created.

Clean v3 implementation:
- `src/app/private-notes.js` is the single standalone Private Notes state/orchestration owner.
- It consumes the existing `src/core/storage.js` boundary and owns only the namespaced `private-notes` record; feature/UI code never touches browser storage directly.
- Note IDs are deterministic (`note-1`, `note-2`, ...), timestamps are normalized, malformed persisted records fail safely, and duplicate/invalid records are discarded during normalization.
- Create, read/list, edit, delete, service recreation/reload, and local versioned JSON export are supported.
- Export schema is `biblequest.private-notes`, version 1.
- The Learn page routes to one `private-notes` route through the existing router.
- `src/features/private-notes/index.js` is presentation/event forwarding only.
- The UI explicitly states that v3.27 notes are private to the current device and are not uploaded or account-synced.
- #55 does not call Supabase/account APIs. Cloud sync remains #56 and is not partially implemented here.
- No XP, streak, mastery, spiritual score, or lesson-state mutation was invented for notes.

Permanent regression coverage:
- `tests/v3-private-notes-edge.mjs` — CRUD, normalization, deterministic IDs, reload, delete, export schema, invalid clock, and shared-storage-boundary requirements.
- `tests/v3-private-notes-smoke.mjs` — real 390px Learn → Notes workflow; create, reload, edit, JSON download, delete, >=44px targets, no horizontal overflow, no browser/page errors.
- `.github/workflows/v3-regression.yml` permanently includes both tests while remaining manual-only on the development branch.

Functional verification:
- Clean implementation candidate: `14893c5987234325165b3990e4f513423f3c1992`.
- Isolated verification trigger commit: `e3d67f3f562fe328fc3b34ed1f9efdd1e0dda831` — verification-only and never a release candidate.
- Run `34169365596` — complete accumulated architecture, edge, Playwright/browser/mobile, Transform, recordings, media, Recall, and Games suite fully green.
- After the run, `verify/v3.27-private-notes` was reset to the exact clean candidate, restoring manual-only workflow state.

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
- `V3-DOCTRINE-ARCH-VALIDATOR-001` — removed obsolete raw-only-allow validator contract and replaced it with reviewed-safety invariants.
- `V3-SHELL-TOUCH-001` — shell account button increased from 38px to the 44px mobile touch-target contract.

## Next major milestone

Finish the v3.27 bookkeeping gate and freeze #55 before beginning another feature.

After the v3.27 freeze, the default next core dependency is **#56 Cloud notes** because it should compose the now-verified local Notes model rather than create a parallel note schema. #56 must add account ownership/sync, guest isolation, conflict/error behavior, and offline/failure behavior through the existing API/session boundaries.

Before #56 implementation, inspect the recovered old cloud-note contract and current Supabase schema/API permissions. Do not invent a backend table or client-side trust model from assumptions.

Kids #38–40 and ministry/community work remain deferred while higher-priority core parity debt is being closed. Accessibility #86, reporting/moderation #87–88, Content Review #91, diagnostics/recovery #95–96, and PWA/offline #97–99 remain later candidates after dependency reassessment.

## Release rule

#55 passed its complete functional suite on run `34169365596`. The exact bookkeeping state must now pass the same full accumulated suite before `release/v3.27-private-local-notes` can be frozen. The verification trigger commit is never eligible as a release SHA. Production v2, `main`, and production Cloudflare remain unchanged.