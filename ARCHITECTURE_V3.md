# BibleQuest v3 Architecture Contract

BibleQuest v3 uses rebuild-and-verify, not patch-and-accumulate. Feature parity and stability are separate acceptance goals. Every mutable function has one owner; features compose those owners through explicit interfaces rather than duplicating state, scoring, storage, navigation, media, or backend logic.

## Active single owners

- `src/app/bootstrap.js` — composition and one boot
- `src/app/router.js` — navigation/history
- `src/app/store.js` — global application state
- `src/core/storage.js` — browser persistence boundary
- `src/core/api.js` — Supabase/remote calls
- `src/core/client-diagnostics.js` — stable client diagnostic codes, connection-probe evidence/cache, and module-versus-network classification
- `src/app/session.js` — auth/session/password lifecycle
- `src/app/account.js` — signup/recovery/device workflows
- `src/core/bible.js` — Bible sources/packs/search/external licensed-translation handoffs/original-language context-pack loading and live Japanese chapter-source normalization
- `src/app/reader.js` — Reader state/navigation/read marking and Reader-facing context/source delegation
- `src/app/japanese-vocabulary.js` — Japanese vocabulary-learning preference and curated term lookup
- `src/core/content-provenance.js` — immutable BibleQuest-authored content provenance registry
- `src/core/doctrinal-safety.js` — doctrinal/content-safety classification, reviewed admission and context/quarantine policy
- `src/core/progress.js` — XP/streak/activity/badges/counters/events
- `src/core/recall-packs.js` — Recall pack loading/validation/cache and unfoldingWord source/license metadata
- `src/engines/lesson.js` — shared lesson/session/step/response lifecycle and persistence
- `src/app/study.js` — Guided Study orchestration
- `src/app/deep-questions.js` — Deep Questions orchestration
- `src/app/story-journey.js` — Story Journey orchestration
- `src/app/wisdom-situations.js` — Wisdom Situations orchestration
- `src/app/adaptive-learning.js` — Adaptive retrieval evidence/mastery/selection orchestration
- `src/app/open-review.js` — Open Smart Review queue/spacing orchestration
- `src/app/private-notes.js` — standalone private local-note CRUD/order/export state and persistence contract
- `src/app/cloud-notes.js` — authenticated remote Scripture-note validation/cache/concurrency orchestration
- `src/app/congregation-membership.js` — authenticated congregation membership/role orchestration and fail-closed client capability projection
- `src/app/operational-recovery.js` — active route-failure containment and Retry/Home action lifecycle
- `src/app/daily-mission.js` — Daily Journey orchestration
- `src/engines/transform.js` — Transform state/scoring/persistence
- `src/app/transform.js` — Transform cross-service orchestration
- `src/app/audio.js` — browser media/player lifecycle
- `src/app/recordings.js` — protected recording list/source lifecycle
- `src/app/media-library.js` — Media Library orchestration
- `src/app/games.js` — Games launch/round/scoring/review/result lifecycle and `games-recall` ownership

`src/ui/source-labels.js` is a shared presentation helper, not a data owner. It renders source/provenance UI only from metadata supplied by the appropriate owner.

## Shared Bible-study boundaries

1. `src/engines/lesson.js` is the only reusable lesson lifecycle owner. Guided Study, Deep Questions, Story Journey, Wisdom Situations, Adaptive Learning, Open Review, and future study workflows reuse it when the contract fits.
2. `src/core/progress.js` is the only XP/streak/activity/counter/event owner. Feature code cannot mutate progress directly.
3. `src/core/storage.js` is the only browser storage implementation boundary. No feature uses direct `localStorage` or `sessionStorage`.
4. `src/core/recall-packs.js` is the only owner that loads, validates, caches, or addresses unfoldingWord question-pack files.
5. `src/core/bible.js` is the only owner that loads or addresses bundled Bible packs, live Bible sources, licensed external translation handoffs, and original-language context packs.
6. Static feature/content modules contain definitions only. Feature `index.js` modules are presentation/event-forwarding only.
7. Open reflection/application text is never converted into a spiritual-quality score, moral rank, diagnosis, or measure of divine approval.
8. Retained rewards are implemented only when recovered from the old behavior. No parity feature invents a new XP scheme.
9. Deterministic Progress identities and Lesson attempt identities must prevent reload/reopen duplication.
10. Legacy `window.BQ*` globals, MutationObserver feature injection, direct DOM surveillance, competing global runtimes, and direct backend/storage shortcuts are forbidden in v3.

