# V5 Phase 3 Glyph / Artwork Reconciliation

Evidence base: `baca451e68a8ff588fb5bba7739df1ddb3ae8808`

Scope: evidence-only reconciliation of the integrated whole-app glyph inventory and already-reviewed genuine-match Games mapping. This document does not authorize unrelated artwork substitutions and does not claim that legacy glyphs have been replaced in runtime.

## Current evidence

PR #355 is integrated on this base and provides the recursive `src/**` JavaScript/CSS/HTML Unicode `Extended_Pictographic` inventory. Its exact-head workflow passed as STATIC evidence. The inventory is intentionally informational until every unresolved occurrence has either a genuine existing-asset match or a reviewed documented exception.

PR #350 is integrated and establishes these genuine existing-asset mappings for Games presentation markers:

| Runtime presentation | Legacy glyph | Verified existing asset | Reconciliation state |
| --- | --- | --- | --- |
| Memory Meadow mark | 🦊 | `assets/v4/games/game-memory-meadow.png` | Genuine match exists; runtime may remain legacy until separately claimed/wired. |
| Memory Meadow result medal | 🦊 | `assets/v4/games/game-memory-meadow.png` | Genuine match exists; runtime may remain legacy until separately claimed/wired. |
| Character/Bible Detective mark | 🕵️ | `assets/v4/games/game-character-detective.png` | Genuine match exists; runtime may remain legacy until separately claimed/wired. |
| Recall Library book mark | 📘 | `assets/v4/games/game-recall-deck.png` | Genuine match exists; runtime may remain legacy until separately claimed/wired. |

The same integrated contract explicitly keeps these unmatched reward glyphs as documented exceptions rather than inventing artwork:

| Glyph | Meaning | State |
| --- | --- | --- |
| ⭐ | star reward | Documented unmatched exception; do not force unrelated artwork. |
| 🪙 | coin reward | Documented unmatched exception; do not force unrelated artwork. |

The integrated whole-app inventory currently carries five Games file/glyph exception keys: `🦊`, `🕵`, `📘`, `⭐`, and `🪙` in `src/features/games/index.js`. The first three correspond to genuine-match migration paths above; star and coin remain unmatched exceptions.

## Accessibility boundary

Decorative legacy markers on the reviewed Games paths are required to remain `aria-hidden="true"`. Accessible meaning remains available independently through labels/headings such as the Memory Meadow cards label and game headings. Replacing a decorative glyph with an image must not make the image the sole accessible name.

## Unresolved whole-app debt

Any glyph reported by `tests/v5-whole-app-glyph-inventory.test.mjs` outside the five reviewed Games exception keys remains unresolved. A green inventory run does **not** mean zero glyph debt: the test deliberately reports unresolved occurrences without asserting zero.

Recognition, Couples, Notification Center, Encouragements, and any other non-Games occurrences must therefore remain fail-closed for Phase-3 completion until each exact occurrence is reviewed against existing assets. Only a semantic genuine match may be wired. If no genuine match exists, record a specific reviewed exception instead of substituting approximately related art.

## Exit-gate rule

Phase 3 may mark the whole-app glyph/emoji item complete only after a later exact-head gate proves that every current occurrence is one of:

1. replaced by a verified genuine existing asset while preserving independent accessible labeling; or
2. explicitly documented as a reviewed unmatched exception.

The final gate should then promote the current inventory's unresolved count to a hard zero-undocumented-occurrence assertion. Until that happens, Phase 3 remains open.

Evidence class for this reconciliation: **STATIC only**. No BROWSER-AUTO, BACKEND-E2E, DEVICE/FIELD, runtime artwork completion, or production behavior is claimed.
