# BibleQuest v3 Bible World contract

Capability #44 restores the Bible World journey map without importing the legacy global runtime or the separate #45 artwork milestone.

## Recovered parity boundary

- Bible World presents nine biblical-story regions: Creation & Beginnings, Patriarchs, Exodus & Law, Land & Kingdom, Wisdom & Worship, Prophets, Jesus & Gospels, Acts & Early Church, and Letters & Revelation.
- Scripture is never permanently locked. Every region is always accessible.
- The retained Journey Path threshold is **60%**. A region at 60% or higher is marked explored; the first region below 60% is the next path marker. If every region is explored, the final Letters & Revelation marker remains the current endpoint.
- Creation and Patriarchs intentionally split the existing Genesis evidence: Creation is `min(100, Genesis × 2)`; Patriarchs is `max(0, min(100, (Genesis − 50) × 2))`. Other regions directly project their matching Adaptive Learning category.
- Selecting a region opens a region detail path. Read hands the region's recovered anchor passage to the existing Reader owner. Review opens the existing Open Smart Review. Bible World does not duplicate either feature.

## Ownership

- `src/app/adaptive-learning.js` remains the single owner of the eight-category mastery/evidence profile.
- `src/app/bible-world.js` is a read-only orchestration/projection owner for the nine-region world model and the recovered 60% journey marker. It owns no persistence, scoring, XP, streak, Bible data, or review algorithm.
- `src/app/reader.js` remains the Reader state/navigation owner. Bible World only calls `setBook(code, chapter)` before route handoff.
- `src/app/open-review.js` remains the review owner. Bible World only routes to it.
- `src/features/bible-world/index.js` is presentation/event forwarding plus ephemeral selected-region UI state.

## Safety and scope

Bible World percentages are learning evidence, not spiritual maturity, divine approval, or a faith score. The feature itself awards no XP and invents no reward rules. It uses no direct `localStorage`, backend calls, `window.BQ*` globals, MutationObserver injection, or competing mastery state.

Capability #45 Bible World artwork remains separate. #44 must render and remain usable without special artwork; #45 will own correct retained assets, responsive artwork behavior, and missing-asset fallback when that milestone is implemented.