## Reader / STEPBible Context Lab boundaries

1. #20 retains the old in-app Hebrew & Greek Context Lab rather than reducing parity to an external STEP link.
2. `src/core/bible.js` alone loads `data/packs/context/manifest.json`, follows manifest-owned context-pack paths, validates/normalizes lexical data, caches it, and combines it with the BSB verse/context.
3. `src/app/reader.js` exposes only Reader-facing delegation through `contextChapter()` and `lexicalContext()`. Context browsing must not mutate the main Reader passage or read-progress state.
4. `src/features/reader/context.js` is presentation/event forwarding only. It cannot fetch packs, access Storage/Progress/backend APIs, create a second lexical engine, use MutationObserver, or publish `window.BQ*` globals.
5. `src/ui/context-lab.css` is isolated presentation/mobile styling. The Context Lab must remain usable at 390px with approximately 44px interactive targets and no horizontal overflow.
6. Retained lexical/context fields are Strong’s ID, original-language identification, lemma, transliteration, morphology, brief gloss, BSB previous/current/next context, same-book tagged usage references, coverage/source/license/limits, and an external verse-specific STEP handoff.
7. Lexical fields are study aids, not a reconstructed word-for-word interlinear and not theological conclusions. The UI keeps the recovered safety guidance: read sentence/paragraph first; a lexicon supplies a semantic range that grammar/context narrow; do not build doctrine from etymology or one Strong’s entry alone.
8. Missing context data must degrade inside Reader with a controlled unavailable state. Malformed source data must produce a controlled Bible-data error rather than silent corruption.
9. Context Lab study has no recovered XP/progress reward, so v3 does not invent one.
10. Verse Peek metadata is namespaced as `data-peek-verse`; the established `[data-verse]` selector remains exclusive to Scripture verse buttons.

## Reader / Japanese 口語訳 boundaries

1. `src/core/bible.js` remains the single Bible-source owner for #14. No Japanese-specific module may directly call GetBible or create another Scripture cache.
2. Japanese `口語訳聖書 (1954/1955)` is represented as a live chapter-only translation. It must not masquerade as a bundled whole-book pack.
3. The recovered source path is `https://api.getbible.net/v2/japkougo/<canonical-book-number>/<chapter>.json`. Canonical book numbers are derived from the existing `BIBLE_BOOKS` order; a second book-number mapping is forbidden.
4. Returned verse arrays or object-shaped verse collections are normalized and sorted by `src/core/bible.js`. Scripture text is preserved except surrounding transport whitespace; v3 must not rewrite, modernize, annotate inside, or silently replace the source text.
5. A live Japanese chapter is cacheable only after semantic validation produces readable verses. Network/JSON failures and HTTP-200-but-invalid/empty verse payloads must evict the source cache so Retry performs a genuine new request.
6. `src/app/reader.js` owns selected translation/book/chapter persistence. Japanese source code cannot use direct `localStorage`.
7. Source failure must remain explicit. Reader may offer Retry and an explicit `Use BSB` action, but it must never silently substitute BSB or fabricate Japanese Scripture.
8. Reference navigation/search may load the requested live chapter. Whole-Bible Japanese text search is not allowed to fan out across all 66 books unless a future explicitly verified source contract is introduced.
9. Selecting/loading Japanese Scripture carries no recovered XP/progress reward and must not generate one.
10. Japanese recovery/navigation controls remain >=44px on the 390px mobile path and must not create horizontal overflow.
11. `scripts/validate-v3-japanese-kougo.mjs`, `tests/v3-japanese-kougo-edge.mjs`, and `tests/v3-japanese-kougo-smoke.mjs` permanently protect these boundaries.
12. #15 furigana is intentionally deferred. Old `kuromoji` CDN injection, direct DOM mutation, and `window.BQJapaneseLearning` must not leak into #14 or #16 merely because they existed in the legacy combined module.

