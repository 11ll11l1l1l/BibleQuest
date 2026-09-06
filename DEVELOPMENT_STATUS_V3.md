# BibleQuest v3 Development Status

Updated: 2026-09-07

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production v2 remains unchanged.
- Frozen Transform checkpoint: `release/v3.7-transform-complete` at `e91ab8be922420ef7ab48b1ffde5dcb3db4a4634`.
- Current completion branch: `feature/v3-audio-recordings`.
- Cloudflare remains untouched by the v3 rebuild.
- Normal v3 GitHub Actions remain manual-only; isolated verification branches are one-shot CI gates only.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 29 |
| Verified | 4 |
| Implemented | 1 |
| Not started | 66 |
| Total | 100 |

Strict verified-or-better parity is now **33/100**. Full Transform (#47) is Regression-tested after surviving the later Audio/Recordings milestone. Audio manager (#57), Recordings list (#58), Live Recordings playback (#59), and Recording manager (#60) are Verified. #20 STEPBible lexical/context tooling remains Implemented parity debt.

## Completed milestone 7 — Transform

- #46 Basic Transform — Regression-tested.
- #47 Full Transform — Regression-tested.
- #48 Transform engine — Regression-tested.
- Full Transform progress contract root cause fixed centrally in `src/core/progress.js` and guarded by regression.

## Completed milestone 8A — Audio / Live Recordings (#57–60)

Verified architecture and workflow:
- `src/app/audio.js` is the only embedded media/player owner.
- `src/app/recordings.js` is the only Live Recordings lifecycle owner.
- `src/core/api.js` is the only Supabase/media-data boundary.
- guest access is locked without a cloud request.
- authenticated list loading has bounded network requests and explicit empty/error states.
- valid legacy rows can recover a YouTube ID from `youtube.com/live/...` when `youtube_id` is absent.
- malformed sources are discarded safely.
- playback uses one `youtube-nocookie.com` iframe with play, pause, seek, and stop commands.
- selecting another recording tears the old source down before mounting the new source.
- leaving the route destroys playback; returning creates one fresh player view.
- no YouTube global API loader, MutationObserver injection, body-level media runtime, or `window.BQ*` media ownership exists in v3.
- desktop and 390px mobile browser workflows passed with no duplicate player and no horizontal overflow.
- the entire accumulated v3 suite passed on isolated verification run `34044293858` at SHA `a4493a9b72d6d3ef1d1ccc4f4e6371b30f75ae99`.

## Next major milestone

Milestone 8B — Media Library (#61). Reuse the verified Audio and Recordings owners rather than creating a separate media runtime. Scope: browse available media, open supported items, return cleanly, explicit loading/empty/error handling, account/guest boundaries, and mobile behavior. After #61 passes the accumulated suite, #57–60 can be regression-promoted and the complete Audio/Media milestone can be frozen.

## Defect / root-cause ledger

- `V3-ROUTER-001` — single synchronous router fixed URL/view drift.
- `V3-AUTH-GATE-001` — static Supabase version pin is architecture-auditable.
- `V3-SHELL-001` — brand and primary navigation selectors are distinct.
- `V3-SIGNUP-001` — recovery-code issuance is independent from optional auto-sign-in.
- `V3-ACCOUNT-ACCEPTANCE-001` — duplicate signup and post-recovery login are explicit tests.
- `V3-READER-ACCEPTANCE-001` — invalid search respects native form validation.
- `V3-PROGRESS-UI-001` — static label readability is separate from touch-target semantics.
- `V3-TRANSFORM-OWNER-001` — orchestration no longer defines a competing Transform calculation owner.
- `V3-TRANSFORM-PROGRESS-001` — Full Transform used an unsupported `assessments` metric; the central progress owner now defines it and regression prevents contract drift.
- `V3-RECORDINGS-FREEZE-001` — v2 accumulated global media runtime, observer injection, and repeated player lifecycle patches. v3 replaces that stack with one Audio owner and one Recordings owner, explicit teardown, bounded requests, and one-player browser regression.
- `V3-AUDIO-VALIDATOR-001` — the new architecture validator initially checked the wrong source token (`data.bqAudioPlayer` instead of `dataset.bqAudioPlayer`). The validator was corrected before functional CI was allowed to continue; the next one-shot run passed the complete suite.

## Release rule

The Audio/Recordings implementation is Verified but the complete Milestone 8 release is not frozen until Media Library (#61) passes and the final inventory/status/timeline commit itself passes the entire accumulated suite. Production v2 remains unchanged until the full 100-capability parity and stability gates are complete.
