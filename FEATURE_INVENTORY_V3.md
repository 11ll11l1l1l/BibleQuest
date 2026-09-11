# BibleQuest v3 Feature Inventory

This file is the authoritative parity ledger for the rebuild.

## Current totals

- **Regression-tested:** 97
- **Verified:** 1
- **Implemented:** 0
- **Not started in active release scope:** 0
- **Retired from v3 release scope:** 2
- **Applicable v3 release capabilities:** 98
- **Total old-version capabilities:** 100

## Status definitions

- **Not started** — no clean v3 implementation exists and the capability remains in the active release scope.
- **Implemented** — clean v3 code exists behind the defined architecture, but the complete acceptance workflow has not yet passed verification.
- **Verified** — the feature's acceptance workflow has passed in the v3 browser regression suite.
- **Regression-tested** — after the feature was verified, at least one later feature milestone ran the entire v3 suite and the feature still passed.
- **Retired from v3 release scope** — an old-version capability intentionally excluded from the current v3 release by explicit user product decision. It is not claimed implemented or verified and may be reopened later as optional expansion work.

`classic.html`, old standalone pages, or retained old source files are references only. They do **not** satisfy v3 parity.

Scope decision (2026-09-11 JST): the current verified Kids game set is accepted for the v3 release. #39 Hiragana Match and #40 Kids Bible Who Am I are retired from the active v3 release scope and no longer block release parity. Future Kids/Kana additions must follow `KIDS_GAMES_EXTENSION_V3.md`. #36 Character Detective / Who Am I and #38 Kids Memory Match remain part of the verified current Games set.

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
| 14 | Japanese 口語訳 | Yes | Compatibility | Regression-tested | live GetBible japkougo chapter load; canonical book mapping; translation persistence; exact text; explicit Retry/Use BSB fallback; invalid-response cache eviction; 390px recovery controls |
| 15 | Japanese furigana | Yes | Compatibility | Verified | JKO-only OFF/support/all modes; support uses recovered curated readings; all lazily uses Kuromoji with hiragana normalization and safe curated fallback; Storage persistence; no XP; canonical Scripture preserved beneath ruby presentation; exact-SHA targeted + complete accumulated browser/mobile verification |
| 16 | Japanese vocabulary learning | Yes | Compatibility | Regression-tested | Japanese-only ON/OFF control; select verse through Verse Peek; up to three recovered curated notes; persistence/reload; safe no-note state; learning-aid disclaimer; no XP; no furigana/tokenizer runtime; 390px mobile |
| 17 | NLT live path | Yes | Compatibility | Regression-tested | selectable/persisted licensed-link mode; exact book/chapter handoff; no redistributed NLT text or hidden fetch; no in-app NLT search/read credit; safe external return; source/license attribution; 390px mobile |
| 18 | ESV/NIV/AMP reader links | Yes | Compatibility | Regression-tested | correct external launch; safe return behavior |
| 19 | Verse Peek | Yes | Compatibility | Regression-tested | open verse detail; close; repeated use; no duplicate overlay |
| 20 | STEPBible lexical/context tools | Yes | Compatibility | Regression-tested | BSB verse context; Strong’s/lemma/transliteration/morphology/gloss; in-book usage; source/limits; unavailable-data behavior; Verse Peek handoff; 390px mobile |
| 21 | Reader navigation | Yes | Clean | Regression-tested | previous/next chapter; selector; reload state; mobile |
| 22 | Reader search | Yes | Clean/basic | Regression-tested | search valid/invalid; result navigation |
| 23 | Reader read-progress marking | Yes | Clean | Regression-tested | mark read; persist; reload; progress calculation |
| 24 | User progress service | Yes | Clean/local | Regression-tested | XP/streak/activity write via one service only |
| 25 | XP | Yes | Clean | Regression-tested | award once; reload; no duplicate award |
| 26 | Streak | Yes | Clean | Regression-tested | same-day activity; next-day continuation; missed day |
| 27 | Achievements/badges | Yes | Clean | Regression-tested | unlock rule; duplicate prevention; persistence |
| 28 | Daily Mission/Journey | Yes | Clean | Regression-tested | retrieve→context→learn→apply→reflect; reload each stage |
| 29 | Daily passage rotation | Yes | Clean | Regression-tested | deterministic date selection; timezone boundary |
| 30 | Daily Mission completion bonus | Yes | Clean | Regression-tested | complete once; no repeat bonus; reload |
| 31 | Core lesson engine | Yes | Fragmented old | Regression-tested | shared lesson lifecycle; resume; completion; errors |
| 32 | Quick Recall | Yes | Clean | Regression-tested | answer; feedback; score; next; finish; replay |
| 33 | Context Challenge | Yes | Clean | Regression-tested | context question workflow; references; score |
| 34 | Mixed Quest | Yes | Clean | Regression-tested | mixed pool; finish; score persistence |
| 35 | Per-book Recall | Yes | Clean | Regression-tested | load book pack; reveal; rate; next; finish; reload |
| 36 | Character detective / Who Am I | Yes | Clean | Regression-tested | play full round; score; replay |
| 37 | Timeline game | Yes | Clean | Regression-tested | order interaction; result; replay |
| 38 | Kids Memory Match | Yes | Clean | Regression-tested | Memory Meadow Games ownership; <420px 6 pairs/3 columns and >=420px 8 pairs/4 columns; 350ms match/650ms mismatch lock; replay/leave cleanup; unique round identity; stars + coins reward through Progress with zero XP; complete accumulated browser/mobile verification |
| 39 | Hiragana Match | Yes | Clean | Retired from v3 release scope | optional future game only; if reopened, use `KIDS_GAMES_EXTENSION_V3.md` and full rebuild-and-verify gates |
| 40 | Kids Bible Who Am I | Yes | Clean | Retired from v3 release scope | optional future game only; current #36 Character Detective / Who Am I is sufficient for this release; if reopened, recover the desired Kids contract and use `KIDS_GAMES_EXTENSION_V3.md` |
| 41 | Game launcher | Yes | Fragmented | Regression-tested | one launch/teardown owner; switch games; no duplicate listeners |
| 42 | Same-room Play Together | Yes | Clean | Regression-tested | 2–6 players; rotating turns; scoreboard; finish |
| 43 | Live Rooms | Yes | Compatibility | Regression-tested | create/join/leave; reconnect; no stale room state |
| 44 | Bible World | Yes | Clean | Regression-tested | render path; unlock thresholds; route into content |
| 45 | Bible World artwork | Yes | Resource retained | Regression-tested | correct assets; responsive layout; missing-asset fallback |
| 46 | Transformation basic | Yes | Clean | Regression-tested | answer all dimensions; calculate; persist; reopen |
| 47 | Transformation full | Yes | Standalone old | Regression-tested | personality + thinking-pattern workflow; result/recommendations; private journal; leave/reopen persistence; guest isolation; desktop/mobile |
| 48 | Transform engine | Yes | Multiple old paths | Regression-tested | one engine; deterministic state transitions; no stale instance |
| 49 | Story Journey | Yes | Clean | Regression-tested | scene progression; checkpoint; finish; replay |
| 50 | Wisdom Situations | Yes | Clean | Regression-tested | scenario; choose strongest supported judgment; reveal all rationales/references; +8 XP/+1 situation once per attempt; replay; mobile |
| 51 | Deep Questions | Yes | Clean | Regression-tested | choose response; reveal reflection/references; private note save/resume; Reader handoff; no spiritual scoring |
| 52 | Expanded guided study | Yes | Compatibility | Regression-tested | open lesson; navigate sections; save/return state |
| 53 | Adaptive learning | Yes | Compatibility | Regression-tested | weak/due selection; 7-question Smart Review; 1/3/7/14/30 spacing; mastery update; +10/+3 parity; resume/reload; mobile |
| 54 | Open/weak-area review | Yes | Compatibility | Regression-tested | due/shared/fresh queue; memory→reveal→self-rate; +5/+1 parity; 1/3/7/14/30 spacing; persistence/reload; mobile |
| 55 | Private local notes | Yes | Clean | Regression-tested | one local Notes owner; create/edit/delete; reload persistence; versioned JSON export; explicit device-only/no-cloud boundary; malformed-state normalization; deterministic IDs; 390px mobile |
| 56 | Cloud notes | Yes | Compatibility | Regression-tested | separate authenticated remote owner; existing `bible_notes` RLS/user ownership; Scripture-linked CRUD; explicit `updated_at` stale-write conflict rejection; no local cache key; no guest write; local-preview/error recovery; Private Notes never auto-uploaded; 390px mobile |
| 57 | Audio manager | Yes | Fragmented old | Regression-tested | play/pause/seek/stop; teardown |
| 58 | Recordings list | Yes | Clean link library only | Regression-tested | list load; empty/error states; reload |
| 59 | Live Recordings playback | Yes | Missing in clean | Regression-tested | play; pause; switch; leave; return; no freeze; one player instance |
| 60 | Recording manager | Yes | Fragmented old | Regression-tested | one owner; switch source; cleanup; error recovery |
| 61 | Media Library | Yes | Compatibility | Regression-tested | browse/filter/search; open through shared player; failure handling; leave/return; guest/account; mobile |
| 62 | Couples/family local tools | Yes | Clean | Regression-tested | topic open; save note/action; reload |
| 63 | Couples cloud | Yes | Compatibility | Regression-tested | shared state; permission; sync; failure handling |
| 64 | Journey Groups | Yes | Compatibility | Regression-tested | create/join/view/leave; membership persistence |
| 65 | Encouragements | Yes | Compatibility | Regression-tested | send/receive; permission; duplicate prevention |
| 66 | Congregation membership/roles | Yes | Compatibility | Regression-tested | authenticated membership list; trusted invite-code join; role visibility; fail-closed client capabilities; server/RLS authority; signed-out and 390px recovery |
| 67 | Community bridge | Yes | Compatibility | Regression-tested | cross-feature navigation/data contract |
| 68 | Presence | Yes | Compatibility | Regression-tested | online/offline update; cleanup; stale timeout |
| 69 | Team Center | Yes | Compatibility | Regression-tested | team list; member/role workflows |
| 70 | Trusted score events | Yes | Compatibility | Regression-tested | submit trusted event; reject invalid duplicate |
| 71 | Leaderboards | Yes | Compatibility | Regression-tested | load; rank; empty/error; account boundaries |
| 72 | Congregation recognition | Yes | Compatibility | Regression-tested | load/award/display; permissions |
| 73 | Assignments | Yes | Compatibility | Regression-tested | receive; open; complete; status sync |
| 74 | Advanced assignments | Yes | Compatibility | Regression-tested | advanced fields; due-state; completion; permissions |
| 75 | Assignment push workflow | Yes | Compatibility | Regression-tested | leader publish→member receive→complete |
| 76 | Ministry Hub | Yes | Compatibility | Regression-tested | open tools; role guard; navigation |
| 77 | Notification Center/inbox | Yes | Compatibility | Regression-tested | load; read/unread; open target; refresh |
| 78 | Workspace | Yes | Compatibility | Regression-tested | open; save state; role/session boundary |
| 79 | Linked activities/challenges | Yes | Compatibility | Regression-tested | launch linked activity; completion handoff |
| 80 | Personality profile | Yes | Compatibility | Regression-tested | complete; save; reopen; privacy boundary |
| 81 | Psychometrics suite | Yes | Standalone old | Regression-tested | complete assessment; result; persistence; mobile |
| 82 | Avatar vault | Yes | Compatibility | Regression-tested | browse; select; persist; render fallback (v1: xp/streak-gated styles only, 10 styles explicitly deferred pending metric owners) |
| 83 | Innovation suite | Yes | Compatibility | Regression-tested | inventory-specific workflows documented before migration |
| 84 | Tutorial/onboarding trainer | Yes | Compatibility | Regression-tested | account-created onboarding after recovery-code save confirmation; next/back/skip/finish; persistent launcher; never duplicate; mobile/offline |
| 85 | Tutorial avatar reactions | Yes | Resource retained | Regression-tested | correct reaction/state; mobile positioning |
| 86 | Accessibility support | Yes | Partial clean | Regression-tested | keyboard nav; focus order; labels; reduced motion/readability |
| 87 | Content reporting | Yes | Compatibility | Regression-tested | submit report; validation; success/error |
| 88 | Content moderation | Yes | Compatibility | Regression-tested | congregation-scoped decision load; exempt/remove suppression; explicit include restoration; safe fallback/stale policy; Recall/Games integration |
| 89 | Doctrinal safety/context | Yes | Resource retained | Regression-tested | one doctrinal-safety policy owner; imported Recall re-evaluation; passage-context notice revealed separately from source answer/reference/provenance; unsafe universal/disputed claims quarantined; no spiritual scoring; 390px Recall/Open Review verification |
| 90 | Source labels/attribution | Yes | Mixed | Regression-tested | one immutable provenance registry; Scripture/source-answer/retelling/authored-study distinctions; owner-supplied translation and recall attribution; labels across active learning surfaces; source guide; no legacy injector; 390px mobile |
| 91 | Content Review workbench | Yes | Standalone old | Regression-tested | open review item; decision; save; permissions |
| 92 | Admin console | Yes | Standalone old | Regression-tested | auth guard; read/admin actions; permission denial |
| 93 | Admin operations | Yes | Standalone old | Regression-tested | operational actions; role guard; error recovery |
| 94 | Reset/recovery page | Yes | Standalone old | Regression-tested | reset path; cancellation; invalid state |
| 95 | Client diagnostics | Yes | Compatibility | Regression-tested | one classifier; offline/host-unreachable/reachable-module/unknown codes; API-owned no-store probe; brief probe cache/forced refresh; safe immutable UI; #96 composition; 390px mobile |
| 96 | Operational recovery/error boundary | Yes | Clean basic | Regression-tested | one recovery owner; render/mount/cleanup containment; shell/navigation survival; Retry/Home through router; safe public copy; repeated-failure recovery; 390px mobile |
| 97 | PWA install/manifest | Yes | Clean | Regression-tested | deployment-relative manifest; explicit any/maskable install icons; single optional prompt owner; accepted/dismissed/installed/cleanup lifecycle; no service-worker ownership; remains compatible with dedicated #98 worker; 390px mobile |
| 98 | Offline shell | Yes | Clean | Regression-tested | reload offline after first load; bounded shell cache; no pack/API/probe interception; 390px offline reload |
| 99 | Offline opened Bible packs | Yes | Clean | Regression-tested | opened bundled BSB/Tagalog pack persists only through Bible owner; offline reload/switch; corrupt-cache eviction; no bulk search caching; live/licensed sources excluded; 390px mobile |
| 100 | Backup/export/import/reset | Yes | Clean | Regression-tested | export; reset; import; schema validation; corrupt backup |

## Parity completion rule

BibleQuest v3 reaches release-scope feature parity when every **applicable** row is **Verified** or **Regression-tested**. Rows explicitly marked **Retired from v3 release scope** are historical inventory only: they are neither counted as complete nor counted as missing from the current release.

By the explicit 2026-09-11 product decision, the applicable v3 release scope is 98 capabilities and is **98/98 complete**. Future reopening of #39, #40, or any new Kids game is post-release expansion work governed by `KIDS_GAMES_EXTENSION_V3.md` and does not retroactively invalidate the verified v3.71 baseline.