## Reader / Japanese vocabulary boundaries

1. #16 reuses the curated vocabulary definitions recovered from the loaded legacy `japanese-learning.js` but does not recreate its combined furigana/tokenizer runtime.
2. `src/app/japanese-vocabulary.js` alone owns the persisted vocabulary-learning enabled preference and curated note lookup. It uses the central Storage boundary and cannot access DOM, network, Progress, or Scripture sources.
3. `src/features/reader/vocabulary-content.js` is static definition data only. The recovered 27 terms retain term, reading, learner-friendly explanation, fuller meaning, and optional English gloss.
4. `src/features/reader/vocabulary.js` is presentation-only. It renders the control and note block but cannot access Storage, network, Progress, `kuromoji`, or legacy globals.
5. Reader exposes vocabulary only when Japanese 口語訳 is selected. Verse selection continues to use the existing Verse Peek interaction; vocabulary notes are composed inside Verse Peek rather than creating another overlay or competing verse-click owner.
6. The vocabulary enabled preference persists through `src/core/storage.js`; selected Reader translation/book/chapter remains owned by `src/app/reader.js`.
7. A selected verse shows at most three curated matching notes, preferring longer terms before contained shorter terms. If no curated term matches, the UI shows a controlled empty-learning state and must not fabricate a reading or definition.
8. The UI must state that readings, modern-language explanations, and English glosses are study aids and are not Scripture text.
9. Vocabulary browsing has no recovered XP/progress reward, so v3 does not invent one.
10. #15 furigana remains deferred. `kuromoji`, CDN script injection, `data-jp-furigana`, and `window.BQJapaneseLearning` are forbidden from the #16 implementation.
11. `src/ui/japanese-vocabulary.css` owns the isolated vocabulary/mobile presentation. The control must remain >=44px and the 390px Reader path must not overflow horizontally.

## Reader / NLT licensed-link boundaries

1. #17 reproduces the actually loaded legacy NLT behavior: NLT is a selectable `licensed-link` mode, not a bundled Bible pack and not a hidden live-text API.
2. `src/core/bible.js` alone owns NLT translation metadata and exact BibleGateway passage URL construction through `licensedPassage()`.
3. BibleQuest must not fetch, cache, store, synthesize, or redistribute NLT verse text. `loadChapter('nlt',...)` returns canonical passage metadata, an empty immutable verse list, and the licensed external handoff only.
4. NLT `loadBook()` and in-app NLT `search()` are rejected explicitly. Missing redistributed text must never trigger BSB substitution or another translation fallback.
5. `src/app/reader.js` remains the sole selected translation/book/chapter persistence owner. NLT mode retains the normal Book, Chapter, Previous, and Next navigation state.
6. Because BibleQuest has not displayed the NLT Scripture text, NLT mode exposes no verse buttons and no Mark Read UI. `src/app/reader.js` also blocks `markRead()` for all `licensed-link` translations so programmatic calls cannot invent chapter-read XP.
7. NLT mode does not expose in-app NLT text search. The UI explains that search stays in the licensed external reader.
8. The external NLT link must open the exact selected passage in a new tab with `noopener noreferrer`, preserving BibleQuest state for safe return.
9. NLT source/license attribution must be visible. No private translation API key belongs in the browser.
10. Browsing or opening NLT licensed passages has no recovered XP/progress reward and v3 must not invent one.
11. `scripts/validate-v3-nlt-licensed.mjs`, `tests/v3-nlt-licensed-edge.mjs`, the general Reader regressions, and `tests/v3-nlt-licensed-smoke.mjs` permanently protect these boundaries, including the 390px no-overflow path.

## Source provenance boundaries

