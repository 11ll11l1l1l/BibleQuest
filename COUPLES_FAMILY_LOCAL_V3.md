# BibleQuest v3 Couples / Family Local Tools Contract

Milestone #62 rebuilds the loaded legacy `couples.js` local experience without carrying forward its global overlay architecture.

## Recovered source

The retained classic shell loads `couples.js` and `couples.css` separately from `couple-cloud.js`. The local module contains exactly eight categories and 32 conversation cards, plus One Card Tonight, Listen First, Couple Check-in, Repair Room, Us & God, Date Night, saved cards, discussed history, 7-day practices, and local completion/check-in counters.

The recovered local categories are: Us & God; Listen & Understand; Repair & Forgive; Friendship & Gratitude; Money & Responsibilities; Closeness & Affection; Parenting & Family; Purpose & Future.

`src/content/couples-family.js` is the static recovered-content source. It retains the old card prompts, follow-ups, practices, references, check-in statements, and Repair Room sequence without reclassifying them as Scripture quotations.

## Ownership

- `src/app/couples-family.js` is the only #62 mutable-state and persistence owner.
- `src/core/storage.js` remains the only browser-storage implementation. #62 uses only the `couples-family-local` logical key, which becomes `biblequest.v3.couples-family-local` through that boundary.
- `src/features/couples-family/index.js` is presentation/transient interaction only. It does not access browser storage, Supabase, session state, Progress, XP, or legacy globals.
- `src/app/reader.js` remains the Reader state owner. Couples only supplies the recovered book/chapter reference to Bootstrap, which explicitly selects BSB and forwards navigation to Reader.
- `couple-cloud.js`, Supabase, session/account APIs, congregation state, presence, and shared couple synchronization are #63 or later and are forbidden from #62.

## Persistence and recovery

The #62 local schema is version 1 and stores only validated JSON-compatible local state: favorite card IDs, discussed-card history, 7-day practice commitments, completed listening count, and pass-the-phone check-in ratings. Malformed arrays, unknown card/category IDs, invalid timestamps, duplicate commitment IDs, and invalid check-in ratings are discarded or normalized before use. Histories remain bounded to the recovered legacy limits: 100 discussed cards, 30 practices, and 30 check-ins.

The v3 owner does not read or mutate the classic unprefixed `biblequest_couples_v1` key. Production v2/classic data remains isolated. The local state is portable under the existing #100 backup boundary because it is an ordinary non-auth `biblequest.v3.*` entry.

## Behavioral parity

- Dashboard exposes all six recovered local modes and eight recovered categories.
- One Card Tonight/category/Us & God/Date Night use the recovered 32-card source.
- Saved-card state, discussed history, and a selected 7-day practice persist and survive reload.
- Listen First retains the five-step speaker/listener/mirror/switch/finish flow and records completion locally.
- Couple Check-in remains pass-the-phone, 1–5, explicitly non-competitive, stores only local ratings, and compares shared strength/perception gap without declaring a winner.
- Repair Room retains its five-step ordinary-conflict flow and explicit safety boundary for fear, threats, coercion, stalking, or violence.
- Scripture references open BSB through the existing Reader owner; #62 does not fetch or quote Scripture itself.
- No recovered #62 XP/progress reward exists, so none is invented.

## Verification

Permanent protection is `scripts/validate-v3-couples-family.mjs`, `tests/v3-couples-family-edge.mjs`, `tests/v3-couples-family-smoke.mjs`, plus the complete accumulated v3 regression workflow. During the functional gate, inventory row #62 remains `Not started`; promotion occurs only after the exact clean functional candidate passes every accumulated regression.
