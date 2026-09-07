# BibleQuest v3 Development Status

Updated: 2026-09-07

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production v2 remains unchanged.
- Frozen Transform checkpoint: `release/v3.7-transform-complete` at `e91ab8be922420ef7ab48b1ffde5dcb3db4a4634`.
- Frozen Audio/Recordings checkpoint: `release/v3.8-audio-recordings`.
- Frozen Media Library checkpoint: `release/v3.9-media-library`.
- Frozen Games core checkpoint: `release/v3.10-games-core`.
- Frozen Mixed Quest checkpoint: `release/v3.11-mixed-quest` at `51a73758a8a3bc8def2de87b6ffa3466bee845f0`.
- Frozen Per-book Recall checkpoint: `release/v3.12-per-book-recall` at `38fb34b1b068c6678957a0a25f6cda88fb185cf0`.
- Frozen Character Detective checkpoint: `release/v3.13-character-detective` at `7c33895158037727880a3ae8eb6c2d44ccef6621`.
- Current development branch: `feature/v3-games`.
- Cloudflare remains untouched by the v3 rebuild.
- Normal v3 GitHub Actions remain manual-only; isolated verification branches are one-shot CI gates only.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 40 |
| Verified | 1 |
| Implemented | 1 |
| Not started | 58 |
| Total | 100 |

