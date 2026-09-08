# BibleQuest v3 Offline Opened Bible Packs Contract

## Scope

#99 makes bundled Bible book packs that the user actually opens available again after an offline reload. It extends Bible-data persistence without turning the #98 application-shell cache into a generic response cache.

## Ownership

1. `src/core/bible.js` remains the single Bible-source, bundled-pack path, validation, in-memory cache, and opened-pack persistence owner.
2. The browser Cache Storage cache is `biblequest-v3-opened-bible-packs-v1` and is accessed only through the Bible-data owner.
3. `offline-shell-sw.js` remains the #98 shell worker. It does not intercept, route, validate, or persist Bible-pack fetches.
4. Reader consumes `src/core/bible.js`; Reader UI never touches Cache Storage or Bible pack URLs directly.
5. The central local `src/core/storage.js` boundary remains for user-state persistence. Large immutable Scripture source packs are not copied into localStorage.

## Eligible content

- Bundled BSB (`data/packs/bible/...`) and Tagalog (`data/packs/tagalog/...`) book packs may be persisted after an explicit `loadBook` / `loadChapter` path opens them.
- Japanese 口語訳 remains a verified live chapter source and is not persisted by #99.
- NLT remains a licensed external-reader mode and is never cached or redistributed by #99.
- STEPBible lexical/context packs remain outside #99.
- Generic APIs, Supabase responses, account/cloud data, media, Recall packs, and arbitrary fetch responses remain outside #99.

## Load policy

- Bundled pack loading is network-first while connectivity exists.
- After a successful response is parsed and semantically validated, the normalized pack may be persisted.
- If network loading is unavailable or returns a non-success response, the Bible owner may load the previously persisted opened pack.
- Persisted data is passed through the same verse/chapter/duplicate validation as network data before it can reach Reader.
- A semantically corrupt persisted pack is removed and rejected with a controlled recovery error. It is never silently trusted.
- A successful online Scripture read must not fail merely because Cache Storage is unsupported, full, or temporarily unavailable.

## Bounded search behavior

Whole-translation text search may read already persisted packs when offline, but its background book iteration does not persist every book it scans. If a pack was first loaded by search and the user later opens that same book, the already-normalized in-memory pack is persisted at that point.

## Source and safety behavior

Offline fallback returns the same translation metadata, source, license, attribution, chapter/verse identity, and immutable normalized verse shape as the online path. #99 adds no XP, read credit, streak event, mastery change, doctrinal classification, source rewrite, or translation substitution.

## Acceptance

- Edge regression proves online open -> persistent write -> service recreation/network failure -> exact offline content recovery.
- Edge regression proves corrupt persisted data is evicted and rejected.
- Edge regression proves search does not bulk-persist scanned books and that a later explicit open persists an in-memory searched pack.
- Edge regression proves persistence failure does not break valid online Scripture.
- Real 390px Chromium regression opens BSB and Tagalog Genesis online, confirms a separate opened-pack cache, goes offline, reloads BSB, switches to Tagalog offline, and confirms an unopened book still fails rather than being fabricated.
- The browser regression confirms the #98 shell cache does not contain Bible packs and that source/license presentation survives offline fallback.
- The complete accumulated v3 suite must pass before #99 can be promoted.

## Functional verification — 2026-09-08 JST

- Exact clean functional candidate `8eaaf4e0687cd4d10a74f00de8ffbee291fe062e` passed all 88 numbered accumulated regression steps in GitHub Actions run `34217190770`.
- Architecture validation confirmed Cache Storage ownership remains in `src/core/bible.js`; Reader and `offline-shell-sw.js` do not own #99 pack persistence.
- The edge suite passed online persistence, service recreation/offline recovery, source metadata retention, search non-persistence, later explicit-open persistence, corrupt-cache eviction, quota/write failure isolation, malformed-network rejection, live Japanese exclusion, and licensed NLT exclusion.
- The 390px Chromium suite opened BSB and Tagalog Genesis online, confirmed both in `biblequest-v3-opened-bible-packs-v1`, confirmed the #98 shell cache remained pack-free, reloaded BSB offline, switched to Tagalog offline, preserved source/license display, and rejected unopened Exodus.
- #99 is Verified. #98 advances to Regression-tested because it survived this later complete suite.
- The exact v3.34 bookkeeping candidate must independently pass the complete 88-step suite before `release/v3.34-offline-bible-packs` is frozen.
