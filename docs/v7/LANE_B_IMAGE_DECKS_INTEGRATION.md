# V7 Lane B image-first Library deck integration

Date: 2026-10-08 JST. This is a feature-local implementation handoff. It does not claim that the current public Library page already renders these components.

## Feature modules

- `src/features/library/visual-registry.js`: pure, testable resolver for Lane A's validated `{ schemaVersion: 1, assets, byContent }` registry. It maps all 30 legacy feeling IDs to the canonical visual-agent emotion IDs, accepts only same-origin `/v7/images/` paths with SHA-256 metadata, prefers CLEAN imagery for main cards, and rejects TYPE selection until separate approval/integrity integration occurs. Invalid or missing artwork returns a gradient/live-text fallback.
- `src/features/library/visual-decks.js`: native horizontal swipe/scroll-snap Feelings and Needs carousels, selectable cards and two accessible non-swipe Previous/Next controls. The two decks are independent and each returns `{ kind, id, selected, selectedIds }` to its caller, so Library can merge the affected dimension into the persisted discovery query without losing the other deck.
- `src/features/library/visual-content-card.js`: cover-led, keyboard-actionable Devotional/Book/Teaching card. It never directly navigates or publishes; the caller supplies `onOpen`. Original labels and essential titles stay live and screen-reader accessible.
- `src/features/library/visual-decks.css`: feature-local responsive 84%-width rolling cards with visible neighboring cards, deliberate fallback backgrounds, 48px controls, explicit focus indication and reduced-motion handling.
- `tests/v7/library-visual-decks.test.mjs`: precise taxonomy, FIL/TL localization, image identity, cross-type isolation, same-origin path, TYPE avoidance, and asset-free fallback contracts.

## Integration boundary

Per the October 8 four-lane contract, PR #1346 currently owns changes to `src/features/library/page.js` and its guest/mobile recovery. Do not update that file in this PR while #1346 is open. After its integration, add feature-local imports in Library's real presentation layer, with Lane D providing the already-audited built registry. Replace the current discovery-chip-only primary surface with independent `emotion` and `need` decks, keep compact chips as non-swipe fallback, and route `onSelect` through `toggleLibraryDiscoverySelection` / existing safe navigation with current query, tabs and focus intact. Render `createV7LibraryVisualContentCard` for published items only through the authorized Library service; no direct hosted/guest reads are introduced by these modules.

The A registry currently uses keys such as `emotion:anxiety_worry`, while the UI taxonomy uses `emotion:anxious`; the resolver explicitly maps them, and it never borrows a visually unrelated image. Nonexistent `need:<id>` artwork renders a distinct gradient, never a random emotion image.

TYPE derivatives are never selected in this implementation because Lane B's independent exact-locale TYPE policy, independent visual-text QA, and font/image evidence must first pass against the exact deployed bytes. The live localized title must remain present in all cases. A missing TYPE file is not a blocker to readable CLEAN artwork or text-only navigation.

## Acceptance still required at integration

1. Built Android-like Chromium checks at 320 / 390 / 430px and a tablet width: adjacent card peeks, correct native scrolling, button/keyboard focus, arrow/home/end navigation, no horizontal document overflow and correct safe-area bottom navigation.
2. Separate Feelings and Needs selections persist correctly with direct Library query/deep-link/back state, without deleting the other taxonomy dimension.
3. Verified A registry input, failed-image fallback and no unreviewed TYPE artwork in Devotionals, Books, Teaching or emotion cards; no hotlinked external images.
4. Accessible semantic text and 44px+ targets under 200% zoom, dark/high-contrast and reduced-motion.
5. Reconcile with PR #1350's Content Review and lane D strict V7 release certification. No PR here changes A media, C ONE 2 ONE, global navigation, service-worker infrastructure or protected release workflows.
