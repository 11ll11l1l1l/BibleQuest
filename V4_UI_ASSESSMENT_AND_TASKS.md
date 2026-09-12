# BibleQuest V4 — UI Assessment & Task List

Owner: captain-level planning document. Records assessment findings, a new governing rule (3-tap reachability), concrete task items to execute in future tranches, an image-asset how-to for manual uploads, and workflow issues discovered along the way. This does not itself implement anything — it is the backlog that turns into the next several tranches.

Assessed against: `release/v4-games-avatar` (7 gates certified: Infra Safety Net, Foundation, Shell, Home, Learn, Reader, Games+Avatar Vault).

---

## 1. Assessment — functions, features, design, color, overall feel

**What's genuinely good today:**
- The service/architecture layer is clean and untouched — every certified visual tranche proved this by passing the full accumulated regression suite with zero functional regressions across 7 gates.
- Home and Learn now have real hierarchy (dominant continuation card + grouped categories) instead of flat stacked panels.
- A real design foundation exists: color tokens, type scale, spacing, focus, motion, non-color-only status badges, form controls.
- Reader and Games got genuine typography/token improvements without touching their (very fragile) markup.
- Avatar Vault already has real SVG art, its own purple collectible identity, and an "Equipped" state — better than expected going in.

**Where it's still weak — this is the honest part:**

