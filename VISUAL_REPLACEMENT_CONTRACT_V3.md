# BibleQuest v3 Visual Replacement Contract

Status: post-release visual-polish contract
Baseline: production r3 `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

## Purpose

Improve BibleQuest v3 artwork, icons, colors, textures, decorative assets, and presentation quality without redesigning the established interface or changing product behavior.

## Non-negotiable boundaries

Visual work must preserve:

- route names, navigation structure, information architecture, and page ownership;
- existing responsive layout contracts and usable mobile widths;
- feature behavior, state transitions, persistence, storage keys, APIs, Supabase contracts, and permissions;
- accessibility semantics, keyboard behavior, labels, focus handling, reduced-motion support, and readable contrast;
- PWA, offline-shell, and service-worker ownership;
- one-owner-per-responsibility architecture rules;
- production `main` and `release/v3-production-20260911-r3` until a later visual release is explicitly verified and promoted.

## Safe replacement classes

### A — direct asset replacement

Preferred. Existing file path and semantic role stay unchanged while artwork is replaced.

Examples: hero illustrations, decorative SVGs, icons, backgrounds, avatars, game imagery, borders, textures.

Requirements:

- retain compatible aspect ratio/viewBox where practical;
- retain transparent/background expectations;
- no remote runtime dependency;
- no hidden text or behavior inside artwork;
- preserve or improve accessible fallback behavior.

### B — theme/token polish

Allowed when existing layout measurements and ownership remain unchanged.

Examples: palette variables, gradients, shadows, border treatments, surface tones, decorative backgrounds.

Requirements:

- no new layout system;
- no structural DOM dependency solely for decoration;
- maintain contrast/readability;
- keep mobile overflow behavior unchanged.

### C — presentation copy cleanup

Allowed for user-facing text that exposes internal development language or is clearly temporary, provided workflow meaning and controls stay unchanged.

### D — structural/behavior-coupled change

Not visual replacement work. Requires separate product-design justification and full feature change process.

Examples: moving navigation, changing page hierarchy, adding/removing controls, altering persistence, changing gameplay rules, changing feature ownership.

## Tranche rule

Each visual tranche should be small and reversible. Before integration:

1. identify exact files and replacement class;
2. state what must remain behaviorally identical;
3. add or retain focused regression protection where useful;
4. run syntax/static checks plus relevant focused browser/mobile checks;
5. run the accumulated regression suite appropriate to touched product files before promotion;
6. never transfer PASS from an earlier changed product SHA.

## First tranche

Home hero polish:

- replace the malformed `assets/bq-pinoy-japan-hero.svg` with a self-contained SVG at the same path;
- remove internal rebuild/development wording from the public Home hero while keeping its structure and callbacks unchanged;
- preserve `.bq-hero` layout and the existing Home navigation/interaction contract;
- verify artwork loading and desktop/mobile containment.