1. #90 uses `src/core/content-provenance.js` as the single immutable registry for BibleQuest-authored content categories only. It does not own Scripture translation metadata or third-party source/license metadata.
2. The registry distinguishes study/application prose (`bq-study`), retelling (`bq-retelling`), wisdom/application material (`bq-wisdom`), BibleQuest-authored recall/context questions (`bq-recall`), and game material (`bq-game`). Each definition explicitly states that the material is not quoted Scripture/Bible translation text.
3. `src/core/bible.js` remains the sole owner of Bible translation source/license/attribution metadata. Reader and the Learn source guide consume that metadata rather than copying translation names or licenses into the source-label helper.
4. `src/core/recall-packs.js` remains sole owner of unfoldingWord Translation Questions source/license metadata and exposes immutable `sourceInfo()` without loading a question pack.
5. `src/ui/source-labels.js` is presentation-only. It renders `sourceLabel()` and `sourceGuide()` from supplied metadata and cannot fetch sources, use Storage, inject globals, watch the DOM, or duplicate known translation/Recall source names.
6. Learn retains the exact `Learn` heading and receives Reader translation metadata plus Recall `sourceInfo()` through `src/app/bootstrap.js`. The guide states the reference-vs-quotation rule: a Scripture reference is not presented as though it were a quotation.
7. Guided Study, Deep Questions, Wisdom Situations, Adaptive Learning, Daily Journey, Story Journey, and Games render the appropriate BibleQuest provenance through the shared helper. Story Journey must distinguish retelling scenes from checkpoint questions.
8. Per-book Recall and Open Review retain actual unfoldingWord source/license metadata from the Recall owner. They must not be relabeled as BibleQuest-authored questions merely because they share recall interactions.
9. Existing Reader, STEPBible, Japanese 口語訳, Japanese vocabulary, and NLT source labels remain owned by their established services. #90 composes them; it does not create a competing source registry.
10. The historical MutationObserver/global source-label injector is reference-only. `MutationObserver`, `window.BQ*`, direct local/session storage, and direct source fetching are forbidden in the #90 implementation.
11. `scripts/validate-v3-source-labels.mjs`, `tests/v3-source-labels-edge.mjs`, and `tests/v3-source-labels-smoke.mjs` permanently protect ownership, escaping, source composition, explicit Scripture-vs-authored distinctions, real 390px rendering, and no horizontal overflow.
12. Source/provenance labels are transparency metadata only. They do not alter question correctness, XP, mastery, doctrinal classification, Lesson state, or Progress state.

## Doctrinal safety / context boundaries

1. `src/core/doctrinal-safety.js` is the single policy owner for doctrinal/content classification and admission.
2. The three categories are `TEXTUAL_FACT`, `PASSAGE_CONTEXT`, and `INTERPRETIVE_OR_DOCTRINAL`.
3. Binary/scored Bible content must be reviewed before admission.
4. `PASSAGE_CONTEXT` may remain usable when tightly tied to an explicit passage but must retain contextual framing.
5. `INTERPRETIVE_OR_DOCTRINAL` is quarantined from normal binary/scored play until rewritten or pastor-reviewed.
6. `src/core/recall-packs.js` re-reviews imported unfoldingWord questions using `reviewImportedRecall`.
7. Imported `safety.action="allow"` is not authoritative and cannot bypass the policy owner.
8. Recall Pack may expose a separate immutable `contextNote` for reviewed contextual questions.
9. Third-party answer, reference, and source/provenance remain distinct from the BibleQuest context note.
10. Per-book Recall and Open Review reveal contextual framing only after answer reveal.
11. UI modules only render owner-supplied safety/context metadata. They do not classify wording.
12. Guided Study, Story Journey, Daily Mission, and other binary Bible-content features use `reviewAuthoredBinary` + `assertBinaryScorable`.
13. Deep Questions and Wisdom use neutral review contracts and do not convert open interpretation/application into doctrinal correctness scoring.
14. Wisdom must not emit `quizCorrect`.
15. Lesson and Progress remain doctrinal-policy agnostic.
16. Doctrinal safety introduces no new XP or reward rules.
17. Source/provenance remains separate from doctrinal classification.
18. unfoldingWord is a study/reference source and not CAMACOP doctrinal authority.
19. Legacy global/fetch/MutationObserver doctrinal injection is forbidden, including `window.BQ_DOCTRINAL_SAFETY`, `window.BQ_DOCTRINAL_CONTEXT`, global fetch overrides, `runtime-safety.js`, DOM surveillance, and duplicate regex classifiers.
20. Permanent regression protection includes `scripts/validate-v3-doctrinal-safety.mjs`, `tests/v3-doctrinal-safety-edge.mjs`, `tests/v3-doctrinal-context-presentation-edge.mjs`, `tests/v3-doctrinal-safety-smoke.mjs`, `tests/v3-doctrinal-context-presentation-smoke.mjs`, and Recall Pack regressions.

