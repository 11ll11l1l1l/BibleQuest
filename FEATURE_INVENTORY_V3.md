# BibleQuest v3 Feature Inventory

This file is the authoritative parity ledger for the rebuild.

## Current totals

- **Regression-tested:** 22
- **Verified:** 1
- **Implemented:** 1
- **Not started:** 76
- **Total old-version capabilities:** 100

## Status definitions

- **Not started** — no clean v3 implementation exists.
- **Implemented** — clean v3 code exists behind the defined architecture, but the complete acceptance workflow has not yet passed verification.
- **Verified** — the feature's acceptance workflow has passed in the v3 browser regression suite.
- **Regression-tested** — after the feature was verified, at least one later feature milestone ran the entire v3 suite and the feature still passed.

`classic.html`, old standalone pages, or retained old source files are references only. They do **not** satisfy v3 parity.

| # | Old-version capability | Old version | v2 availability | v3 status | Required verification |
|---:|---|:---:|---|---|---|
| 1 | App shell | Yes | Clean | Regression-tested | boot once; no duplicate shell; error boundary |
| 2 | Primary navigation | Yes | Clean | Regression-tested | all primary routes; deep link; back/forward; reload |
| 3 | Mobile shell/layout | Yes | Clean | Regression-tested | 390px + desktop; no horizontal overflow; nav usable |
| 4 | Global application state | Yes | Partial clean | Regression-tested | one store; route change consistency; no competing globals |
| 5 | Storage boundary | Yes | Partial clean | Regression-tested | one persistence API; malformed data recovery; key isolation |
| 6 | Authentication/session | Yes | Compatibility | Regression-tested | login; logout; expired session; reload; guest/logged-in separation |
| 7 | Guest mode | Yes | Partial clean | Regression-tested | guest boot; guest feature access; no accidental cloud write |
| 8 | Signup | Yes | Compatibility | Regression-tested | create account; validation; duplicate account handling |
| 9 | Recovery code/password recovery | Yes | Compatibility | Regression-tested | recover; rotate code; invalid code; session after reset |
| 10 | Remembered device/security | Yes | Compatibility | Regression-tested | add/remove device; reload; unauthorized state |
| 11 | Bible data service | Yes | Clean reader-specific | Regression-tested | canonical book/chapter load API; errors; caching |
| 12 | English BSB Bible | Yes | Clean | Regression-tested | open multiple OT/NT books; chapters; attribution |
| 13 | Tagalog Bible | Yes | Clean | Regression-tested | translation switch; book/chapter; persistence |
| 14 | Japanese 口語訳 | Yes | Compatibility | Not started | load chapter; switch translation; fallback/errors |
| 15 | Japanese furigana | Yes | Compatibility | Not started | toggle; persistence; mobile readability |
| 16 | Japanese vocabulary learning | Yes | Compatibility | Not started | select verse; vocab display; return state |
| 17 | NLT live path | Yes | Compatibility | Not started | source availability; failure handling; license-safe display |
| 18 | ESV/NIV/AMP reader links | Yes | Compatibility | Regression-tested | correct external launch; safe return behavior |
| 19 | Verse Peek | Yes | Compatibility | Regression-tested | open verse detail; close; repeated use; no duplicate overlay |
| 20 | STEPBible lexical/context tools | Yes | Compatibility | Implemented | lexical/context lookup; unavailable-data behavior |
| 21 | Reader navigation | Yes | Clean | Regression-tested | previous/next chapter; selector; reload state; mobile |
| 22 | Reader search | Yes | Clean/basic | Regression-tested | search valid/invalid; result navigation |
| 23 | Reader read-progress marking | Yes | Clean | Regression-tested | mark read; persist; reload; progress calculation |
| 24 | User progress service | Yes | Clean/local | Regression-tested | XP/streak/activity write via one service only |
| 25 | XP | Yes | Clean | Regression-tested | award once; reload; no duplicate award |
| 26 | Streak | Yes | Clean | Regression-tested | same-day activity; next-day continuation; missed day |
| 27 | Achievements/badges | Yes | Clean | Regression-tested | unlock rule; duplicate prevention; persistence |
| 28 | Daily Mission/Journey | Yes | Clean | Not started | retrieve→context→learn→apply→reflect; reload each stage |
| 29 | Daily passage rotation | Yes | Clean | Not started | deterministic date selection; timezone boundary |
| 30 | Daily Mission completion bonus | Yes | Clean | Not started | complete once; no repeat bonus; reload |
| 31 | Core lesson engine | Yes | Fragmented old | Verified | shared lesson lifecycle; resume; completion; errors |
| 32 | Quick Recall | Yes | Clean | Not started | answer; feedback; score; next; finish; replay |
| 33 | Context Challenge | Yes | Clean | Not started | context question workflow; references; score |
| 34 | Mixed Quest | Yes | Clean | Not started | mixed pool; finish; score persistence |
| 35 | Per-book Recall | Yes | Clean | Not started | load book pack; reveal; rate; next; finish; reload |
| 36 | Character detective / Who Am I | Yes | Clean | Not started | play full round; score; replay |
| 37 | Timeline game | Yes | Clean | Not started | order interaction; result; replay |
| 38 | Kids Memory Match | Yes | Clean | Not started | full match; reset; mobile |
| 39 | Hiragana Match | Yes | Clean | Not started | match full board; reset; mobile |
| 40 | Kids Bible Who Am I | Yes | Clean | Not started | full round; reset; mobile |
| 41 | Game launcher | Yes | Fragmented | Not started | one launch/teardown owner; switch games; no duplicate listeners |
| 42 | Same-room Play Together | Yes | Clean | Not started | 2–6 players; rotating turns; scoreboard; finish |
| 43 | Live Rooms | Yes | Compatibility | Not started | create/join/leave; reconnect; no stale room state |
| 44 | Bible World | Yes | Clean | Not started | render path; unlock thresholds; route into content |
| 45 | Bible World artwork | Yes | Resource retained | Not started | correct assets; responsive layout; missing-asset fallback |
| 46 | Transformation basic | Yes | Clean | Not started | answer all dimensions; calculate; persist; reopen |
| 47 | Transformation full | Yes | Standalone old | Not started | passage/input→transform→result→leave→return; guest + account; mobile |
| 48 | Transform engine | Yes | Multiple old paths | Not started | one engine; deterministic state transitions; no stale instance |
| 49 | Story Journey | Yes | Clean | Not started | scene progression; checkpoint; finish; replay |
| 50 | Wisdom Situations | Yes | Clean | Not started | scenario; choose; correct contract; references; replay |
| 51 | Deep Questions | Yes | Clean | Not started | choose response; references; save-note handoff |
| 52 | Expanded guided study | Yes | Compatibility | Not started | open lesson; navigate sections; save/return state |
| 53 | Adaptive learning | Yes | Compatibility | Not started | weak-area selection; review; update mastery |
| 54 | Open/weak-area review | Yes | Compatibility | Not started | queue generation; complete; persistence |
| 55 | Private local notes | Yes | Clean | Not started | create; edit/delete if supported; reload; export |
| 56 | Cloud notes | Yes | Compatibility | Not started | account sync; offline/failure behavior; no guest leak |
| 57 | Audio manager | Yes | Fragmented old | Not started | one player owner; play/pause/seek/stop; teardown |
| 58 | Recordings list | Yes | Clean link library only | Not started | list load; empty/error states; reload |
| 59 | Live Recordings playback | Yes | Missing in clean | Not started | play; pause; switch; leave; return; no freeze; one player instance |
| 60 | Recording manager | Yes | Fragmented old | Not started | one owner; switch source; cleanup; error recovery |
| 61 | Media Library | Yes | Compatibility | Not started | browse; open media; failure handling; return state |
| 62 | Couples/family local tools | Yes | Clean | Not started | topic open; save note/action; reload |
| 63 | Couples cloud | Yes | Compatibility | Not started | shared state; permission; sync; failure handling |
| 64 | Journey Groups | Yes | Compatibility | Not started | create/join/view/leave; membership persistence |
| 65 | Encouragements | Yes | Compatibility | Not started | send/receive; permission; duplicate prevention |
| 66 | Congregation membership/roles | Yes | Compatibility | Not started | join; role visibility; permission enforcement |
| 67 | Community bridge | Yes | Compatibility | Not started | cross-feature navigation/data contract |
| 68 | Presence | Yes | Compatibility | Not started | online/offline update; cleanup; stale timeout |
| 69 | Team Center | Yes | Compatibility | Not started | team list; member/role workflows |
| 70 | Trusted score events | Yes | Compatibility | Not started | submit trusted event; reject invalid duplicate |
| 71 | Leaderboards | Yes | Compatibility | Not started | load; rank; empty/error; account boundaries |
| 72 | Congregation recognition | Yes | Compatibility | Not started | load/award/display; permissions |
| 73 | Assignments | Yes | Compatibility | Not started | receive; open; complete; status sync |
| 74 | Advanced assignments | Yes | Compatibility | Not started | advanced fields; due-state; completion; permissions |
| 75 | Assignment push workflow | Yes | Compatibility | Not started | leader publish→member receive→complete |
| 76 | Ministry Hub | Yes | Compatibility | Not started | open tools; role guard; navigation |
| 77 | Notification Center/inbox | Yes | Compatibility | Not started | load; read/unread; open target; refresh |
| 78 | Workspace | Yes | Compatibility | Not started | open; save state; role/session boundary |
| 79 | Linked activities/challenges | Yes | Compatibility | Not started | launch linked activity; completion handoff |
| 80 | Personality profile | Yes | Compatibility | Not started | complete; save; reopen; privacy boundary |
| 81 | Psychometrics suite | Yes | Standalone old | Not started | complete assessment; result; persistence; mobile |
| 82 | Avatar vault | Yes | Compatibility | Not started | browse; select; persist; render fallback |
| 83 | Innovation suite | Yes | Compatibility | Not started | inventory-specific workflows documented before migration |
| 84 | Tutorial/onboarding trainer | Yes | Compatibility | Not started | first run; next/back; skip; finish; never duplicate |
| 85 | Tutorial avatar reactions | Yes | Resource retained | Not started | correct reaction/state; mobile positioning |
| 86 | Accessibility support | Yes | Partial clean | Not started | keyboard nav; focus order; labels; reduced motion/readability |
| 87 | Content reporting | Yes | Compatibility | Not started | submit report; validation; success/error |
| 88 | Content moderation | Yes | Compatibility | Not started | moderation contract; blocked/context-sensitive paths |
| 89 | Doctrinal safety/context | Yes | Resource retained | Not started | policy action applied consistently across engines |
| 90 | Source labels/attribution | Yes | Mixed | Not started | source shown where required; links/attribution accurate |
| 91 | Content Review workbench | Yes | Standalone old | Not started | open review item; decision; save; permissions |
| 92 | Admin console | Yes | Standalone old | Not started | auth guard; read/admin actions; permission denial |
| 93 | Admin operations | Yes | Standalone old | Not started | operational actions; role guard; error recovery |
| 94 | Reset/recovery page | Yes | Standalone old | Not started | reset path; cancellation; invalid state |
| 95 | Client diagnostics | Yes | Compatibility | Not started | classify module/network failure; safe user recovery |
| 96 | Operational recovery/error boundary | Yes | Clean basic | Not started | feature failure keeps shell alive; retry/home recovery |
| 97 | PWA install/manifest | Yes | Clean | Not started | manifest valid; installable shell |
| 98 | Offline shell | Yes | Clean | Not started | reload offline after first load |
| 99 | Offline opened Bible packs | Yes | Clean | Not started | open pack online; offline reload same content |
| 100 | Backup/export/import/reset | Yes | Clean | Not started | export; reset; import; schema validation; corrupt backup |

## Parity completion rule

BibleQuest v3 reaches feature parity only when every applicable row is **Verified** or **Regression-tested**. A row is not complete because a page renders, an old module still exists, or a compatibility page can be opened.

## Regression rule

After each feature milestone, the entire v3 regression suite must run. A newly verified feature becomes **Regression-tested** only after a later milestone also passes the full suite.
