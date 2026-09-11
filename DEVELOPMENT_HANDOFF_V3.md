# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST for mandatory final visual + functional integration release.

## FIRST INSTRUCTION — FINAL RELEASE OVERRIDE

Before any new development work, read `FINAL_RELEASE_VISUAL_INTEGRATION_CONTROL_V3.md` and Issue #94. They override older wording that treated the visual program as post-release or that considered r3 the final official release.

The official final BibleQuest v3 release is **NOT complete** until the accepted visual/artwork program and required functionality are integrated into one exact candidate SHA, the complete accumulated verification cycle passes on that exact SHA, and both Cloudflare production hosts are confirmed to serve that verified state.

For investigator work, read the updated `RELEASE_AGENT_READONLY_2026-09-11.md` on this visual line. All five investigators remain read-only and are now tasked to produce actionable visual, responsive, functional, architecture/security and release-firewall evidence for the captain.

## Preserved rollback / functional baseline

- Repo: `11ll11l1l1l/BibleQuest`.
- Production functional r3 baseline: `main` / `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac` at the time this visual program began.
- Preserve r3 as rollback/reference. Do not destroy or repoint it while integrating the final visual release.
- Applicable functional release scope remains **98/98 complete**.
- Historical #39 Hiragana Match and #40 Kids Bible Who Am I remain retired from release scope unless explicitly reopened by the user.

r3 is a verified functional safety point, not the final official visual release acceptance.

## Exact-green visual product checkpoint

- Branch lineage: `postrelease/v3-visual-shell-tranche16`.
- Exact verified visual product SHA: `406c34dcdf904b7483bf4381be774a908738e60c`.
- Parent exact-green visual product: tranche 15 SHA `62cb86cd48bae683d0be37a2a729127156a0093a`.
- Verifier: `verify/v3-visual-shell-406c34d`.
- Workflow run `34585018541`, job `103217107423`: **success**.

The verifier checked out detached exact product SHA `406c34dcdf904b7483bf4381be774a908738e60c` and passed:

- exact-SHA and exact diff hygiene;
- Cloudflare deployment gate with JavaScript syntax and production-entry/runtime ownership guards;
- accumulated visual static contracts;
- 53 accumulated v3 architecture validators;
- 86 edge/security/static regressions;
- 68 Playwright browser/mobile regressions plus Kids Memory browser acceptance;
- dedicated desktop/mobile global-shell visual containment checks;
- strong-contrast checks.

Additional explicit 320/360/390/412/430 core-surface width acceptance later passed in workflow run `34591777463` without a reproduced visual/CSS blocker. That run is supporting evidence; final release must still re-run required verification on the exact integrated candidate SHA.

## Visual/artwork program status

The architecture-preserving visual program is implemented through tranche 16. Covered presentation families include:

- Home/hero;
- global shell;
- Games;
- Reader;
- Bible World;
- Progress/Daily Journey;
- PWA icons;
- Transform;
- Study/Deep Questions/Story/Wisdom;
- Account/Tutorial;
- Context/Japanese/source presentation;
- Notes;
- Couples;
- Community;
- Media/Recordings;
- Adaptive/Open Review;
- Accessibility-related presentation.

Read `VISUAL_REPLACEMENT_CONTRACT_V3.md`, `VISUAL_SURFACE_INVENTORY_V3.md` and `VISUAL_POLISH_PROGRESS_V3.md` before changing presentation work.

The desired visual identity is professional but clearly BibleQuest: Bible + quest/adventure + learning/game progression. Keep Games/Kids surfaces playful, while Reader/Study/Account/Ministry/privacy-sensitive surfaces remain calm, readable and trustworthy.

## Correct-development requirement — no patching around defects

The captain must not rush the final release by layering brittle fixes. Every accepted change must be made in the correct architectural owner and proven by regression evidence.

Do not use speculative global CSS overrides, duplicate DOM/feature implementations, wrong-owner JavaScript shims, hidden-control workarounds, catch-all error swallowing, test weakening, copied legacy parallel paths or undocumented backend assumptions merely to make a screen/test appear green.

For each change:

1. reproduce/establish the requirement;
2. identify the true owner and contract;
3. implement in that owner;
4. add/retain focused regression protection;
5. run focused checks;
6. if product SHA changed, run the required accumulated exact-SHA verification before promotion.

A small correct change is preferred to a broad refactor, but a quick workaround is not an acceptable substitute for correct development.

## Investigator structure

The five read-only agents are now separated as follows:

1. **Visual system / asset integrity** — surface matrix, missing/inconsistent art, assets, load order, provenance, performance risk, architecture preservation.
2. **Responsive / accessibility / browser / PWA** — required widths, overflow/clipping/touch/focus/contrast/reduced motion, console errors, PWA/offline evidence.
3. **Functional surface / UX integrity** — Home, Account, Reader, Games, Progress, Transform, Study, Community/Media/Notes/Couples/Ministry/Assignments/Notifications/Workspace where included, plus state transitions and return paths.
4. **Architecture / security / backend boundary** — compare r3, visual checkpoint and candidate; detect duplicate owners, auth/storage/API/Supabase/privacy/PWA ownership changes or hidden functional changes.
5. **Release firewall / captain action compiler** — deduplicate, reject speculation/hacks/test weakening, identify correct owner for each accepted item, order the captain work and define exact verification.

Agents do not write. Their report contract and engineering-quality filters are defined in `RELEASE_AGENT_READONLY_2026-09-11.md` and `FINAL_RELEASE_VISUAL_INTEGRATION_CONTROL_V3.md`.

## What the next captain must do

1. Recover current live refs and concurrent branches before writing; repository evidence overrides this handoff.
2. Preserve the frozen r3 rollback/reference.
3. Recover exact visual product SHA `406c34dcdf904b7483bf4381be774a908738e60c` separately from later documentation-only branch HEADs.
4. Read the final release control, Issue #94, visual contract/inventory/progress and all investigator reports.
5. Establish the intended final integration branch from the correct verified product lineage; do not merge unrelated experimental/post-release features.
6. Compile a surface-by-surface acceptance matrix covering both visuals and functionality.
7. Implement only accepted release gaps, in the correct architectural owner. Do not patch around root causes.
8. Run focused tests after each correction.
9. Freeze one exact final candidate SHA.
10. Run the complete final exact-SHA release gate: Cloudflare build/deploy gate, architecture/static, edge/security, browser/mobile, visual contracts/assets/fallbacks, accessibility/reduced motion, PWA/offline/cache behavior, core functional smoke, 320/360/390/412/430 widths and exact-SHA/diff hygiene.
11. If any product file changes after a PASS, create a new candidate and reverify. Never transfer PASS.
12. Promote only the exact green integrated state to production.
13. Verify both `mybiblequest.pages.dev` and `biblequest-7th.pages.dev`, including visual identity and core behavior.
14. Update status/handoff with the actual final product SHA and workflow evidence. Explicitly record any unexecuted physical-device acceptance.

## Non-negotiable evidence rules

- Rebuild-and-verify; one owner per responsibility.
- Never transfer PASS across changed product SHAs.
- Never claim an unexecuted test.
- Documentation-only commits are not product candidates.
- Preserve r3 as rollback/reference.
- A GitHub merge/promotion is not proof of Cloudflare propagation.
- Do not weaken tests to obtain green.
- Do not call the app bug-free.

## Success condition

The final official BibleQuest v3 release is complete only when one exact production SHA contains the accepted functionality and accepted visual program, passes the complete final verification cycle, and both Cloudflare hosts are confirmed to serve that verified state.