Strict verified-or-better parity is now **41/100** and fully regression-tested stability coverage is **40/100**. Quick Recall (#32), Context Challenge (#33), Mixed Quest (#34), Per-book Recall (#35), Character Detective / Who Am I (#36), and Game launcher (#41) are Regression-tested. Timeline (#37) is Verified after accumulated run `34071571139`. #20 STEPBible lexical/context tooling remains Implemented parity debt.

## Completed milestone 7 — Transform

- #46 Basic Transform — Regression-tested.
- #47 Full Transform — Regression-tested.
- #48 Transform engine — Regression-tested.

## Completed milestone 8 — Audio / Live Recordings / Media

- #57 Audio manager — Regression-tested.
- #58 Recordings list — Regression-tested.
- #59 Live Recordings playback — Regression-tested.
- #60 Recording manager — Regression-tested.
- #61 Media Library — Regression-tested.
- `src/app/audio.js`, `src/app/recordings.js`, and `src/app/media-library.js` remain separate single owners with one shared player chain.
- Guest access makes no protected media cloud request.
- Leaving/switching playback tears down the prior player and accumulated later Games regressions remain green.

## Milestone 9 — Games

Current verified architecture and workflow:
- `src/app/games.js` is the only game launcher/active-round/scoring/review/result-persistence owner.
- `src/core/recall-packs.js` is the only Per-book Recall question-pack loading/validation/cache owner.
- `src/features/games/content.js` owns built-in quiz definitions.
- `src/features/games/detectives.js` owns retained Character Detective clue/reference definitions.
- `src/features/games/timelines.js` owns retained Timeline event-order definitions only.
- `src/features/games/index.js` is presentation/event forwarding only.
- Game XP/counters are written only through `src/core/progress.js`.
- Completed result summaries and Per-book review queues/statistics are written only through the injected `src/core/storage.js` boundary.
- Starting/switching/leaving uses one lifecycle; no alternate game runtime or duplicate listeners are introduced.
- Quick Recall (#32) — Regression-tested.
- Context Challenge (#33) — Regression-tested.
- Mixed Quest (#34) — Regression-tested.
- Per-book Recall (#35) — Regression-tested.
- Character Detective / Who Am I (#36) — Regression-tested after the later Timeline milestone passed.
- Timeline (#37) — Verified after run `34071571139`.
- Game launcher (#41) — Regression-tested.

Timeline preserves the three retained old datasets: Big Bible Story, Life of Jesus, and Genesis Journey. Users reorder events with mobile-safe controls, check the order, correct mistakes, and replay/advance through the shared Games owner. Old +20 solved / +4 failed-check semantics are preserved without the old XP-farming weakness: only the first failed check can award +4, and solving afterward awards the remaining +16 so a solved round still totals +20. Repeated failed checks award nothing further. Results persist through the shared Storage boundary.

## Next major milestone

Continue Milestone 9 with #38 Kids Memory Match. It must use the existing Game launcher and shared progress/storage/lifecycle contracts, complete a full pair-matching board, reset/replay cleanly, survive game switching without stale state/listeners, and pass the accumulated 390px mobile/browser regression suite. Then continue #39 Hiragana Match, #40 Kids Bible Who Am I, #42 Same-room Play Together, and #43 Live Rooms.

## Defect / root-cause ledger

- `V3-ROUTER-001` — single synchronous router fixed URL/view drift.
- `V3-AUTH-GATE-001` — static Supabase version pin is architecture-auditable.
- `V3-SHELL-001` — brand and primary navigation selectors are distinct.
- `V3-SIGNUP-001` — recovery-code issuance is independent from optional auto-sign-in.
- `V3-ACCOUNT-ACCEPTANCE-001` — duplicate signup and post-recovery login are explicit tests.
- `V3-READER-ACCEPTANCE-001` — invalid search respects native form validation.
- `V3-PROGRESS-UI-001` — static label readability is separate from touch-target semantics.
- `V3-TRANSFORM-OWNER-001` — orchestration no longer defines a competing Transform calculation owner.
- `V3-TRANSFORM-PROGRESS-001` — Full Transform used an unsupported `assessments` metric; the central progress owner defines and tests it.
- `V3-RECORDINGS-FREEZE-001` — v2 accumulated global media runtime, observer injection, and repeated player lifecycle patches. v3 replaces it with one Audio owner and one Recordings owner, explicit teardown, bounded requests, and one-player browser regression.
- `V3-AUDIO-VALIDATOR-001` — the architecture validator initially checked the wrong source token; it was corrected before functional CI proceeded.
- `V3-MEDIA-OWNER-001` — Media Library parity could have recreated a second player/backend path. v3 instead composes the already-verified Recordings and Audio owners, and architecture validation forbids iframe/backend ownership inside the Media Library layer.
- `V3-GAMES-SHELL-ACCEPTANCE-001` — the accumulated shell test hard-coded the old placeholder Play heading. The rebuilt Games route was correct; the test now asserts the stable route/launcher contract instead of placeholder copy.
- `V3-GAMES-OWNER-001` — old game modes shared fragmented global state and ad-hoc listeners. v3 centralizes launch/answer/score/replay/switch/leave and result persistence in `src/app/games.js`, with architecture and edge tests preventing duplicate owners or direct progress/storage bypass.
- `V3-RECALL-PACK-001` — old Per-book Recall mixed fetching, filtering, review-state mutation, XP, and rendering in one runtime. v3 isolates pack loading/validation/cache in `src/core/recall-packs.js`, keeps gameplay in the existing Games owner, filters quarantined/non-allow rows, and verifies malformed/unavailable pack handling.
- `V3-DETECTIVE-SELECTOR-001` — the first Character Detective browser gate used a non-unique `[data-game-launcher]` test selector after feedback rendered two valid launcher actions. The application lifecycle was correct; the acceptance selector was made explicit and retry run `34067063009` passed the entire suite.
- `V3-TIMELINE-XP-001` — the old Timeline retry path could award +4 XP repeatedly for repeated wrong checks. v3 records only the first miss, gives no additional reward for repeated failed checks, and awards the remaining +16 on later solve; edge/browser regression guards this behavior.

## Release rule

Timeline passed the entire accumulated suite on run `34071571139`. The exact inventory/status/timeline/architecture bookkeeping state must pass the full suite once more before the checkpoint is frozen as `release/v3.14-timeline`. Production v2 remains unchanged until all applicable capability rows satisfy the parity and stability gates.
