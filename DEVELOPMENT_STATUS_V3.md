# BibleQuest v3 Development Status

Updated: 2026-09-07

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production v2 remains unchanged.
- `main` and production Cloudflare remain untouched by the v3 rebuild.
- Current development branch: `feature/v3-study-core`.
- Normal v3 GitHub Actions remain manual-only; isolated verification branches may temporarily use a push trigger for one-shot CI execution only.
- Latest frozen checkpoint: `release/v3.19-adaptive-learning` at `39ab8269e4fd83a09138404bd9466df0c70ee30e`.
- Adaptive Learning functional run `34105551106` and exact bookkeeping run `34106252587` both passed before the v3.19 freeze.
- Earlier Bible-study checkpoints remain v3.18 Wisdom Situations, v3.17 Story Journey, v3.16 Deep Questions, and v3.15 Guided Study.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 46 |
| Verified | 1 |
| Implemented | 1 |
| Not started | 52 |
| Total | 100 |

Strict verified-or-better parity is **47/100**. Fully regression-tested stability coverage is **46/100**.

Current promotions:
- #49 Story Journey — Regression-tested.
- #50 Wisdom Situations — Regression-tested.
- #51 Deep Questions — Regression-tested.
- #52 Expanded Guided Study — Regression-tested.
- #53 Adaptive Learning — Regression-tested after surviving the complete Open Review functional run `34108734009`.
- #54 Open/weak-area review — Verified after complete functional run `34108734009`; exact bookkeeping/freeze gate pending.
- #20 STEPBible lexical/context tooling — Implemented.

## Milestone 10 — Bible-study core

### #53 Adaptive Learning — Regression-tested

Adaptive Learning is frozen at `release/v3.19-adaptive-learning`. It reuses the verified q1–q24 Games question source instead of carrying an adaptive-only copy, uses the shared Lesson engine for the seven-question lifecycle, Progress for +10/+3 parity rewards, and one namespaced adaptive persistence record through Storage. Its retrieval spacing remains approximately 1 → 3 → 7 → 14 → 30 days, misses are due immediately, and its category mastery is explicitly an internal retrieval-practice signal rather than a spiritual-quality score.

For #54 integration, Adaptive now exposes only `reviewFocusCategory()`: a read-only weakest-category signal. When multiple categories share the same minimum mastery, the selection rotates deterministically by date rather than inventing evidence. Open Review can consume that signal but cannot mutate Adaptive mastery.

Adaptive survived the later complete #54 run `34108734009`, including its original edge and 390px browser regressions plus the new review-focus regression, so #53 is now Regression-tested.

### #54 Open/weak-area review — Verified

The actually loaded old `open-review.js` runtime was recovered before rebuilding. The retained feature is a separate open-answer spaced-retrieval workflow, not another multiple-choice Adaptive quiz.

Recovered parity behavior:
- source: unfoldingWord Translation Questions v90, CC BY-SA 4.0.
- seven open recall items per session.
- queue priority: already scheduled/due Open Review items first; existing per-book Recall review IDs second; then fresh approved questions from the weakest Adaptive Bible category; wider fresh-pack fallback only if needed to fill seven.
- each item starts with the question only so the member answers from memory.
- the source/reference answer is then revealed.
- the member self-rates `Review again` or `Got it`; exact wording is not automatically judged.
- retained reward: `+1 XP` for Review again and `+5 XP` for Got it.
- Got it contributes one central `quizCorrect`, matching the retained open/per-book recall behavior; Review again does not.
- correct/self-rated Got it spacing advances 1 → 3 → 7 → 14 → 30 days; Review again resets streak and is due immediately.
- completed sessions persist got/again totals; completed reload/resume cannot duplicate XP/events/history.
- a same-day Review again item is prioritized in the next session.

Clean architecture:
- `src/app/open-review.js` is the single Open Review coordinator and owns only Open Review spacing/history/attempt identity/queue assembly.
- `src/core/recall-packs.js` remains the sole loader/validator/cache for unfoldingWord packs. Open Review never fetches or addresses pack paths itself.
- `src/app/games.js` remains the sole owner of the existing per-book Recall review-ID queue and exposes only immutable `recallReviewQueue()` plus idempotent `syncRecallReviewItem()` for #54 interoperability.
- `src/app/adaptive-learning.js` remains the sole weak-area/mastery model; Open Review consumes only `reviewFocusCategory()`.
- `src/engines/lesson.js` owns the interactive lifecycle as 14 alternating steps: seven memory prompts and seven unscored self-rating steps. It owns leave/return, reload, locking, progression, and completion.
- `src/core/progress.js` remains the sole XP/quizCorrect/event owner.
- `src/core/storage.js` remains the sole browser persistence boundary. Open Review persists identity/statistics only; source question/answer text is rehydrated from Recall Packs on resume.
- `src/features/open-review/index.js` is presentation/event forwarding only; `src/ui/open-review.css` owns presentation/mobile styling.
- the historical direct-localStorage/global-overlay/MutationObserver runtime was not recreated.