## Guided Study / Deep Questions / Story Journey / Wisdom

- Guided Study uses `src/app/study.js` + Lesson + Progress/Reader interfaces; completion has no invented XP and personal reflection is unscored.
- Deep Questions uses `src/app/deep-questions.js` + Lesson/Reader; its inline private response is Lesson-owned and remains separate from #55 standalone Private Notes. It is not migrated into or overwritten by the standalone Notes store.
- Story Journey uses `src/app/story-journey.js` + Lesson/Progress/Reader. Retained checkpoint reward is +15 XP correct / +4 incorrect; correct contributes one `quizCorrect`.
- Wisdom uses `src/app/wisdom-situations.js` + Lesson/Progress. Retained reward is +8 XP and +1 `situations` for each answered attempt regardless of strongest/weaker choice. Strongest-option selection does not add `quizCorrect` or become a spiritual-quality score.

## Adaptive Learning boundaries

1. `src/features/games/content.js` remains the single q1–q24 static question source; Adaptive imports it rather than copying a bank.
2. `src/app/adaptive-learning.js` alone owns Adaptive retrieval evidence, category mastery, Games-event ingestion, ranking, seven-question selection, adaptive review list, attempt identity, session history, and the read-only `reviewFocusCategory()` signal.
3. Adaptive uses one namespaced `adaptive-learning` record through Storage. Lesson owns question lifecycle and resume/reload. Progress owns rewards.
4. Retained reward is +10 XP correct / +3 incorrect; correct contributes one `quizCorrect`.
5. Correct Adaptive retrieval spacing is approximately 1 → 3 → 7 → 14 → 30 days; a miss is due immediately.
6. A seven-question Smart Review uses retained evidence including review flag, due/unseen state, historical miss ratio, category mastery, context/connection mode, and bounded random tie-breaking. Where possible no category supplies more than three questions.
7. Adaptive mastery is retrieval-practice evidence only: +5 correct / +2 incorrect, capped at 100. It cannot be described as spiritual quality.
8. Normal `game.question` events may be ingested as retrieval evidence without a second XP award or Adaptive mastery credit.
9. `reviewFocusCategory()` is read-only. Minimum-mastery ties rotate deterministically by date; Open Review can consume the result but cannot mutate Adaptive mastery.

## Open Smart Review boundaries

1. `src/app/open-review.js` is the single #54 coordinator. It owns its seven-item queue assembly, `open-review` spaced-history record, attempt identity, due scheduling, self-rating reconciliation, and completion summaries.
2. Queue priority is retained: scheduled/due Open Review items → existing Games per-book review IDs → unseen approved items from the Adaptive weakest category → wider fresh-pack fallback only if necessary.
3. `src/core/recall-packs.js` supplies approved pack data. Open Review cannot fetch pack paths itself and persists only item identity/retrieval statistics; question/answer/source text is rehydrated on resume.
4. `src/app/games.js` remains sole owner of per-book Recall review IDs. Cross-feature access is limited to immutable `recallReviewQueue()` and idempotent `syncRecallReviewItem(code,id,needsReview)`.
5. `src/app/adaptive-learning.js` remains sole weak-area/mastery owner. Open Review consumes only `reviewFocusCategory()`.
6. Lesson owns the interactive lifecycle as 14 alternating steps: seven question-only memory prompts and seven unscored self-rating steps. Leave/return, reload, progression, response locking, and completion remain Lesson responsibilities.
7. Before reveal, the public Open Review item snapshot contains the question but not its answer/reference. Reveal advances to the rating step, where source answer/reference may be displayed.
8. Retained reward is +1 XP for `Review again` and +5 XP for `Got it`; only Got it contributes one `quizCorrect`.
9. `Review again` resets streak and is due immediately. Successive Got it ratings space approximately 1 → 3 → 7 → 14 → 30 days.
10. Progress event identity is `open-review:<attemptId>:item:<bookCode>:<itemId>`, preventing duplicate rating rewards on reload/reopen.
11. `src/features/open-review/index.js` is presentation/event forwarding only; `src/ui/open-review.css` owns feature styling and 390px mobile behavior.
12. The historical direct-localStorage/global-overlay/MutationObserver Open Review runtime is reference-only and must not be recreated.

