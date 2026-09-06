# BibleQuest v3 Development Status

Updated: 2026-09-07

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production v2 remains unchanged.
- Frozen Transform checkpoint: `release/v3.7-transform-complete` at `e91ab8be922420ef7ab48b1ffde5dcb3db4a4634`.
- Frozen Audio/Recordings checkpoint: `release/v3.8-audio-recordings`.
- Frozen Media Library checkpoint: `release/v3.9-media-library`.
- Frozen Games core checkpoint: `release/v3.10-games-core`.
- Current development branch: `feature/v3-games`.
- Cloudflare remains untouched by the v3 rebuild.
- Normal v3 GitHub Actions remain manual-only; isolated verification branches are one-shot CI gates only.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 37 |
| Verified | 1 |
| Implemented | 1 |
| Not started | 61 |
| Total | 100 |

Strict verified-or-better parity is now **38/100** and fully regression-tested stability coverage is **37/100**. Quick Recall (#32), Context Challenge (#33), and Game launcher (#41) are Regression-tested after surviving the later Mixed Quest milestone. Mixed Quest (#34) is Verified. Media Library (#61) is now Regression-tested. #20 STEPBible lexical/context tooling remains Implemented parity debt.

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
- guest access makes no protected media cloud request.
- leaving/switching playback tears down the prior player and accumulated later Games regression remained green.

## Milestone 9 — Games

Current verified architecture and workflow:
- `src/app/games.js` is the only game launcher/active-round/scoring/result-persistence owner.
- `src/features/games/content.js` is the question/mode definition source.
- `src/features/games/index.js` is presentation/event forwarding only.
- game XP/counters are written only through `src/core/progress.js`.
- completed result summaries are written only through the injected `src/core/storage.js` boundary.
- starting/switching/leaving uses one lifecycle; no alternate game runtime or duplicate listeners are introduced.
- Quick Recall (#32) — Regression-tested.
- Context Challenge (#33) — Regression-tested.
- Game launcher (#41) — Regression-tested.
- Mixed Quest (#34) — Verified after run `34065176532`.
- Mixed Quest deliberately combines recall, context, and connection questions; score/XP summary persists across reload; mobile controls and route teardown pass.

## Next major milestone

Continue Milestone 9 with #35 Per-book Recall. It must reuse the same Game launcher rather than introducing a standalone deck runtime. Required workflow: load a selected Bible-book question pack through a defined content/data boundary, reveal the reference answer, rate “review again” or “got it,” advance through the round, finish with a result, survive reload where parity requires it, and remain mobile-safe. Then continue #36 Character Detective, #37 Timeline, #38 Kids Memory Match, #39 Hiragana Match, #40 Kids Bible Who Am I, #42 Same-room Play Together, and #43 Live Rooms.

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
- `V3-GAMES-SHELL-ACCEPTANCE-001` — the accumulated shell test hard-coded the old placeholder `Play` heading, so the first real Games route correctly changed UI while the old acceptance test falsely failed. The test now asserts the stable Games route/launcher contract instead of placeholder copy; run `34064004752` passed the complete suite afterward.
- `V3-GAMES-OWNER-001` — old game modes shared fragmented global state and ad-hoc listeners. v3 centralizes launch/answer/score/replay/switch/leave and result persistence in `src/app/games.js`, with architecture and edge tests preventing duplicate owners or direct progress/storage bypass.

## Release rule

The Mixed Quest functional commit passed the entire accumulated suite on run `34065176532`. The inventory/status/timeline bookkeeping commit must now pass the full suite once more before freezing the exact checkpoint as `release/v3.11-mixed-quest`. Production v2 remains unchanged until all applicable capability rows satisfy the parity and stability gates.
