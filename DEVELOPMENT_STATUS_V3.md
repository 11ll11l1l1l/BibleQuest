# BibleQuest v3 Development Status

Updated: 2026-09-08 JST

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity matrix. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main` and production Cloudflare remain untouched.
- Current development branch: `feature/v3-study-core`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary push triggers are permitted only on isolated one-shot verification branches and are removed by resetting the branch to the exact clean candidate SHA after each gate.
- Latest frozen checkpoint is `release/v3.31-client-diagnostics` at `61af8aaee121356d6ef0388130df2b545ff943d9`.
- Exact v3.31 bookkeeping run `34208493773` passed all 82 accumulated job steps against that SHA before the freeze.
- Previous checkpoint `release/v3.29-congregation-membership` is frozen at `7bf024ba4f2b6501f6fb9e87ddc010c84426c7d1`; bookkeeping run `34200768014` was fully green.
- #66 Congregation membership/roles clean functional candidate: `87ed099fb9b0a18f0f5b85b9476a16af6bbb5349`.
- #66 functional run `34185569051` passed the complete accumulated suite and explicitly asserted that clean SHA.

## Progress summary

Inventory row states after the #95 functional gate:

| State | Count |
|---|---:|
| Regression-tested | 57 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 42 |
| Total | 100 |

Strict verified-or-better parity is **58/100**.

Official regression stability is **57/100**. #96 advanced to Regression-tested after surviving the later #95 complete functional suite. #95 remains Verified until a later feature milestone passes the complete suite with it still green.

Current promotions:
- #95 Client diagnostics — **Verified** after functional run `34204562845` and exact bookkeeping run `34208493773`; frozen in v3.31.
- #96 Operational recovery/error boundary — **Regression-tested** after surviving #95 run `34204562845`; frozen in v3.30.
- #66 Congregation membership/roles — **Regression-tested** after surviving #96 run `34202531302`; frozen in v3.29.
- #56 Cloud Notes — **Regression-tested** after surviving the later #66 full functional suite; frozen in v3.28.
- #55 Private local notes — **Regression-tested**; frozen in v3.27.
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

### #55 Private local notes — Regression-tested

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
- #55 does not call Supabase/account APIs. Regression-tested #56 Cloud Notes remains a separate authenticated remote capability and never auto-uploads these device-local notes.
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
- Bookkeeping run `34169778300` passed before `release/v3.27-private-local-notes` was frozen at `e8b58b1bd9c9053243bb5d394c2d2afae44c9f59`.
- #55 later survived the #56 and #66 full suites and is Regression-tested.

## Milestone 15 — Cloud Notes

### #56 Cloud Notes — Regression-tested

- `src/app/cloud-notes.js` is the single authenticated remote-note owner; `src/core/api.js` is the only Supabase boundary.
- The recovered `public.bible_notes` RLS/user-ownership contract is reused without a new migration.
- Authenticated Scripture-linked CRUD, explicit stale-write conflict handling, signed-out/local-preview recovery, and 390px behavior are permanently covered.
- Private Notes remain device-local and are never uploaded, merged, or converted automatically.
- Functional run `34183773524` and bookkeeping run `34184699391` passed the complete accumulated suite.
- `release/v3.28-cloud-notes` is frozen at `1b8cb0a4847b1fc633ce23412982c91c38825148`.
- #56 survived the later #66 full functional run and is Regression-tested.

## Milestone 16 — Congregation membership/roles

### #66 Congregation membership/roles — Regression-tested

- `src/app/congregation-membership.js` is the single membership/role orchestration owner.
- `src/core/api.js` owns the RLS-protected membership/congregation reads and trusted `bq-join` invocation.
- Recognized congregation roles are member, facilitator, leader, pastor, and admin; platform roles remain separate.
- Unknown roles and unsupported client capabilities fail closed. Client gates never replace server/RLS authorization.
- Signed-out/local-preview flows issue no membership operation; join reloads server-backed membership and never invents a local role.
- Architecture, edge, and 390px browser coverage is permanently included in the accumulated workflow.
- Clean functional candidate `87ed099fb9b0a18f0f5b85b9476a16af6bbb5349` passed complete run `34185569051`.
- Exact candidate `7bf024ba4f2b6501f6fb9e87ddc010c84426c7d1` passed bookkeeping run `34200768014` and is frozen at `release/v3.29-congregation-membership`.
- #66 survived the later #96 complete functional suite and is Regression-tested.

## Milestone 17 — Operational recovery/error boundary

### #96 Operational recovery/error boundary — Regression-tested

- Recovered v2 behavior and the current v3 shell/router composition select #96 ahead of #67 Community Bridge because failure containment supports every remaining route.
- `src/app/operational-recovery.js` is the single active recovery-state and Retry/Home lifecycle owner.
- Router remains the only navigation/history owner; Shell remains presentation/event forwarding only.
- #95 Client diagnostics, offline/PWA behavior, backup/reset, global event interception, DOM surveillance, and script reinjection remain excluded.
- Exact clean candidate `90cd1d15db7baeacf9240514d6d8b2da1d68b784` passed all 79 job steps in functional run `34202531302`.
- The isolated trigger commit `08e187236e384b41ed50d5261d20d62c2554196e` explicitly checked out and asserted the clean candidate, then the verification branch was reset to remove the trigger.
- Exact bookkeeping candidate `7ec0290a50086112210c4c301db3288b970a2cc0` passed run `34203169381` and is frozen at `release/v3.30-operational-recovery`.
- #96 survived the later #95 complete functional suite and is Regression-tested.

## Milestone 18 — Client diagnostics

### #95 Client diagnostics — Verified

- Recovered stable module/network codes compose with #96 through one `src/core/client-diagnostics.js` classification owner.
- `src/core/api.js` owns the same-origin cache-busting probe; Diagnostics never calls `fetch` or Supabase directly.
- Browser-offline, host-unreachable, reachable-module, and unknown states are narrow, immutable, and exclude arbitrary error data.
- No global error listeners, freeze watchdog, DOM injector, backend diagnostic write, or `window.BQDiagnostics` compatibility path is restored.
- Exact clean candidate `1f8d7e927660ac4b8349f015c1a8b5f2f7210b0b` passed all 82 job steps in functional run `34204562845`.
- The isolated trigger commit `e2926cacab280f66844d6b8156b5861d2f72115b` explicitly checked out and asserted the candidate, then the branch was reset to remove the trigger.
- Exact bookkeeping candidate `61af8aaee121356d6ef0388130df2b545ff943d9` passed all 82 job steps in run `34208493773` and is frozen at `release/v3.31-client-diagnostics`.

## Milestone 19 — PWA install/manifest

### #97 PWA install/manifest — implementation active

- `manifest.webmanifest` is the single deployment-relative app identity and standalone launch contract.
- `src/app/pwa-install.js` is the only install-prompt lifecycle owner; More presents its state and forwards the user action.
- #97 intentionally adds no service worker, Cache Storage, offline fallback, opened-pack cache, or network interception; those remain #98/#99 work.
- Permanent architecture, lifecycle edge, and 390px browser coverage is included in the accumulated workflow.
- Official counts remain 58/100 strict parity and 57/100 stability until the exact #97 functional gate passes.

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
- `V3-CLOUD-NOTES-OWNER-001` — remote note state composes the API/session boundaries and remains separate from device-local Private Notes.
- `V3-CONGREGATION-OWNER-001` — membership normalization, join orchestration, and client role projection are centralized without replacing server authorization.
- `V3-RECOVERY-OWNER-001` — route failure state and Retry/Home action lifecycle are centralized without duplicating Router or Shell ownership.
- `V3-DIAGNOSTICS-OWNER-001` — module/network classification is centralized while same-origin probing remains inside the API boundary.
- `V3-PWA-INSTALL-OWNER-001` — manifest identity and browser install prompting are bounded without prematurely restoring the legacy offline runtime.
- `V3-PWA-MANIFEST-ICON-001` — the first #97 candidate declared only an `any`-size SVG; explicit 192px/512px PNG and maskable requirements plus real-dimension regressions were added before promotion.

## Next major milestone

Complete #97 PWA install/manifest through its exact functional and bookkeeping suites, then freeze only the verified clean SHA. Continue to #98 Offline Shell only in a later milestone.

Kids #38–40 remain explicitly deferred. Production deployment remains out of scope.

## Release rule

#97 remains Not started in the authoritative inventory until its exact clean functional candidate passes the complete accumulated suite. The verification trigger commit is never eligible as a release SHA. Production v2, `main`, and production Cloudflare remain unchanged.