Progress identity is deterministic per attempt/item: `open-review:<attemptId>:item:<bookCode>:<itemId>`.

Functional run `34108734009` passed completely:
- architecture validation.
- all accumulated pre-existing edge regressions.
- Adaptive review-focus interface regression.
- Games recall-review interface regression for immutable snapshot, idempotent add/remove, validation, persistence/reload.
- Open Review edge regression for source hiding/reveal, attribution, queue priority, rating-before-reveal rejection, +1/+5 rewards, quizCorrect behavior, shared review synchronization, immediate-due misses, exact 1/3/7/14/30 spacing in an isolated history fixture, completion persistence, reload duplicate prevention, malformed-state recovery, and invalid RNG handling.
- all accumulated browser regressions.
- Open Review 390px browser regression covering Learn routing/stable heading, hidden answer before reveal, visible source attribution after reveal, Review again persistence/reward, leave/return resume of the same question, six Got it completions, exact +31 XP / +6 quizCorrect for one Again plus six Got it ratings, one completion history entry, reload idempotence, missed-item reprioritization, >=44px controls, no horizontal overflow, and no console/page errors.
- accumulated Daily Mission, Transform, Live Recordings, Media Library, and Games browser regressions remained green afterward.

The exact inventory/status/timeline/architecture bookkeeping state must pass one additional complete accumulated suite before `release/v3.20-open-review` may be frozen.

## Next major milestone

After the Open Review bookkeeping gate is green and `release/v3.20-open-review` is frozen, do **not** automatically start an unrelated feature. First reassess the remaining Bible-study/core-content parity debt against the authoritative inventory and old loaded source. Current obvious debt includes #20 STEPBible still only Implemented and reader-language/source items #14–17 still Not started. Select the next target based on dependency order and recovered old behavior.

Kids #38–40 remain deferred but accessible through the existing Kids surface. Ministry/Devotional remains a later high-priority milestone governed by `DEVOTIONAL_MINISTRY_DESIGN_V3.md`.

## Future Devotional / Ministry requirement

- Pastor/Admin publishes first-class Message, Devotional, or Task posts through one freeform ministry service/model.
- Members receive eligible congregation posts.
- Tasks support freeform prompts and member responses.
- Members can read their own response but not other members' response bodies.
- Pastor/Admin review is congregation/role scoped.
- Aggregate counts may be visible where allowed.
- Privacy must be enforced by backend/API/RLS, not UI hiding.
- Ministry Hub, Inbox, Assignments, Workspace, and Assignment Push must reuse one coherent post/task identity.

Primary later inventory mapping remains #66 and #73–78. Design documentation alone does not promote those rows.

## Defect / root-cause ledger retained

- `V3-ROUTER-001` — single synchronous router fixed URL/view drift.
- `V3-AUTH-GATE-001` — static Supabase version pin is architecture-auditable.
- `V3-SHELL-001` — brand and primary navigation selectors are distinct.
- `V3-TRANSFORM-OWNER-001` — orchestration no longer defines a competing Transform calculation owner.
- `V3-RECORDINGS-FREEZE-001` — v3 replaced fragmented global media lifecycle with one Audio owner, one Recordings owner, explicit teardown, bounded requests, and one-player regression.
- `V3-MEDIA-OWNER-001` — Media Library composes verified Recordings/Audio owners instead of creating another player/backend path.
- `V3-GAMES-OWNER-001` — game launch/answer/score/replay/switch/leave/result persistence is centralized in `src/app/games.js`.
- `V3-RECALL-PACK-001` — pack loading/validation/cache is isolated in `src/core/recall-packs.js`.
- `V3-TIMELINE-XP-001` — repeated failed Timeline checks cannot farm XP.
- `V3-STUDY-BOUNDARY-001` — Study public state stays behind its orchestration/Lesson boundary.
- `V3-STORY-BOOKKEEPING-001` — the validator protects required status headings after a bookkeeping-only regression was caught before freeze.
- `V3-WISDOM-ESCAPE-001` — malformed escaping in the first presentation draft was corrected before functional CI and remains browser-protected.
- `V3-OPEN-REVIEW-OWNER-001` — a temporary helper that would have read `games-recall` directly was rejected and deleted before verification. Cross-feature queue access now remains inside Games through two narrow methods.
- `V3-OPEN-REVIEW-FOCUS-TEST-001` — functional run `34108325481` failed because the new test incorrectly expected the first remaining minimum category after Genesis mastery. The implementation was correct; the regression was corrected to assert the deterministic dated tie rotation (`Gospels` on the fixture date) and remains retained.
- `V3-OPEN-REVIEW-SPACING-TEST-001` — functional run `34108543938` failed because the spacing test assumed one item would outrank six older overdue items. Queue behavior was correct; spacing verification was isolated into a fresh one-item history fixture while the multi-item test continues to protect real overdue priority.

## Release rule

Open Review passed the entire accumulated functional suite on run `34108734009`. The exact bookkeeping state must pass the full suite once more before `release/v3.20-open-review` may be frozen. Production v2, `main`, and production Cloudflare remain unchanged until applicable parity and stability gates are satisfied.
