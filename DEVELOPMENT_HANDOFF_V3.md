# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after reconciliation of post-release priorities and document authority.

## First instruction

Read `DEVELOPMENT_PRIORITY_V3.md` first. It is the current post-release task-selection authority.

The September 11 18:00 release is complete. `RELEASE_6PM_2026-09-11.md` and `RELEASE_AGENT_READONLY_2026-09-11.md` are historical release evidence and do not override current post-release development.

For new chat instances, use `CONTINUE_PROMPT_V3.md`.

## Authority and evidence rules

When documents disagree:

latest user instruction → `DEVELOPMENT_PRIORITY_V3.md` → this handoff / `DEVELOPMENT_STATUS_V3.md` → milestone contracts and exact-SHA evidence → `FEATURE_INVENTORY_V3.md` release-parity ledger → historical release/visual/agent records.

Repository refs and actual workflow evidence override stale prose. Never transfer PASS across changed product SHAs, and never treat a documentation-only HEAD as a verified product SHA.

## Production state — preserve

- Repository: `11ll11l1l1l/BibleQuest`.
- Production/runtime product baseline: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.
- Frozen rollback/reference: `release/v3-production-20260911-r3` at that product SHA.
- Current `main` is a documentation-ahead descendant of that runtime/product baseline; recover its live HEAD before writing.
- The 2026-09-11 production release objective is complete.
- Applicable historical release-parity scope remains 98/98 complete.
- #39 Hiragana Match and #40 Kids Bible Who Am I remain retired unless explicitly reopened.

Do not repoint production, apply migrations or change production data merely because later post-release development is green.

## Newest verified post-release development evidence

Recover live refs before acting, but the newest known exact-green post-release product checkpoint is:

- branch: `postrelease/v3-workspace-notes-schema-compat`;
- exact product SHA: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`;
- parent exact-green Assignment Private Responses product: `73d39ce6fe0f9db20db62e25fd497a8711f921b0`;
- verifier run: `34594577664`;
- verifier job: `103247250487`;
- conclusion: success.

The verifier checked out detached exact SHA `61ee54fac7d352312cef7ffd8010997fa8bc9e51` and passed exact-SHA/milestone-diff hygiene, the Cloudflare deployment gate, focused Workspace Cloud Notes schema compatibility checks, accumulated visual static contracts, accumulated architecture validators, accumulated edge/security/static regressions, accumulated browser/mobile regressions and release-critical coverage presence.

Later documentation commits on any branch are evidence only unless product files changed and the changed product SHA earned fresh verification.

## Important post-release milestones already reached

### Visual Phase A

The classified replacement-level visual tranche program through tranche 16 reached exact-green checkpoint `406c34dcdf904b7483bf4381be774a908738e60c`.

That program is now **Visual Phase A: first-pass presentation polish complete**. It is not the final visual-quality target. The user's newer requirement activates **Visual Phase B** for real polished icon artwork, background illustrations and coherent generated assets where the current product still looks minimal/placeholder.

### Assignment Private Responses

Exact-green product SHA: `73d39ce6fe0f9db20db62e25fd497a8711f921b0`.

Its migration `supabase/migrations/20260911131000_assignment_response_presence.sql` was not applied to production during development. Do not claim the feature production-live without a separate integration/migration/live-authorization step.

### Workspace / Cloud Notes schema compatibility

Exact-green product SHA: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`.

The milestone aligned Workspace Cloud Notes behavior with the deployed schema while preserving established API/backend ownership.

## Current Priority 1

Priority 1 has three active streams governed by `DEVELOPMENT_PRIORITY_V3.md`:

1. **Functional completion/correctness** for accepted/currently planned work.
2. **Visual Phase B** — real polished icons/backgrounds/illustrations; generated visual assets should be created, selected and implemented directly without asking the user for image approval.
3. **Calendar** — active Priority 1 implementation work; recover existing requirements or define `CALENDAR_V3.md`, then implement through existing architecture when dependencies permit.

Sequence these by dependency and risk. Calendar must not wait for every cosmetic item, and visual work must not be indefinitely postponed behind all functionality.

## Agent findings

Historical agent/triage findings remain evidence only until revalidated against the current exact product checkpoint. In particular, do not automatically stop current development because an old triage file labels a P0 against an older `main` SHA. Reproduce/revalidate high-severity findings on the current exact product line before treating them as current blockers.

## What the next development chat should do

1. Recover live `main`, `release/v3-production-20260911-r3`, newest `postrelease/v3-*` branches, verifier branches and recent workflow evidence.
2. Distinguish current repository/document HEADs from exact verified product SHAs.
3. Read `DEVELOPMENT_PRIORITY_V3.md` and this handoff/status before selecting work.
4. Revalidate any historical P0/P1 against the current exact product checkpoint before interrupting the roadmap.
5. Select the highest-value dependency-safe Priority 1 milestone.
6. Implement it on an isolated development branch with explicit owner boundaries and focused regression protection.
7. If a visual asset is needed, generate and implement it directly; do not create an approval stop for the image.
8. Run focused checks and exact-SHA accumulated verification appropriate to the changed product.
9. Preserve/update exact evidence and continue to the next Priority 1 task while safe executable work remains.
10. Keep production and production Supabase/data unchanged unless an explicit verified integration/release milestone requires change.

## Non-negotiable rules

- Rebuild-and-verify; one owner per responsibility.
- Never transfer PASS across changed product SHAs.
- Never claim an unexecuted test.
- Documentation-only commits are not product candidates.
- Preserve the frozen production rollback point.
- Do not introduce competing backend/Supabase/state owners.
- Do not revive retired Kids/Kana work without explicit scope change.
- A GitHub merge/promotion is not proof of Cloudflare propagation.
- Do not call the app bug-free.
