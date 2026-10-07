# BibleQuest Main Journey Plan — Genesis to Revelation

## Product truth

BibleQuest has one Main Quest: read the complete 66-book Protestant Bible from Genesis 1 through Revelation 22.

Free reading remains available in the Bible Reader, but free reading does not skip, reorder, or silently advance the Main Quest.

## Canonical Main Quest

- 66 books
- 1,189 chapters
- Canonical order from Genesis 1 to Revelation 22
- One persisted completion record per canonical Quest chapter
- Translation-independent Quest sequence
- Free Reader progress remains separate
- Reload/reopen resumes the exact next required chapter
- Cross-book continuation is automatic
- Overall completion = completed canonical Quest chapters / 1,189
- Book completion is reported separately

## Main flow

Home
→ Continue Bible Quest
→ exact next required chapter
→ read in BibleQuest Reader or explicitly confirm external licensed reading
→ Complete Quest chapter
→ next canonical chapter
→ book milestone
→ continue
→ Revelation 22
→ Bible Quest Complete

A user may leave this flow at any time, browse another book in Reader, use Daily Journey, Story Journey, games, assignments, or other BibleQuest features, then return without changing the Quest position.

## Daily pace

Supported initial targets:

- 1 chapter/day — gentle
- 2 chapters/day — steady
- 3 chapters/day — approximately 13 months
- 4 chapters/day — approximately 10 months

Pace changes the daily target display only. It never skips required chapters and never imposes a failure state for missed days.

## Reading versus study depth

Main Quest completion answers one question only: has this canonical chapter been completed through the ordered Quest?

Study depth remains separate:

- Daily Journey
- Transformation/reflection
- Story Journey
- Adaptive Review
- recall/games
- notes
- group/leader assignments

These can deepen understanding without blocking progress through all 1,189 chapters.

## Scripture links

Every Quest target must support:

1. Internal BibleQuest Reader link to the exact chapter.
2. Related external links when supported:
   - NLT licensed reader
   - ESV
   - NIV
   - AMP
   - STEP lexical/context
3. Daily Journey related Scripture must expose the internal Reader and the same verified external-reference pathway.
4. Story Journey keeps its existing Reader handoff.

External licensed reading must be explicit self-report. BibleQuest must not claim it observed text that was opened outside BibleQuest.

## Persistence rules

- Main Quest owns its own state.
- Free Reader state cannot mutate Main Quest progress.
- Only the active next canonical chapter can be completed.
- Duplicate completion is impossible.
- Reload must preserve pace, current position, started date, and completed prefix.
- Invalid/non-sequential persisted state must fail closed to the longest valid contiguous prefix.
- Main Quest completion is reached only at 1,189 / 1,189.

## Current implementation tranche

Implemented on feature/v5-main-bible-quest-20260920:

- canonical Main Quest owner
- 1,189 chapter validation
- ordered sequential completion
- independent free reading
- 1–4 chapter/day target
- dedicated Bible Quest page
- primary Home Quest card
- Reader Quest mode and Continue behavior
- My Journey Quest summary
- exact related-Scripture links
- Daily Journey internal/external Scripture links
- stable progress events with zero XP to avoid reward farming
- regression tests for complete Genesis → Revelation traversal

## Follow-on tranches

### Tranche B — book and section milestones
Add completion moments for:
- each Bible book
- Pentateuch
- Historical Books
- Wisdom/Poetry
- Prophets
- Gospels
- Acts
- Letters
- Old Testament
- New Testament
- entire Bible

Milestones should be encouraging and optional, never gates.

### Tranche C — connect study to current Quest region
Daily Journey and review surfaces should preferentially use the chapter(s) currently being read in Main Quest while preserving doctrinally-reviewed authored questions.

Do not auto-generate factual answer keys without verification.

### Tranche D — cloud durability
Synchronize Main Quest state for authenticated users using the existing Supabase account boundary:
- offline-first local state
- additive conflict handling
- device recovery
- backup/export compatibility
- no paid external service requirement

### Tranche E — completion and Quest II
At Revelation 22:
- show exact start/completion dates
- 66 / 66 books
- 1,189 / 1,189 chapters
- reading-day history
- saved reflections/passages
- optional new Quest without deleting Quest I

Future Quest II plans may include chronological or thematic plans, but the first Main Quest remains preserved.

## Hard acceptance gate

A fresh account must be able to:

1. Start at Genesis 1.
2. Complete every chapter in canonical order.
3. Reload and leave the app repeatedly.
4. Read unrelated books separately without changing Quest position.
5. Follow exact Scripture links.
6. Cross all book boundaries correctly.
7. Reach Revelation 22.
8. Finish with exactly 1,189 / 1,189 chapters and 66 / 66 books.
9. Never receive duplicate Quest completion credit.
10. Never lose or silently skip a required chapter.
