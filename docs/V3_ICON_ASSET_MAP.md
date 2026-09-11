# BibleQuest v3 Icon Asset Map

Status: visual-rebuild reference contract  
Asset location: `assets/icons/v3/`  
Applies to: future Visual Phase B / artwork rebuild work

## Purpose

This document is the canonical usage map for the generated BibleQuest v3 PNG icon family. Future visual work must consult this map **before** generating, replacing, or wiring icon artwork.

The goal is to improve polish without changing BibleQuest information architecture, navigation, feature ownership, persistence, backend contracts, or interaction behavior merely to make an icon fit.

## Asset-family QA

The set contains **70 unique PNG files**. Every file was visually inspected and technically checked before this map was written.

- Dimensions: **64 × 64 px** each.
- Pixel format: **RGBA** each.
- Transparency: every file contains a true alpha channel with transparent pixels.
- Exact duplicate files: **none**.
- Combined source size: approximately **365 KiB**.
- General style: colorful rounded game/app iconography with transparent backgrounds; strong blue/green/red action cues and gold/brown faith/reward motifs.

These are source UI assets, not full-resolution illustrations. Prefer approximately **20–28 px** for compact controls, **28–40 px** for navigation/list rows, and **40–56 px** for feature cards. Do not upscale beyond the source size unless a future replacement asset is generated at a larger native resolution.

## Mandatory visual-rebuild rules

1. **Read this file first.** Before generating a new icon for a mapped semantic role, check whether this library already contains the correct mapped PNG.
2. **One canonical meaning per icon.** Do not reuse one icon for unrelated meanings just because it looks attractive.
3. **Do not invent functionality to consume artwork.** `RESERVE` means the asset stays available but must not create a new product feature by itself.
4. **Preserve product structure.** Icons may replace or enrich existing labels/cards/buttons, but they do not authorize navigation, workflow, data-model, ownership, or backend changes.
5. **Generated-art rule remains automatic.** If a selected visual milestone needs a new/replacement image, generate it, choose the best result, optimize it, implement it, and test it without asking the user for routine image approval.
6. **Update this map when semantics change.** If an icon is replaced or deliberately reassigned, update the corresponding row in the same product checkpoint.
7. **Accessibility is mandatory.** Decorative icons use `alt=""` and/or `aria-hidden="true"`. Icon-only interactive controls require an accessible name such as `aria-label`. Never encode state only by artwork/color.
8. **Destructive and security actions keep text/confirmation.** `delete.png`, `lock.png`, `unlock.png`, `key.png`, and error/recovery icons must not replace required explanatory copy or confirmation flows.
9. **Reward icons reflect real state only.** Do not show trophy, badge, crown, star, gem, gift, or treasure as earned/unlocked unless the existing Progress/achievement owner says that state is earned.
10. **Do not weaken mobile layout.** Keep touch targets at least the existing accessible size; the icon itself may be smaller inside the target.
11. **Do not treat file names as product requirements.** The assignment below is authoritative. Some assets are intentionally reserve/editorial.
12. **No approval stop for mapped visual implementation.** During an already-selected visual rebuild milestone, implement the mapped asset and verify it; do not stop to ask whether the user wants that specific PNG used.

## Implementation priority legend

- **CORE** — strong direct match to an existing BibleQuest navigation or major feature. Prefer during the visual rebuild.
- **ACTION** — shared action/control icon. Use only where that action already exists.
- **STATE** — status/feedback indicator. Must reflect actual application state.
- **CONTENT** — topical/editorial artwork for an existing content surface; never creates a new feature.
- **RESERVE** — keep in the library but do not wire into the app until a matching real capability/control exists.

## Canonical assignment map — all 70 PNGs

