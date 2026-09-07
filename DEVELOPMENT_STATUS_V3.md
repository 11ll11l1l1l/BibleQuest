# BibleQuest v3 Development Status

Updated: 2026-09-07

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production v2 remains unchanged.
- `main` and production Cloudflare remain untouched by the v3 rebuild.
- Current development branch: `feature/v3-study-core`.
- Normal v3 GitHub Actions remain manual-only; isolated verification branches may temporarily use a push trigger for one-shot CI execution only.
- Latest frozen checkpoint: `release/v3.20-open-review` at `2da79e9ab04cb05d63005b6cda7eb4471c149e92`.
- Open Review functional run `34108734009` and exact bookkeeping run `34109591650` both passed before the v3.20 freeze.
- #20 STEPBible Context Lab repaired functional run `34114885252` passed completely; its exact bookkeeping/freeze gate is pending.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 47 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 52 |
| Total | 100 |

Strict verified-or-better parity is **48/100**. Fully regression-tested stability coverage is **47/100**.

Current promotions:
- #49 Story Journey — Regression-tested.
- #50 Wisdom Situations — Regression-tested.
- #51 Deep Questions — Regression-tested.
- #52 Expanded Guided Study — Regression-tested.
- #53 Adaptive Learning — Regression-tested.
- #54 Open/weak-area review — Regression-tested after surviving complete #20 run `34114885252`.
- #20 STEPBible lexical/context tools — Verified after complete repaired functional run `34114885252`; exact bookkeeping/freeze gate pending.

## Milestone 10 — Bible-study core

### #54 Open/weak-area review — Regression-tested

Open Review is frozen at `release/v3.20-open-review`. It retains the old seven-item open-answer spaced-review workflow: scheduled/due items first, existing Games review IDs second, fresh weak-category items next, then wider fallback. The member answers from memory, reveals the source answer, and self-rates `Review again` (+1 XP) or `Got it` (+5 XP). Success spacing remains approximately 1 → 3 → 7 → 14 → 30 days and Review again is due immediately.

Open Review kept its clean ownership boundaries through the later full #20 run `34114885252`: Recall Packs remains question-pack owner, Games remains per-book review-ID owner, Adaptive remains weak-area owner, Lesson remains lifecycle owner, Progress remains reward owner, and Open Review remains only the queue/spacing coordinator. It is therefore now Regression-tested.

### #20 STEPBible lexical/context tools — Verified

The old loaded runtime was recovered before rebuilding. The retained capability was an in-app Hebrew & Greek Context Lab, not merely an external STEP Bible link.

Recovered parity behavior:
- BSB current verse plus previous/next verse context.
- Strong’s IDs and Hebrew/Greek identification.
- lemma, transliteration, morphology, and brief gloss.
- same-book tagged usage count and usage-reference navigation.
- context-pack coverage metadata and visible source/license/limits.
- verse-specific external STEP Bible handoff retained as a secondary path.
- explicit study cautions: read sentence/paragraph first; lexical entries provide a range that grammar/context narrow; do not build doctrine from etymology or one Strong’s entry alone.
- explicit limitation that tagged lexical fields are not a reconstructed word-for-word interlinear or theological conclusion.
- unavailable context data degrades inside Reader rather than breaking the Reader route.
- no recovered XP/progress reward; v3 does not invent one.

Clean architecture:
- `src/core/bible.js` is the sole owner of context manifest/pack loading, normalization, cache, BSB context composition, source metadata, and Strong’s usage calculation.
- `src/app/reader.js` only delegates through `contextChapter()` and `lexicalContext()`; Context Lab browsing does not mutate the selected Reader passage.
- `src/features/reader/context.js` is presentation/event forwarding only and cannot fetch, persist, award Progress, address pack paths, create globals, or use MutationObserver.
- `src/ui/context-lab.css` owns isolated Context Lab/mobile presentation.
- the old direct-localStorage/global-overlay/MutationObserver/`window.BQContextLab` runtime was not recreated.
- `scripts/validate-v3-step-context.mjs` enforces the Context Lab boundary in every accumulated regression run.

Verification coverage:
- `tests/v3-step-context-edge.mjs` verifies BSB context, Strong’s/lemma/transliteration/morphology/gloss, in-book usage, coverage/source/license, immutable snapshots, cache behavior, empty-tag behavior, controlled unavailable/malformed data, Reader delegation, no Reader mutation, and no invented XP/activity.
- `tests/v3-step-context-smoke.mjs` verifies the 390px Reader → Verse Peek → Context Lab path, original-language cards, safety guidance, source attribution, usage navigation, unavailable-data behavior, approximately 44px controls, no horizontal overflow, safe close/return, and no page/console errors.
- repaired complete functional run `34114885252` passed architecture, all accumulated edge tests, the original Reader browser test, the new Context Lab browser test, and every later browser regression through Games.

The exact inventory/status/timeline/architecture bookkeeping state must pass one additional complete accumulated suite before `release/v3.21-step-context` may be frozen.

## Next major milestone

After the #20 bookkeeping gate is green and `release/v3.21-step-context` is frozen, the next priority is **#14 Japanese 口語訳**. Recover the actually loaded old Japanese source behavior before implementation, then rebuild it through the existing single Bible/Reader owners. Do not jump to #15 furigana until #14 passes its own full functional and bookkeeping gates.

Planned Reader-language/source sequence remains:
1. #14 Japanese 口語訳.
2. #15 Japanese furigana.
3. #16 Japanese vocabulary learning.
4. #17 NLT live path.

Kids #38–40 remain deferred but accessible through the existing Kids surface. Ministry/Devotional remains a later high-priority milestone governed by `DEVOTIONAL_MINISTRY_DESIGN_V3.md`; it does not displace the current Reader/core parity sequence.

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
- `V3-OPEN-REVIEW-OWNER-001` — a temporary helper that would have read `games-recall` directly was rejected and deleted before verification; cross-feature access remains inside Games.
- `V3-OPEN-REVIEW-FOCUS-TEST-001` — functional run `34108325481` failed because the test expected the wrong deterministic dated tie category; implementation was correct and the fixture was corrected.
- `V3-OPEN-REVIEW-SPACING-TEST-001` — functional run `34108543938` failed because the test assumed one scheduled item outranked older overdue items; spacing verification was isolated while real overdue priority remained protected.
- `V3-STEP-PEEK-SELECTOR-001` — first #20 functional run `34114585936` failed because Verse Peek stored its selected verse as `data-verse`, colliding with the established `[data-verse]` Scripture-button selector. Production metadata was namespaced to `data-peek-verse`; the old Reader smoke was not weakened, the new Context Lab smoke also protects the handoff, and repaired run `34114885252` passed fully.

## Release rule

#20 passed the entire repaired accumulated functional suite on run `34114885252`. The exact bookkeeping state must pass the full suite once more before `release/v3.21-step-context` may be frozen. Production v2, `main`, and production Cloudflare remain unchanged until applicable parity and stability gates are satisfied.