## Private local notes boundaries

1. `src/app/private-notes.js` is the single owner for standalone #55 Private Notes CRUD, note identity/order, persistence normalization, and export data.
2. It uses `src/core/storage.js` and the single namespaced `private-notes` record. No Private Notes feature or UI may call `localStorage` or `sessionStorage` directly.
3. `src/features/private-notes/index.js` is presentation/event forwarding only; `src/ui/private-notes.css` owns feature presentation/mobile behavior.
4. #55 is device-local only. It cannot call `src/core/api.js`, Supabase, account/session mutations, or invent a cloud table/path.
5. #56 Cloud Notes is a separate authenticated remote capability recovered from the existing `public.bible_notes` backend contract. It must not auto-migrate #55 notes, reuse `private-notes` persistence, or reinterpret deterministic local `note-N` IDs as cloud UUIDs.
6. Deep Questions' inline private response remains a Lesson response. It is intentionally separate from standalone #55 notes unless a future explicitly verified migration/linking contract is added.
7. Standalone notes have no recovered XP, streak, mastery, spiritual score, or Lesson progression effect.
8. Persisted data uses deterministic `note-N` IDs, preserves creation time on edit, updates modification time, rejects empty notes, and normalizes malformed/duplicate persisted records safely.
9. Export is local JSON using schema `biblequest.private-notes`, version 1. Export does not imply backup/import parity; #100 remains separate.
10. The UI must state the device-only/no-cloud boundary and remain usable at 390px with >=44px interactive targets and no horizontal overflow.
11. Permanent protection includes `scripts/validate-v3-private-notes.mjs`, `tests/v3-private-notes-edge.mjs`, `tests/v3-private-notes-smoke.mjs`, and the accumulated v3 workflow.

## Cloud Notes boundaries

1. `src/app/cloud-notes.js` is the single #56 remote-notes owner. It owns input normalization, in-memory ordering/cache, authenticated CRUD orchestration, and optimistic-concurrency behavior.
2. `src/core/api.js` remains the only Supabase implementation boundary. No Cloud Notes feature/UI may create a Supabase client, query `bible_notes`, call `fetch`, or access auth tokens directly.
3. The recovered backend contract is existing `public.bible_notes`: UUID primary key, `user_id`, Scripture location (`book`, `chapter`, optional verse range), title/content/tags/type/pinned metadata, timestamps, and RLS policies restricting SELECT/INSERT/UPDATE/DELETE to `auth.uid() = user_id`. #56 requires no schema migration.
4. Cloud Notes requires the shared authenticated session. Guest/local-preview state must not issue note reads or writes, and the UI must present account unavailability/sign-in explicitly rather than falling back to a guest cloud identity.
5. Cloud Notes creates no localStorage/sessionStorage persistence key and does not provide an offline write queue. Its cache is memory-only; remote/load failure is explicit and retryable. #55 remains the intentional device-local note path.
6. The cloud owner validates Scripture reference, content, optional verse range, title, tags, note type, and pin state before calling the API. Returned rows are normalized back into the owner model.
7. Because `bible_notes.updated_at` has no database update trigger, #56 supplies an explicit monotonically newer `updated_at` on edit. Update and delete both require the previously loaded `updated_at`; zero matched rows produce `BQ_CLOUD_NOTES_CONFLICT` rather than silently overwriting another device's newer version.
8. Private Notes are never uploaded, merged, converted, or deleted automatically by Cloud Notes. Any future explicit migration/import feature requires its own verified contract and must preserve the #55 privacy promise.
9. Cloud Notes has no recovered XP, streak, mastery, spiritual score, Lesson progression, or Progress event side effect.
10. `src/features/cloud-notes/index.js` is presentation/event forwarding only; `src/ui/cloud-notes.css` owns feature/mobile styling. Permanent protection includes `scripts/validate-v3-cloud-notes.mjs`, `tests/v3-cloud-notes-edge.mjs`, `tests/v3-cloud-notes-smoke.mjs`, the Private Notes validator/regressions, and the accumulated workflow.

