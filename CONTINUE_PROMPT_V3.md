# BibleQuest v3 generic continue prompt

Use this prompt in a new **single release-execution chat**. There is no autonomous agent captain. The five BibleQuest agents are read-only investigators only.

---

Continue development and final release preparation of my BibleQuest v3 project from the exact current repository state.

Repository: `11ll11l1l1l/BibleQuest`

The final official BibleQuest v3 release must include BOTH the accepted complete functionality and the accepted architecture-preserving visual/artwork program. Production r3 is rollback/reference only until the required visual program is integrated and verified in the same final candidate.

Before doing anything else:

1. Read Issue #94 and its latest comments.
2. Read `FINAL_RELEASE_VISUAL_INTEGRATION_CONTROL_V3.md` from `postrelease/v3-visual-shell-tranche16`.
3. Read `RELEASE_AGENT_READONLY_2026-09-11.md` from the same branch. The five agents are investigators only; they do not write or deploy.
4. Read `DEVELOPMENT_HANDOFF_V3.md`, `DEVELOPMENT_STATUS_V3.md`, `VISUAL_REPLACEMENT_CONTRACT_V3.md`, `VISUAL_SURFACE_INVENTORY_V3.md`, `VISUAL_POLISH_PROGRESS_V3.md`, `FEATURE_INVENTORY_V3.md` and `ARCHITECTURE_V3.md` as needed.
5. Recover live refs, exact SHAs, recent commits, concurrent branches and exact workflow evidence. Repository evidence overrides stale chat text.

Preserve/recover:

- functional rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`;
- exact-green visual product checkpoint: `406c34dcdf904b7483bf4381be774a908738e60c` on `postrelease/v3-visual-shell-tranche16`;
- tranche-16 exact-green verifier run `34585018541`, job `103217107423`;
- explicit 320/360/390/412/430 width evidence run `34591777463`;
- retired #39 Hiragana Match and #40 Kids Bible Who Am I remain retired unless explicitly reopened.

Five read-only investigators provide evidence:

1. A1 Visual System / Asset Integrity.
2. A2 Responsive / Accessibility / Browser / PWA.
3. A3 Architecture / Security / Backend Boundary.
4. A4 Functional UX Integrity.
5. A5 Release Firewall / Action Compiler.

Use their current automation outputs as advisory evidence, but independently verify accepted blockers against primary repository/workflow evidence before writing.

DEVELOP CORRECTLY — DO NOT PATCH.

Do not solve release gaps with speculative global CSS, uncontrolled `!important`, duplicate DOM/components/feature owners, wrong-owner JavaScript shims, copied legacy implementations, hidden-control workarounds, catch-all error swallowing, auth/RLS/storage bypasses, test weakening/skipping, or validator changes whose only purpose is to get green.

For every accepted gap: reproduce/establish the requirement, identify the true architectural owner, make the durable correction there, add/retain focused regression protection, run focused checks, then run the complete accumulated exact-SHA release verification.

Required execution sequence:

1. Recover live refs/concurrent work.
2. Preserve r3 rollback/reference.
3. Recover exact-green visual product separately from docs-only HEADs.
4. Gather A1-A5 investigation outputs and build one visual + functional acceptance matrix.
5. Establish one final integration branch from the correct verified product lineage; do not merge unrelated roadmap work.
6. Implement only evidence-backed required release gaps in the correct owners.
7. Run focused checks after each change.
8. Freeze one exact candidate SHA.
9. Run the complete exact-SHA final cycle: Cloudflare deployment gate, architecture/static validators, edge/security, browser/mobile, visual contracts/assets/fallbacks, accessibility/reduced motion, PWA/offline/update/cache, functional smoke, 320/360/390/412/430 widths, console/page error checks and exact-SHA/diff hygiene.
10. If product SHA changes after PASS, reverify; never transfer PASS.
11. Promote only the exact green integrated candidate.
12. Verify both `https://mybiblequest.pages.dev/` and `https://biblequest-7th.pages.dev/` visually and functionally against that exact candidate.
13. Update durable handoff/status with final SHA/evidence and any unexecuted physical-device acceptance.

Do not ask me to approve routine fixes or promotion once the exact final candidate is green. Do not change production Supabase/data unless a reproduced requirement specifically needs a correctly designed migration with verification and rollback.

If another writer chat is modifying the same integration branch, do not create competing writes. Inspect live HEAD first and coordinate through repository evidence. The five agents are read-only specifically to avoid concurrency conflicts.

At the end of every response, state factual current status: exact branch/SHA when known, what was actually completed, the next release gate and any action I personally must perform.

---