| PNG | Visual inspection | Canonical assignment | Primary target in BibleQuest | Class | Implementation notes |
|---|---|---|---|---|---|
| `achievements.png` | Gold trophy | Achievements collection | Progress / achievements and badges summary (#27) | CORE | Use for the achievements destination/card, not for every completed activity. |
| `add.png` | Green plus button | Add/create action | Existing create-note, add-member, create-group, or similar add controls | ACTION | Context label or accessible name must identify what is being added. |
| `assignments.png` | Clipboard checklist | Assignments | Assignments / Advanced Assignments / Assignment Push (#73–75) and its Ministry Hub launcher | CORE | Canonical assignment feature icon. |
| `back.png` | Large blue left arrow | Route/detail back | Existing shell/detail back action | ACTION | Use for navigation back, not “previous question”; `previous.png` owns sequential previous-step actions. |
| `badge.png` | Gold medal/ribbon | Badge / recognition | Progress badges (#27) and Congregation recognition (#72) | STATE | Display only when the corresponding badge/recognition state exists. |
| `bible.png` | Brown Bible with cross | Bible Reader | Reader main navigation/card and Bible-content entry (#11–23) | CORE | Preferred primary Reader icon. |
| `bookmark.png` | Red bookmark ribbon | Saved/bookmarked passage | **Reserve for a real bookmark/save-passage control** | RESERVE | Current parity inventory has no standalone bookmark capability. Do not invent one merely to use this icon. |
| `calendar.png` | Month calendar | Calendar / due dates | Priority-1 Calendar entry; assignment due-date/calendar surfaces | CORE | Use as the canonical Calendar icon when Calendar is implemented; may also mark actual due-date controls. |
| `challenge.png` | Mountain with summit flag | Challenge activity | Context Challenge / linked challenge launch (#33, #79) | CORE | Best for challenge selection/launch, not generic goals. |
| `church.png` | Church building with cross | Congregation/church identity | Congregation membership/roles (#66), Ministry/congregation identity panels | CORE | Prefer for congregation identity; `serve.png` owns service/ministry action. |
| `delete.png` | Red trash can | Delete permanently | Existing delete-note/delete-record controls | ACTION | Destructive action must retain confirmation and accessible text. |
| `download.png` | Green downward arrow | Download/export | Backup export, offline pack download, existing downloadable media/data controls (#99–100) | ACTION | Do not use for cloud sync; `refresh.png`/state copy handles sync/retry. |
| `edit.png` | Blue pencil | Edit | Existing edit note/profile/assignment/configuration actions | ACTION | Pair with an accessible label in icon-only use. |
| `error.png` | Red X | Failure/error | Operational recovery, validation, failed load/save states (#95–96) | STATE | Never use as the only error explanation. Keep safe error copy and recovery action. |
| `explore.png` | Compass | Explore Bible World | Bible World “Explore” action / discovery card (#44–45) | CORE | Secondary Bible World exploration icon; `world.png` is the canonical Bible World destination icon. |
| `faith.png` | Christian fish symbol | Faith topic marker | Existing faith/doctrinal-context lesson or study cards | CONTENT | Editorial marker only. Do not use as authority/safety certification or create a new faith feature. |
| `favorites.png` | Red heart | Favorite/liked item | **Reserve for a real favorites/liked-content state** | RESERVE | Do not reinterpret as Couples or Encouragements; there is no standalone Favorites capability in the parity ledger. |
| `forward.png` | Large blue right arrow | Route/detail forward | Existing shell/detail forward action, where a real forward route exists | ACTION | Not the normal “next step” icon; `next.png` owns sequential next actions. |
| `friends.png` | Three people | Community/group members | Journey Groups / Community Bridge member/group entry (#64, #67) | CORE | Use for social/member grouping; `church.png` represents the congregation entity itself. |
| `games.png` | Game controller | Games | Games main navigation/launcher (#31–43) | CORE | Preferred primary Games icon. |
| `gem.png` | Blue diamond | Rare collectible / high-tier reward | Achievement/reward presentation only when a real collectible/tier maps to it | RESERVE | Do **not** relabel as coins; Kids Memory’s coin reward must keep its real coin semantics. |
| `gift.png` | Wrapped present | Granted reward/unlock | Reward reveal after an actually earned award/completion | STATE | Show only after real reward state. Not a store/purchase icon. |
| `goals.png` | Bullseye with arrow | Goal/target | Daily Mission objective or Transform action-goal presentation (#28–30, #46–48) | CONTENT | Use where the workflow already exposes a goal/target. Do not create goal tracking from this asset alone. |
| `growth.png` | Green sprout | Transformation/growth | Transform main card/navigation and growth/results visuals (#46–48) | CORE | Preferred Transform-family icon because the set has no file named `transform.png`. |
| `help.png` | Blue question mark | Help | Tutorial/help launcher and contextual help (#84–85) | ACTION | Use for user-requested help; `info.png` is informational context, not help. |
| `history.png` | Parchment scroll | History/activity record | Progress/history presentation or existing past-activity/assignment-history list | CONTENT | Only where historical records already exist; do not create a new audit/history feature. |
| `home.png` | House | Home | Home primary navigation | CORE | Preferred primary Home icon. |
| `hope.png` | Sunrise | Hope topic | Existing Daily Journey/Study/Deep Questions content tagged around hope | CONTENT | Editorial/topic decoration only; not structural navigation. |
| `info.png` | Blue information symbol | Information/details | Source/attribution explanations, “about this” and non-error informational notices (#90) | ACTION | Informational, not help or warning. |
| `journey.png` | Treasure-map parchment | Story Journey | Story Journey launcher/checkpoint presentation (#49) | CORE | Canonical Story Journey icon. |
| `key.png` | Gold key | Recovery/access credential | Recovery code/password recovery / remembered-device security (#9–10) | CORE | Security-sensitive: keep explanatory text and never expose secret values in artwork. |
| `kids.png` | Three children | Kids game grouping | Kids-facing Games entry / Kids Memory card family (#38) | CORE | Use as kids-area grouping art; the actual Memory game may still use its game-specific artwork. |
| `lock.png` | Closed padlock | Private/restricted/locked | Private Notes privacy, authorization-restricted controls, locked Bible World state | STATE | Must represent a real restriction/privacy state; never imply access the user does not have. |
| `map.png` | Red location pin | Location/node marker | Bible World location/node markers and location-specific journey points (#44–45) | CONTENT | Marker-level icon, not the main Bible World destination. |
| `menu.png` | Blue hamburger | Mobile/global menu | Existing hamburger/menu opener | ACTION | Use only if the shell actually exposes a hamburger menu; accessible name required. |
| `more.png` | Blue ellipsis | More/overflow | More destination/overflow navigation | CORE | Preferred More icon where More is a real destination; `menu.png` is the hamburger/menu control. |
| `mute.png` | Muted speaker | Mute audio | Audio/recording player mute control (#57–60) | STATE | Must track actual mute state and pair with `sound.png` where applicable. |
| `next.png` | Blue circular right chevron | Next sequential step | Tutorial, lesson, quiz, Story Journey, game, and wizard next-step controls | ACTION | Use for workflow progression. Distinct from route-level `forward.png`. |
| `notes.png` | Paper and pencil | Notes | Private local Notes and Cloud Notes entries (#55–56), Workspace note launch | CORE | Canonical notes feature icon. |
| `path.png` | Wooden signpost | Daily Journey/path choice | Daily Mission/Journey route/checkpoint presentation (#28–30) | CORE | Use for journey/path progression; `journey.png` is specifically Story Journey. |
| `pause.png` | Blue pause button | Pause playback | Audio/recordings/live playback pause (#57–60) | ACTION | Pair statefully with `play.png`. |
| `peace.png` | Dove with olive branch | Peace topic marker | Existing study/journey/reflection content tagged around peace | CONTENT | Editorial/topic decoration only. |
| `play.png` | Green play button | Start/resume | Start/resume games, lessons, media, recordings, journeys | ACTION | Use only for a real start/resume action, not a decorative “go” icon. |
| `pray.png` | Praying hands | Prayer/reflection marker | Daily Mission reflect/apply stage; Couples/Family reflection prompts | CONTENT | Content-stage icon only. Does not create a prayer-tracking feature. |
| `previous.png` | Blue circular left chevron | Previous sequential step | Reader sequential controls where appropriate, tutorial/lesson/game previous-step actions | ACTION | Workflow previous; `back.png` remains route/detail back. |
| `print.png` | Printer | Print | **Reserve for an explicit existing/future print action** | RESERVE | Do not add printing solely because the icon exists. Export/download remains `download.png`. |
| `profile.png` | Person/avatar medallion | User profile/account | Account/profile entry, avatar/profile settings | CORE | Canonical account/profile icon. Avatar Vault may use this as its entry if no more specific avatar art is selected. |
| `progress.png` | Rising bar chart | Progress/stats | Progress dashboard, XP/streak/activity statistics (#24–27) | CORE | Use for statistics/progress destination, not individual reward events. |
| `puzzles.png` | Blue puzzle piece | Puzzle/mixed activity | Mixed Quest / puzzle-style game launcher (#34, #41) | CORE | Game subtype icon, not the main Games icon. |
| `quiz.png` | Lightbulb | Quiz/recall review | Quick Recall, Smart Review/adaptive-learning question activity (#32, #53–54) | CORE | Prefer for question/review activity cards. |
| `refresh.png` | Circular arrows | Refresh/retry | Notification refresh, list reload, recoverable network retry, diagnostics retry | ACTION | Must call the existing owner’s refresh/retry path; never bypass cache/data boundaries ad hoc. |
| `remove.png` | Red minus | Remove/detach | Remove member/item/tag from a collection where deletion is not intended | ACTION | Distinguish from `delete.png`; confirmation where the operation is consequential. |
| `rewards.png` | Gold crown | Rewards/recognition overview | Progress rewards/recognition summary | CORE | Overview/destination icon; actual earned trophy/badge/star states use their specific icons. |
| `salvation.png` | Wooden cross | Salvation/Gospel topic | Existing authored study/lesson content specifically about salvation/Gospel | CONTENT | Editorial faith-content icon only. Do not use as generic app branding on every surface. |
| `search.png` | Magnifying glass | Search | Reader search and Media Library/searchable-list controls (#22, #61) | ACTION | One semantic: search. Keep accessible label and existing search owner. |
| `serve.png` | Heart held in hands | Ministry/service | Ministry Hub service/tool entry and service-oriented Couples/Family content (#62, #76) | CORE | Preferred ministry/service icon; `church.png` remains congregation identity. |
| `settings.png` | Gear | Settings/preferences | Existing settings/preferences and configuration entry | CORE | Do not use for admin-only operations unless it is the ordinary settings owner. |
| `share.png` | Share-node symbol | Share | Existing passage/assignment/community share action | ACTION | Only where a real share workflow exists; do not invent external sharing. |
| `sound.png` | Speaker with sound waves | Audio on/volume | Audio/recording player sound/unmute control (#57–60) | STATE | Pair with `mute.png`; must reflect actual audio state. |
| `spirit.png` | Flame | Spirit/spiritual-growth topic | Existing study/Transform/Daily Journey content explicitly about Spirit/spiritual growth | CONTENT | Editorial only; never use as a score of spirituality or spiritual status. |
| `star.png` | Gold star | Star reward | Kids Memory Match star reward and other real star-award states (#38) | STATE | Kids Memory specifically may show earned stars; do not convert XP/coins into stars visually. |
| `stop.png` | Red stop button | Stop playback/session | Audio/recordings player stop action (#57–60) | ACTION | Use only where a distinct stop action exists; otherwise pause may be sufficient. |
| `study.png` | Open glowing Bible | Study | Study main navigation/card; guided study/adaptive-learning hub (#52–54) | CORE | Preferred primary Study icon. |
| `success.png` | Green check | Successful completion | Save/completion/success feedback and verified completion states | STATE | Must follow an actually successful operation; not decorative. |
| `timeline.png` | Hourglass | Timeline | Timeline game (#37) and timeline-specific history presentation | CORE | Canonical Timeline game icon. |
| `treasure.png` | Treasure chest | Earned treasure/unlock | Bible World/reward reveal after an actual unlock | STATE | Use for earned/revealed treasure only, not as a promise of unavailable rewards. |
| `unlock.png` | Open padlock | Unlocked/access granted | Bible World unlocked state, authorization/access-unlocked feedback | STATE | Reflect actual owner state and permissions. Do not imply entitlement. |
| `upload.png` | Purple upward arrow | Import/upload | Backup import, existing approved media/content upload controls (#100 and applicable ministry/admin workflows) | ACTION | Validate file/type through existing owner. Do not create a new uploader. |
| `verse.png` | Shield with cross | Verse detail / Verse Peek | Verse Peek and verse-context/details surfaces (#19–20) | CORE | Use as the verse-detail/context emblem; Reader itself remains `bible.png`. |
| `world.png` | Globe | Bible World | Bible World main destination/card (#44–45) | CORE | Canonical Bible World icon. Use `explore.png` for its explore CTA and `map.png` for nodes/locations. |

## Primary navigation recommendation

When the visual rebuild reaches the app shell, prefer this mapping **without changing the existing navigation structure**:

| Existing destination | Preferred PNG |
|---|---|
| Home | `home.png` |
| Reader | `bible.png` |
| Study | `study.png` |
| Games | `games.png` |
| Transform | `growth.png` |
| More / overflow destination | `more.png` |
| User profile/account | `profile.png` |

Only destinations that already exist in the current shell should receive shell icons. Do not add a tab merely because an icon exists.

## Major feature-card recommendation

| Feature family | Preferred PNG | Supporting PNGs |
|---|---|---|
| Calendar | `calendar.png` | `assignments.png` for assignment-specific due items |
| Daily Mission/Journey | `path.png` | `goals.png`, `pray.png`, topical `hope.png` / `peace.png` where content actually matches |
| Story Journey | `journey.png` | `next.png`, `previous.png` |
| Bible World | `world.png` | `explore.png`, `map.png`, `lock.png`, `unlock.png`, `treasure.png` |
| Assignments | `assignments.png` | `calendar.png`, `success.png`, `edit.png` |
| Notes | `notes.png` | `edit.png`, `delete.png`, `upload.png`/`download.png` only where the existing workflow supports them |
| Progress | `progress.png` | `achievements.png`, `badge.png`, `rewards.png`, `star.png`, `gift.png` |
| Ministry | `serve.png` | `church.png`, `friends.png`, `assignments.png` |
| Community / Journey Groups | `friends.png` | `church.png`, `add.png`, `remove.png` |
| Reader / verse tools | `bible.png` | `verse.png`, `search.png`, `previous.png`, `next.png` |
| Audio / recordings | `sound.png` | `play.png`, `pause.png`, `stop.png`, `mute.png` |
| Games | `games.png` | `quiz.png`, `puzzles.png`, `timeline.png`, `kids.png`, `challenge.png` |
| Account/recovery | `profile.png` | `key.png`, `lock.png`, `settings.png` |

## Explicit reserve list

The following assets are intentionally kept but must **not** trigger new functionality:

- `bookmark.png` — only after a real bookmark/save-passage capability exists.
- `favorites.png` — only after a real favorites/liked-content capability exists.
- `print.png` — only after an explicit print workflow exists.
- `gem.png` — only after a real matching collectible/tier is defined; never masquerade as coins.

Topical content icons (`faith.png`, `hope.png`, `peace.png`, `pray.png`, `salvation.png`, `spirit.png`) are also conditional: use them only when the existing content’s meaning genuinely matches. They are not new feature definitions.

## Rebuild sequence using this library

For each visual milestone:

1. Recover the exact current product SHA and the surface owner.
2. Identify the existing navigation/card/control that needs visual upgrading.
3. Look up the semantic role in this map.
4. Reuse the mapped PNG when it fits; do not regenerate an equivalent icon unnecessarily.
5. If the mapped asset is inadequate for readability/consistency, generate a replacement automatically, preserve the semantic role, update this guide, and keep the path/contract stable where practical.
6. Wire the asset through the existing component/feature owner; do not add a competing icon registry or duplicate UI owner without an architecture decision.
7. Verify at mobile widths and desktop: no clipping, overflow, label displacement, or reduced touch-target size.
8. Verify keyboard/focus/accessible-name behavior and meaningful state copy.
9. Run focused tests for the changed surface, then the required accumulated exact-SHA regression suite.
10. Record the exact verified product SHA. A docs-only/icon-map commit does not inherit product verification automatically.

## Asset-path contract

Use the source path pattern:

`assets/icons/v3/<filename>.png`

Future code should reference these paths consistently rather than copying the same bitmap into multiple feature folders. If a build pipeline later introduces optimized derivatives, keep this folder as the source library or update this document with the new canonical source path.

## Change-control note

This guide is a **visual planning contract**, not authorization to deploy all 70 icons at once. Future implementation should proceed by selected surface/milestone, preserve existing behavior, and verify each changed product checkpoint. The user has already authorized routine visual asset choice and implementation; no per-image approval prompt is required during an active visual milestone.