## Congregation membership / role boundaries

1. `src/app/congregation-membership.js` is the single #66 membership/role orchestration owner. It owns membership normalization, the in-memory membership list, trusted join orchestration, and fail-closed client capability projection.
2. `src/core/api.js` remains the only Supabase implementation boundary. The membership owner and UI cannot query tables, invoke functions, access tokens, or call `fetch` directly.
3. The recovered backend contract is the existing RLS-protected `public.bible_congregation_members` and `public.bible_congregations` tables plus the trusted `bq-join` Edge Function. #66 adds no schema or production migration.
4. The recognized congregation roles are `member`, `facilitator`, `leader`, `pastor`, and `admin`. Platform `owner`/`admin` authority is separate and cannot be inferred as a congregation role.
5. Unknown or malformed roles fail closed. Client `read`, `ministry`, and `admin` capability checks control presentation/orchestration only; RLS and trusted server functions remain authoritative for every privileged action.
6. Signed-out and local-preview states cannot issue membership reads or joins. Invite codes are normalized before the existing trusted join call, and a successful join reloads server-backed membership instead of inventing a local role.
7. The membership owner keeps no browser persistence key and does not duplicate the database. Profile text such as `church_group` is not authorization evidence.
8. #66 does not add congregation creation, role editing, teams, assignments, Ministry Hub, score events, presence, or another community state owner.
9. `src/features/congregation/index.js` is presentation/event forwarding only; `src/features/more/index.js` exposes the route through the existing router.
10. Permanent protection includes `scripts/validate-v3-congregation-membership.mjs`, `tests/v3-congregation-membership-edge.mjs`, `tests/v3-congregation-membership-smoke.mjs`, and the complete accumulated workflow.

## Operational recovery / error-boundary boundaries

1. `src/app/operational-recovery.js` is the single #96 owner for active recovery state, failure capture, and Retry/Home action lifecycle.
2. The router remains the only navigation/history owner. Recovery receives router callbacks and never reads or writes `location` or `history`.
3. `src/ui/shell.js` owns presentation only. It keeps the mounted shell and primary navigation available, renders the owner-supplied safe recovery view, and forwards Retry/Home events.
4. `src/app/bootstrap.js` composes the synchronous route operation with Recovery, Shell, Store, and Router. Successful rendering clears stale recovery.
5. Route construction, page mount, and prior-page cleanup failures are contained. Cleanup ownership is cleared before cleanup executes so one broken cleanup cannot block recovery rendering.
6. One active failure replaces the previous failure. Retry/Home clear that failure before invoking the registered route action; another failure is captured without an unhandled rejection.
7. Public recovery presentation never exposes arbitrary technical error text, stacks, credentials, or tokens. Reporting is injected and best-effort.
8. #95 Client diagnostics remains separate. #96 introduces no diagnostic taxonomy, remote reporter, backend/storage call, script recovery, or offline/PWA behavior.
9. Legacy `window.onerror`, `unhandledrejection`, global wrappers, `MutationObserver`, DOM surveillance, script reinjection, fetch overrides, and `window.BQ*` recovery runtimes are forbidden.
10. Recovery has no Progress, Lesson, session, account, membership, doctrinal, provenance, storage, or reward side effect. Permanent protection includes `scripts/validate-v3-operational-recovery.mjs`, `tests/v3-operational-recovery-edge.mjs`, `tests/v3-operational-recovery-smoke.mjs`, and the complete accumulated workflow.

## Client diagnostics boundaries