1. **The color palette is one identity wearing different hats, not six distinct family personalities.** Every certified page uses the same forest-green + amber pairing (`--forest-900`, `--amber-600`, etc.). The master plan calls for families that "look meaningfully different through semantic styling" — right now they don't. Avatar Vault's purple accent is the *only* family-specific color anywhere in the app. This is the single biggest reason it can still read as "one generic theme" rather than six intentional experiences.
2. **More hub is the worst screen in the app and nothing has fixed it yet.** It is a flat, unbroken list of **15 full-width panel sections** (Workspace, Notifications, Community, Ministry Hub, Content Review, Couples, Couples Cloud, Journey Groups, Team Center, Accessibility, Install, Backup, My Mission, Calendar, Congregation), each with its own eyebrow/icon/heading/paragraph/button, plus a closing "still being rebuilt" panel. On a phone this is a very long scroll with no grouping, no priority order, and no way to tell at a glance what's personal vs. congregation vs. device-settings.
3. **Games still shows emoji, not art**, by deliberate, recorded deferral (🦊🕵️🧠🏆🌟🌱📘🗃️) — this is the most visible remaining "looks unfinished" surface in the whole app, especially since Avatar Vault right next to it already has real art.
4. **Several real image assets are sitting in `/assets/` completely unused**: `avatar-adventurer.webp`, `avatar-locked.webp`, `avatar-royal.webp`, `avatar-scholar.webp`, `avatar-shepherd.webp`. Avatar Vault currently renders styles from an SVG sprite (`avatar-vault-icons.svg`) instead. Either these webp files are leftover from an earlier direction, or they were meant to be wired in and never were — worth a decision either way rather than leaving dead weight in the repo (see Workflow Issue #2 below).
5. **Navigation depth has never been measured against a rule until now** — see Section 2.

---

## 2. New rule: 3-tap reachability, minimized scrolling, Congregation/Assignments on the main page

This is now a governing constraint alongside the existing Class A/B/C rules. It applies going forward and is retroactively graded against what's certified today.

**The rule, precisely:**
- Every feature must be reachable in **3 taps or fewer starting from Home** (Home itself doesn't count as a tap).
- Scrolling is **not banned**, but must be **minimized** — a screen that requires scrolling through 10+ equal-weight sections to find one thing is a violation of intent even if the tap-count is technically fine.
- **Congregation and Assignments must be reachable directly from Home** — not buried behind More → Ministry Hub → a tool card.

**Current reachability audit** (measured, not estimated — traced through the actual route map and page source):

| Feature | Path today | Taps | Passes rule? |
|---|---|---|---|
| Bible Reader | Home → Learn → Reader (now the dominant card) | 2 | ✅ |
| Games | Home → Play | 1 | ✅ |
| Avatar Vault | Home → Grow → Avatar Vault | 2 | ✅ |
| Calendar | Home → More → Calendar | 2 | ✅ (but buried in a 15-item scroll to find it) |
| **Congregation membership** | Home → More → *(scroll past 13 other sections)* → Congregation | 2 taps, but **fails the "no burying" intent** | ⚠️ |
| **Assignments (the actual feature)** | Home → More → Ministry Hub → *(tap the Assignments tool card)* | **3 taps**, and only if the member already has a readable congregation role | ⚠️ borderline — meets the literal tap count only when nothing goes wrong (signed out or no role adds a detour screen first) |
| Workspace / Notifications / Team Center / Journey Groups / Couples / Content Review / Backup / Accessibility / My Mission | Home → More → *(scroll)* → item | 2 taps, same burying problem as Congregation | ⚠️ |

**Verdict: the literal tap-count rule is mostly met by accident (More is only 1 tap away), but the *intent* — obvious, unburied access — is clearly violated for Congregation and Assignments, and the More hub's 15-item flat scroll is the root cause.**

---

## 3. Task list to fix reachability (execute as the next tranche(s))

These are scoped as Class A/B (presentation + navigation wiring using existing services — no new backend, no new data). Recommended as the very next gate, ahead of continuing further down the original family queue, since it's now the explicit priority.

**Task 3.1 — Add a "Congregation & Assignments" quick-access card to Home.**
- Home already has the pattern for this (the compact secondary-tile row added in the Home tranche). Add a 4th tile — or a distinct, slightly more prominent card given its importance — linking directly to Ministry Hub (or straight to Assignments if the member has an active role; fall back to Congregation join/access if not).
- Reuses the existing `onCongregation`/`onMinistryHub` route callbacks already wired in `bootstrap.js` — this is pure Class A wiring, no new service needed.
- Result: Congregation/Assignments become **1 tap from Home**, satisfying the rule with room to spare.

**Task 3.2 — Reorganize the More hub into grouped categories**, mirroring the exact pattern already proven and certified for the Learn hub tranche:
- **Ministry & Congregation**: Ministry Hub, Congregation, Team Center, Content Review
- **Personal Planning**: Calendar, My Mission
- **Together**: Couples & Family, Couples Cloud, Journey Groups
- **Workspace & Inbox**: Workspace, Notifications
- **Device & Settings**: Accessibility, Backup, Install
- Each group gets a labeled section header (like Learn's "STUDY & REFLECT" etc.) instead of one undifferentiated list. This alone turns "scroll past 13 things" into "scroll past 4-5 group headers and scan," which is the actual scrolling-minimization goal even without removing any content.
- This was already queued as "Step 7: More hub" in the original plan — this task elevates it to immediate priority given the new rule, rather than leaving it for later.

**Task 3.3 — Re-measure after 3.1/3.2 land** and update the reachability table above as part of that tranche's certification evidence, the same way every other tranche has documented its evidence in the captain index.

---

## 4. Task list to fix "generic styling" — give each family a real distinct identity

Right now only Avatar Vault deviates from the shared forest/amber palette. To make the 6 experience families actually feel different (per the master plan's own stated goal) without forking into six incompatible design systems:

**Task 4.1 — Define one accent color per family as a new set of foundation tokens**, layered on top of (not replacing) the shared base:
- Explore/Home/Journey: keep forest/amber (already the "home base" identity).
- Learn/Read/Study: a calmer, more editorial slate/indigo accent for headings and the Reader's dominant card, distinct from Home's warm tone.
- Play/Games/Avatar: lean into Avatar Vault's already-established purple, extend it into Games (currently still forest/amber, indistinguishable from Home).
- Grow/Reflect: a soft, muted teal or dusty-rose — calm and personal, distinct from both Home and Play.
- Community/Relational: warm coral/terracotta — people-first, distinct from ministry's formality.
- Ministry/Ops/Admin: stays deliberately restrained — keep it close to neutral ink/slate with minimal accent, by design (per the master plan's own "never treat like games" rule).
- Each new token gets added to `v4-foundation.css` as `--<family>-accent` variables, then referenced by each family's existing `-v4.css` override file. This is the same layering pattern already used successfully for Home, Learn, Reader, and Games.

**Task 4.2 — Replace Games' emoji with real SVG art**, now that Avatar Vault has proven the sprite-sheet pattern (`assets/avatar-vault-icons.svg` + `<use href="...#id">`). This was explicitly deferred during the Games CSS-only tranche specifically because it requires touching the same dense render function that owns every game hook — scope it as its own dedicated, carefully-tested tranche, not a quick add-on.

**Task 4.3 — Decide the fate of the 5 orphaned avatar `.webp` files** (see Workflow Issue #2 below) rather than leaving unused assets in the repo.

---

## 5. How to manually add images to the repo (step-by-step)

You're right that this needs to be manual — there's no build/bundler step in this app (no `package.json`, no webpack/Vite). Every file under `/assets/` is served exactly as committed, referenced by its exact path. Here's precisely how to add a new image yourself:

**Step 1 — Prepare the file.**
- **Icons, logos, simple illustrations →** use SVG. It's tiny, infinitely scalable, and themeable via CSS (`currentColor`). This is what the shell icons, calendar icons, and avatar-vault icons all use.
- **Photos, textured art, complex illustrations →** use WebP. It's what `tutorial-trainer-sprite.webp` and the Bible World artwork already use. Compress it first (e.g. with Squoosh.app or TinyPNG) — aim for well under 200KB per image, ideally under 80KB for anything that appears on Home or in the shell.
- Keep dimensions sensible for where it'll appear — e.g. a hero image doesn't need to be wider than ~1200px since it'll be scaled down on-screen anyway; a small icon-style image doesn't need to exceed ~256px.

**Step 2 — Name it consistently.**
- Lowercase, hyphen-separated, prefixed by feature where it makes sense: `bq-<feature>-<purpose>.webp` or `<feature>-feature-icons.svg` for icon sprites (matching `calendar-feature-icons.svg`, `mission-feature-icons.svg`, etc.).

**Step 3 — Put the file directly in `/assets/`** at the repo root (same folder as everything else — no subfolders currently used, keep it flat and consistent).

**Step 4 — Reference it from the right place**, depending on what kind of image it is:
- **As a background/decoration in CSS** (like the tutorial trainer sprite):
  ```css
  .my-element{background-image:url('../../assets/your-file.webp');background-size:cover;}
  ```
  (path is relative to the CSS file's own location in `src/ui/`, hence `../../assets/`)
- **As an inline `<img>` in a feature's JS** (like Home's hero):
  ```js
  `<img src="assets/your-file.webp" alt="">`
  ```
  (path here is relative to the site root, since the HTML is injected into the already-loaded page)
- **As an SVG icon via a sprite** (like calendar/avatar-vault icons):
  ```js
  `<svg viewBox="0 0 24 24"><use href="assets/your-sprite.svg#icon-id"></use></svg>`
  ```
  This requires the SVG file to contain `<symbol id="icon-id">...</symbol>` definitions — tell me if you want help building a sprite file from individual icon exports.

**Step 5 — No cache manifest to update.** The service worker (`sw.js`) is a simple network-first pass-through with no static file list, so a new asset just works the moment it's committed and deployed — nothing else to register.

**If you'd rather just hand me the image files directly** (upload them in chat), I can do steps 3–4 myself — placing them and wiring the reference is something I can do reliably. What I can't do is *generate* new artwork/photos from scratch in a way that gets pixel-perfect placement right without back-and-forth, which is presumably what you've been running into.

---

## 6. Workflow issues found (with full instructions on what to do about each)

**Workflow Issue #1 — More hub complexity was already known but not yet prioritized.**
The original plan queued "More hub" reorganization as Step 7, after Games+Avatar Vault. Given today's new 3-tap/no-burying rule, it should move to the very next gate instead of waiting its turn. *Instruction: when picking the next tranche, do Task 3.1 + 3.2 above before returning to the original Step 8 (Ministry/Assignments/Workspace/Notifications family) — they overlap heavily anyway since Ministry Hub and Workspace are both More-hub entries.*

**Workflow Issue #2 — Five image assets exist in the repo but are never referenced by any code.**
`assets/avatar-adventurer.webp`, `avatar-locked.webp`, `avatar-royal.webp`, `avatar-scholar.webp`, `avatar-shepherd.webp` are committed but unused (confirmed by searching every `.js`/`.css`/`.html` file in the repo). *Instruction: either (a) wire them into Avatar Vault as the real per-style art — replacing the current SVG-sprite icons — which would need each webp mapped to one of the 15 avatar style IDs and the `avatarArt()` function in `src/features/avatar-vault/index.js` updated to reference `assets/avatar-<id>.webp` instead of the sprite `<use>` call, or (b) if they're superseded/no longer wanted, delete them to keep the repo clean. This needs a decision before the next Avatar Vault–touching tranche, not a silent default either way.*

**Workflow Issue #3 — Games' emoji-to-SVG conversion has been deferred twice now without a concrete tranche scheduled.**
It was noted during the original A-report phase and deferred again during the Games+Avatar Vault CSS-only gate. *Instruction: schedule it explicitly as its own tranche (Task 4.2 above) rather than letting it default-defer a third time — recommend right after the More hub fix, since by then Games will be the most visually "unfinished-looking" screen left in the app.*

**Workflow Issue #4 — No family besides Play (via Avatar Vault) has a distinct accent color, contradicting the master plan's own stated goal.**
*Instruction: Task 4.1 above defines the fix. This should happen alongside or immediately after the More hub/Games work, since adding family accent tokens to the foundation is a small, low-risk Class B change that every subsequent family tranche then automatically benefits from.*

---

## 7. Suggested next-tranche order (supersedes the plan's original Step 8 ordering)

1. **Home quick-access + More hub reorganization** (Tasks 3.1 + 3.2) — directly answers the reachability rule, highest priority.
2. **Family accent-color tokens** (Task 4.1) — small, foundational, unblocks every later tranche looking more distinct.
3. **Games emoji → SVG art** (Task 4.2) — biggest remaining "looks unfinished" surface.
4. **Avatar webp decision** (Task 4.3 / Workflow Issue #2) — quick decision + either wiring or cleanup.
5. Resume the original family queue: Ministry + Assignments + Workspace + Notifications (much of this overlaps with the More hub work in step 1, so it may shrink in scope by the time it's reached).
