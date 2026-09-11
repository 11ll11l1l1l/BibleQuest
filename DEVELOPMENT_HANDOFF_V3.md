# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after reconciliation of the Workspace schema milestone and current post-release priorities.

Read `DEVELOPMENT_PRIORITY_V3.md` first. It is the current task-selection authority. `RELEASE_6PM_2026-09-11.md` and the release-agent instructions are historical evidence from the completed production release.

## Production state — preserve

- Repository: `11ll11l1l1l/BibleQuest`.
- Production/runtime product baseline: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.
- Frozen rollback/reference: `release/v3-production-20260911-r3` at that product SHA.
- Current `main` may contain later documentation-only descendants; recover its live HEAD before writing.
- Historical release parity remains 98/98 applicable capabilities.
- #39 Hiragana Match and #40 Kids Bible Who Am I remain retired unless explicitly reopened.

Do not modify production, apply migrations or change production data merely because a post-release branch is green.

## Current exact-green post-release product

- Development branch: `postrelease/v3-workspace-notes-schema-compat`.
- Exact verified product SHA: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`.
- Parent exact-green Assignment Private Responses product: `73d39ce6fe0f9db20db62e25fd497a8711f921b0`.
- Verifier run: `34594577664`.
- Job: `103247250487`.
- Conclusion: **success**.

The verifier checked out detached exact product SHA `61ee54fac7d352312cef7ffd8010997fa8bc9e51` and passed exact-SHA/milestone-diff hygiene, the Cloudflare deployment gate, the focused Workspace Cloud Notes deployed-schema compatibility gate, accumulated visual static contracts, accumulated architecture validators, accumulated edge/security/static regressions, accumulated browser/mobile regressions and release-critical coverage presence.

The live branch HEAD is now expected to be later than `61ee54f...` because reconciliation documentation was added after the product verification. Those later documentation commits do not change the verified product SHA.

## Prior verified checkpoints

- Visual Phase A / tranche-16 checkpoint: `406c34dcdf904b7483bf4381be774a908738e60c`.
- Assignment Private Responses checkpoint: `73d39ce6fe0f9db20db62e25fd497a8711f921b0`.
- Workspace schema compatibility checkpoint: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`.

The old visual tranche program is now classified as **Visual Phase A: first-pass presentation polish complete**, not final visual completion.

## Assignment Private Responses production boundary

Migration `supabase/migrations/20260911131000_assignment_response_presence.sql` was not applied to production during development. Do not claim the feature production-live without a separately selected production integration/migration/live-authorization step.

## Current Priority 1

Priority 1 has three active streams:

1. functional completion/correctness for accepted/currently planned work;
2. Visual Phase B with real polished icons, backgrounds and illustrations where the UI remains minimal/placeholder;
3. Calendar implementation when dependencies permit.

Calendar is not deferred behind completion of every cosmetic task. Visual work is not deferred behind all functionality. Sequence by dependency and risk.

If a visual milestone needs generated artwork, generate it, choose the best result, implement it directly and test it. Do not stop to request image approval.

## Agent findings

Historical agent/triage findings are evidence only until revalidated against the current exact product checkpoint. Do not treat an old P0/P1 against an older `main` SHA as a current blocker without fresh evidence.

## Next development steps

1. Recover live refs and newer exact-SHA evidence before writing.
2. Preserve `61ee54f...` as the current exact-green product checkpoint unless newer verified product evidence exists.
3. Read `DEVELOPMENT_PRIORITY_V3.md` and select the highest-value dependency-safe Priority 1 milestone.
4. Revalidate credible historical P0/P1 before interrupting the roadmap.
5. Use an isolated branch and explicit owner/acceptance contract for the selected milestone.
6. Run focused checks and exact-SHA accumulated verification.
7. Update evidence and continue to the next Priority 1 task while safe executable work remains.
8. Keep production and production Supabase/data unchanged until an explicit verified integration/release milestone requires change.

## Non-negotiable evidence rules

- Rebuild-and-verify; one owner per responsibility.
- Never transfer PASS across changed product SHAs.
- Never claim an unexecuted test.
- Documentation-only commits are not product candidates.
- Do not introduce competing API/Supabase/state owners.
- Preserve production rollback points.
- A GitHub promotion is not proof of Cloudflare propagation.
- Do not call the app bug-free.