1. `src/core/client-diagnostics.js` is the single #95 owner of stable client codes, probe evidence/cache, and module-versus-network classification.
2. Retained codes in scope are `BQ-NET-001` (browser offline), `BQ-NET-002` (host unreachable), `BQ-MOD-001` (module failure with reachable host), and `BQ-UNK-001` (insufficient evidence).
3. Browser online state is not proof of reachability. The API owner performs the same-origin probe with a cache-busting query and no-store request; Diagnostics consumes only its result.
4. `src/app/operational-recovery.js` remains the only recovery-state and Retry/Home owner. Diagnostics returns a safe immutable classification and never stores retry actions.
5. `src/ui/shell.js` renders diagnostic code/category/message/reachability only from owner-supplied data. It cannot classify errors or probe connectivity.
6. `src/app/bootstrap.js` composes Diagnostics through Recovery's injected best-effort report callback and ignores late results for a superseded recovery ID.
7. Public diagnostic state excludes arbitrary error message, stack, email, URL, token, credential, and backend data.
8. #95 adds no persisted diagnostic state, `bible_client_errors` write, account requirement, Progress/Lesson/reward change, or production service dependency.
9. Legacy global error/promise/online listeners, main-thread watchdog, DOM diagnostic injector, `window.BQDiagnostics`, fetch override, script reinjection, and MutationObserver are forbidden.
10. Permanent protection includes `scripts/validate-v3-client-diagnostics.mjs`, `tests/v3-client-diagnostics-edge.mjs`, `tests/v3-client-diagnostics-smoke.mjs`, the #96 regressions, and the complete accumulated workflow.

## Transform, Audio, Recordings, Media, Games

- `src/engines/transform.js` alone owns Transform calculations/state; `src/app/transform.js` only coordinates with Progress.
- `src/app/audio.js` is the only embedded-player lifecycle owner.
- `src/app/recordings.js` owns protected recordings lifecycle; `src/app/media-library.js` composes Recordings and Audio rather than creating another backend/player path.
- `src/app/games.js` owns all game launch/round/score/replay/switch/leave/result state and the per-book Recall review-ID persistence. `src/core/recall-packs.js` remains pack-data owner; Progress remains reward owner.

## Future Devotional / Ministry boundaries

`DEVOTIONAL_MINISTRY_DESIGN_V3.md` is the later design contract; documentation alone does not promote ministry inventory rows.

Message, Devotional, and Task must share one ministry post/task identity. Pastor/Admin authoring and congregation-scoped response review must use one service model. Members may read their own response and permitted aggregates, never another member's response body. Privacy is enforced by backend authorization/RLS/API shape, not UI hiding. Ministry Hub, Inbox, Assignments, Workspace, and Assignment Push must reuse this same identity rather than create parallel assignment systems.

## Global hard boundary

One boot, router, session owner, global store, storage boundary, API boundary, Client Diagnostics owner, Bible service, Reader owner, Japanese vocabulary owner, BibleQuest-authored provenance registry, doctrinal/content-safety policy owner, Progress owner, Recall Pack owner, Lesson engine, Adaptive owner, Open Review owner, Private Notes owner, Cloud Notes owner, Congregation Membership owner, Operational Recovery owner, Transform engine, Audio owner, Recordings owner, Media Library owner, Games owner, and one orchestration owner per feature. No v3 source depends on legacy `window.BQ*` globals.

## Milestone order

Foundation → Account → Reader → Progress → Lesson → Daily Mission → Transform → Audio/Recordings/Media → Games core → Bible-study core (Guided Study → Deep Questions → Story Journey → Wisdom Situations → Adaptive Learning → Open Smart Review → STEPBible Context Lab) → Reader-language/source parity (#14 → #16 → #17; #15 furigana intentionally deferred) → source provenance (#90) → doctrinal safety/context (#89) → Private local notes (#55) → Cloud notes (#56) → Congregation membership/roles (#66) → Operational recovery/error boundary (#96) → Client diagnostics (#95) → reassess the next dependency-safe parity milestone → full old-vs-new audit → accumulated mobile regression → production deployment.

Known-good frozen releases extend through `release/v3.30-operational-recovery` at `7ec0290a50086112210c4c301db3288b970a2cc0`; exact v3.30 bookkeeping run `34203169381` passed before that freeze. #96 remains Verified under the later-feature promotion rule. Current strict parity is 57/100 and official regression stability is 56/100 according to the authoritative inventory. #95 Client diagnostics is the active implementation milestone and does not affect either count until its exact verification/bookkeeping gates pass. Production v2, `main`, and production Cloudflare remain isolated.
