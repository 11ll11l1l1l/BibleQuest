# BibleQuest v3 Visual Surface Inventory

Status: post-release visual-polish planning ledger
Baseline visual branch: `postrelease/v3-visual-polish` at `211852b3efbe052b1f4f63ba849a86aba196d6f1`
Production rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

This inventory applies `VISUAL_REPLACEMENT_CONTRACT_V3.md`. It classifies visual surfaces so artwork and theme changes remain replacement-level rather than becoming a redesign or behavior change.

## Classification

- **A — directly replaceable asset:** artwork can be replaced at the same semantic/file boundary.
- **B — CSS/theme-level:** palette, gradients, border treatment, shadows, textures and decorative presentation can change while measurements and structure remain stable.
- **C — presentation copy:** user-facing wording may be cleaned up without changing workflow meaning.
- **D — structural/behavior-coupled:** not part of visual polish; requires a separate product-development change.

## Surface inventory

| Surface | Primary files | Class | Safe visual work | Must remain unchanged |
|---|---|---|---|---|
| Home shell and hero | `src/ui/app.css`, Home presentation, `assets/bq-pinoy-japan-hero.svg` | A/B/C | hero artwork, surface tones, decorative border/shadow treatment, public-facing polish copy | Home route, shell composition, navigation, callbacks, responsive geometry |
| Global shell/theme | `src/ui/app.css` | B | existing palette/surface/shadow token refinement | shell dimensions, route structure, top/bottom navigation, focus and mobile containment |
| Games launcher and shared game chrome | `src/ui/games.css` | B | card surfaces, gradients, borders, shadows, progress-track treatment, decorative emphasis | launcher grid behavior, controls, hit targets, game lifecycle, scoring, rewards, persistence |
| Memory Meadow | `src/ui/games.css`, Games presentation/owner | B with behavior coupling | surface/background treatment and non-layout decorative styling only | 6-pair/3-column narrow contract, 8-pair/4-column wide contract, delays, lock behavior, stars/coins, zero XP |
| Recall / Timeline game presentation | `src/ui/games.css` | B | card/icon/surface treatments | question/source data, ordering interaction, answer/reveal behavior, scoring and navigation |
| Reader | `src/ui/reader.css`, related Reader presentation CSS | B | reading-surface tones, borders, non-layout source/control chrome | Scripture text, verse DOM semantics, translation behavior, navigation, read progress, source ownership |
| Japanese/Context/source presentation | `src/ui/context-lab.css`, `src/ui/japanese-vocabulary.css`, `src/ui/source-labels.css` | B | decorative surface and label styling | source/provenance meaning, lexical/vocabulary contracts, Reader ownership, Scripture preservation |
| Bible World | `src/ui/bible-world.css` plus retained Bible World assets | A/B | asset replacement and decorative map/world surfaces where existing fallback remains valid | unlock thresholds, route handoffs, feature ownership and responsive behavior |
| Progress / Daily Journey | `src/ui/progress.css`, `src/ui/daily-mission.css` | B | badges, progress surfaces, decorative status presentation | XP/streak/activity calculations, completion bonuses, deterministic identities |
| Transform | `src/ui/transform.css` | B | card/surface/theme polish | assessment inputs, scoring/state transitions, persistence, privacy boundaries |
| Study / Deep Questions / Story / Wisdom | their `src/ui/*.css` presentation files | B | section/card backgrounds, borders, shadows and decorative accents | lesson lifecycle, answer semantics, references, no-spiritual-scoring rules |
| Account / onboarding / tutorial | app/account/tutorial presentation CSS | B | decorative presentation and artwork where semantics remain unchanged | signup/recovery/device behavior, labels, focus, permissions and tutorial lifecycle |
| Accessibility presentation | `src/ui/accessibility.css` | B only with focused accessibility verification | readability-compatible theme adjustments | keyboard/focus semantics, reduced motion, labels, contrast and target usability |
| PWA/app icons | `app-icon.svg`, `pwa-icon-192.png`, `pwa-icon-512.png`, manifest-declared icon assets | A | same-role icon artwork replacement | manifest dimensions/purpose, maskable/any semantics, installability and offline ownership |
| Router, bootstrap, service owners | `src/app/bootstrap.js`, `src/app/router.js`, `src/core/*`, feature owners | D | none for visual-only work | all architecture/behavior contracts |
| PWA/offline/service-worker logic | `offline-shell-sw.js`, `src/app/offline-shell.js`, install owner | D except file-backed icon assets | icon assets only when manifest contract is preserved | cache ownership, registration, offline behavior, routing |
| Supabase/API/storage/security | `src/core/api.js`, storage/session/backend contracts | D | none | data, RLS, permissions, APIs, persistence |

## Safe tranche order

1. **Games decorative chrome** — CSS-only shared launcher/question/result surface treatment; preserve all layout and gameplay contracts.
2. **Reader reading-surface polish** — CSS-only, with Reader/mobile/accessibility verification.
3. **Bible World asset/surface polish** — prefer direct asset replacement where the current fallback boundary exists.
4. **Progress/Daily Journey presentation polish** — decorative surfaces only; no reward/state changes.
5. **PWA/app icon refresh** — direct asset replacement only after confirming manifest dimensions and maskable semantics.

## Explicitly out of scope for visual polish

Do not move navigation, change route names, create a new layout system, alter card/grid breakpoints for aesthetic reasons, add/remove controls, change gameplay rules, modify rewards or scoring, change Reader Scripture/source behavior, modify persistence/storage/API/Supabase contracts, or alter PWA/service-worker ownership.

## Verification rule

Every changed product SHA must earn its own evidence. For a CSS/asset tranche, run at minimum the deployment/static gate plus focused browser/mobile and accessibility checks for the affected surface. Before any later production promotion, run the accumulated regression suite appropriate to all touched product files and verify deployed identity separately.
