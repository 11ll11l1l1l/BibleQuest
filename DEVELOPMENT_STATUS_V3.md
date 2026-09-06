# BibleQuest v3 Development Status

Updated: 2026-09-07

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production v2 remains unchanged.
- Frozen Transform checkpoint: `release/v3.7-transform-complete` at `e91ab8be922420ef7ab48b1ffde5dcb3db4a4634`.
- Frozen Audio/Recordings checkpoint: `release/v3.8-audio-recordings`.
- Current completion branch: `feature/v3-media-library`.
- Cloudflare remains untouched by the v3 rebuild.
- Normal v3 GitHub Actions remain manual-only; isolated verification branches are one-shot CI gates only.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 33 |
| Verified | 1 |
| Implemented | 1 |
| Not started | 65 |
| Total | 100 |

Strict verified-or-better parity is now **34/100**. Audio manager (#57), Recordings list (#58), Live Recordings playback (#59), and Recording manager (#60) are Regression-tested after surviving the later Media Library milestone. Media Library (#61) is Verified. #20 STEPBible lexical/context tooling remains Implemented parity debt.

## Completed milestone 7 — Transform

- #46 Basic Transform — Regression-tested.
- #47 Full Transform — Regression-tested.
- #48 Transform engine — Regression-tested.

## Completed milestone 8A — Audio / Live Recordings (#57–60)

- `src/app/audio.js` is the only embedded media/player owner.
- `src/app/recordings.js` is the only Live Recordings lifecycle owner.
- `src/core/api.js` is the only Supabase/media-data boundary.
- guest access makes no cloud request.
- requests are bounded and expose loading/empty/error states.
- legacy valid YouTube live URLs can recover missing stored video IDs.
- one `youtube-nocookie.com` iframe supports play, pause, seek and stop.
- switching or leaving tears the prior source down first.
- no YouTube global API loader, MutationObserver injection, body-level media runtime, or `window.BQ*` media ownership exists in v3.
- the implementation passed its own accumulated suite and is now Regression-tested after #61 also passed.

## Completed milestone 8B — Media Library (#61)

Verified workflow and architecture:
- `src/app/media-library.js` is the only Media Library browse/filter/open owner.
- Media Library reuses the verified Recordings data contract and the same single Audio player rather than creating another backend/player path.
- All/Featured browsing and local search are deterministic.
- opening an item delegates to Recordings → Audio.
- changing filters, returning to browse, leaving the route, or reopening tears active playback down cleanly.
- guest Media Library access makes no Supabase request.
- loading, empty, protected-account, stale-item and data-error states are explicit and recoverable.
- desktop and 390px mobile workflows passed, including one-player enforcement, no horizontal overflow, and 44px minimum controls.
- the entire accumulated v3 suite passed on isolated verification run `34045487840`.

## Next major milestone

Milestone 9 — Games (#32–43). The first implementation target is the single Game launcher/lifecycle owner (#41), then migrate the individual game workflows through it rather than giving each game its own state/listener/navigation runtime. Quick Recall (#32) should be the first real game attached to the launcher so the launcher is verified against an actual complete game lifecycle, followed by Context Challenge, Mixed Quest, Per-book Recall, Character Detective, Timeline, Kids Memory Match, Hiragana Match, Kids Bible Who Am I, Same-room Play Together, and Live Rooms.

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

## Release rule

Milestone 8 implementation is now functionally Verified/Regression-tested. The final inventory/status/timeline bookkeeping state must pass the entire accumulated suite once more before the exact checkpoint is frozen as `release/v3.9-media-library`. Production v2 remains unchanged until all 100 applicable capability rows satisfy the parity and stability gates.
