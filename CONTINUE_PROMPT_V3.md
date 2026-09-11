# BibleQuest v3 generic continue prompt

Use the following prompt verbatim or nearly verbatim in a new ChatGPT/Work chat. It is intentionally self-contained enough to recover the live repository state rather than trusting stale chat memory.

---

Continue development of my BibleQuest v3 project from the exact current repository state.

Repository: `11ll11l1l1l/BibleQuest`

Before doing anything else:

1. Read `DEVELOPMENT_PRIORITY_V3.md`. It is the current post-release priority order and must control task selection.
2. Read `DEVELOPMENT_HANDOFF_V3.md`.
3. Read `DEVELOPMENT_STATUS_V3.md`.
4. Read `FEATURE_INVENTORY_V3.md`.
5. Read `ARCHITECTURE_V3.md` as needed for ownership and integration boundaries.
6. Read feature-specific contracts relevant to the task being executed.
7. Recover live GitHub refs, exact SHAs, recent commits, open development branches/PRs, and actual workflow evidence. Repository evidence overrides stale chat text.

The historical `RELEASE_6PM_2026-09-11.md` is release evidence from the completed September 11 release. Do not let that expired deadline plan override the current post-release development priority once production is live.

CURRENT PRIORITY

Follow `DEVELOPMENT_PRIORITY_V3.md` exactly.

Priority 1 has two required parts and neither is optional:

- complete/correct all accepted and currently planned BibleQuest features that remain unfinished; and
- upgrade the visuals with **actual polished icon artwork and background illustrations**, not merely decorative button restyling or placeholder/minimal icons.

The visual upgrade must preserve the established v3 information architecture, navigation, feature ownership, and core flows unless a small adjustment is required to correctly host the artwork. New visual assets may be SVG/PNG/WebP or equivalent. A generated image is not complete until it is actually implemented in the product surface. If safe visual work requires generating new artwork, generate and implement it directly rather than stopping to ask for approval of the image.

Priority 2 is the **BibleQuest Calendar**. It is approved work. Recover any existing calendar requirements first; if none exist, define a concise `CALENDAR_V3.md` ownership/integration contract and then implement it using the existing architecture rather than creating duplicate global state.

Priority 3 is accumulated integration/regression hardening across architecture, edge/security/static behavior, browser/mobile, accessibility, and PWA/offline behavior.

Priority 4 is exact-SHA verification, evidence update, and safe production promotion.

REBUILD-AND-VERIFY RULES

- One source of truth per responsibility.
- Respect existing v3 owners and feature contracts.
- Fix root causes; do not weaken validators merely to obtain a green result.
- Every changed product SHA must earn its own verification; never transfer PASS from another SHA.
- After a product change, run focused checks and then the relevant accumulated regression suite before freezing or promotion.
- Do not claim tests that were not actually executed.
- Do not call the app bug-free.
- Preserve production Supabase/data unless a verified requirement specifically needs a backend change.
- Avoid broad architecture rewrites when targeted implementation can satisfy the objective.
- New artwork must be wired into the actual UI and verified there; do not count unattached generated images as implementation.

EXECUTE, DO NOT JUST PLAN

In this chat instance, make concrete progress immediately. Inspect the live repository and continue the highest-priority unfinished work from `DEVELOPMENT_PRIORITY_V3.md`. Do not stop after only giving a status report or plan when safe executable work remains.

Preferred execution sequence:

1. Recover live `main`, active development branches, exact SHA evidence, and the latest handoff/status.
2. Identify the highest-priority unfinished accepted feature or incomplete user-facing surface.
3. Complete/correct its functional behavior within the existing ownership boundaries.
4. Upgrade that surface with the required polished icon/background/art treatment where applicable.
5. Run focused tests for that surface and record actual evidence.
6. Continue Priority 1 surfaces until the accepted feature set and required visual upgrade are complete/stable.
7. Implement and integrate the Calendar under its explicit contract.
8. Run the relevant complete accumulated regression/mobile/PWA/accessibility suite on the exact candidate SHA.
9. Update `DEVELOPMENT_STATUS_V3.md` and `DEVELOPMENT_HANDOFF_V3.md` with exact evidence.
10. Promote only an exact verified candidate through the established production path.

If another writer chat is concurrently modifying the same branch, do not create competing changes. Recover live HEAD first and coordinate through repository evidence.

Do not ask me to re-approve routine implementation choices that are already authorized by these instructions. For visual work, do not stop just because an image was generated; implement the safe selected asset and verify it in the product.

At the end of every response, state factual current status: exact branch/SHA when known, what was actually completed, what verification ran, and the next highest-priority executable step.

---
