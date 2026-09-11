# BibleQuest v3 generic continue prompt

Use the following prompt verbatim or nearly verbatim in a new ChatGPT/Work chat. It is intentionally self-contained enough to recover the live repository state rather than trusting stale chat memory.

---

Continue development and release preparation of my BibleQuest v3 project from the exact current repository state.

Repository: `11ll11l1l1l/BibleQuest`

PRIMARY DEADLINE

A production BibleQuest v3 release must be available on the existing Cloudflare website by **18:00 JST on September 11, 2026**.

Before doing anything else:

1. Read `RELEASE_6PM_2026-09-11.md` from the current active v3 branch. It is the overriding priority until the release is live.
2. Read `DEVELOPMENT_HANDOFF_V3.md`.
3. Read `DEVELOPMENT_STATUS_V3.md`.
4. Read `FEATURE_INVENTORY_V3.md`.
5. Read `ARCHITECTURE_V3.md` as needed for ownership boundaries.
6. Recover live GitHub refs, exact SHAs, recent commits, and actual workflow evidence. Do not rely on stale chat text when repository evidence differs.

CURRENT BASELINE TO RECOVER/VERIFY

- Frozen verified baseline: `release/v3.71-japanese-furigana` at `c631bea8d5177a9a2ff68139cb104b6fbf26015b`.
- Exact v3.71 bookkeeping regression run: `34550650269`, previously successful across accumulated architecture, edge/security, and browser/mobile suites.
- Current release-control branch was created from that frozen baseline: `feature/v3-post-parity-closeout`.
- Recover its latest live HEAD before making changes; do not assume the SHA in this prompt is current.
- Historical #39 Hiragana Match and #40 Kids Bible Who Am I are user-retired from this v3 release. They are not blockers and must not be rebuilt now.
- Active release-scope parity is 98/98 applicable capabilities.
- Future Kids games are governed by `KIDS_GAMES_EXTENSION_V3.md`, but no new Kids/Kana games are allowed before today's release.

RELEASE PRIORITY

Stop normal feature development. Work only toward a verified Cloudflare production release by 18:00 JST.

No new features. No speculative refactors. No revival of retired parity rows. Artwork/theme polish is allowed only if it is low-risk replacement-level polish and cannot threaten the validation/deployment window. After 14:30 JST, discretionary polish stops; only release blockers may change product code.

REBUILD-AND-VERIFY RULES

- One source of truth per responsibility.
- Respect the existing v3 architecture and owners.
- Fix only reproduced defects.
- Every changed product SHA must earn its own verification; never transfer PASS from another SHA.
- After a release-affecting fix, run focused checks and then the complete accumulated regression suite before freezing.
- Do not claim tests that were not actually executed.
- Do not call the app bug-free.
- Keep normal product GitHub Actions manual-only. Temporary push-trigger verification workflows may exist only on isolated verifier branches and must never become production behavior.
- Do not mix unrelated legacy `main` work into the v3 release candidate.

CLOUDFLARE TARGET

The original production deployment uses Cloudflare Pages. The existing repository is connected to two Pages projects that deploy `main`:

- canonical: `https://mybiblequest.pages.dev/`
- compatibility: `https://biblequest-7th.pages.dev/`

The repository has a Cloudflare build gate through `build.sh` -> `scripts/deploy-gate.mjs`.

Production promotion is authorized once the exact release candidate is green. Do not ask me again for permission to promote the verified v3 release to `main`/Cloudflare. Preserve Supabase/data unless a verified release blocker requires a backend change.

EXECUTE, DO NOT JUST PLAN

In this chat instance, make concrete progress immediately. Inspect the live branch and continue the next unfinished release step. Do not stop after giving me a status report or plan when safe executable work remains.

Priority sequence:

1. Recover the live release-control HEAD and current evidence.
2. Audit Cloudflare/deployment compatibility and remaining P0/P1 blockers.
3. Apply only required release fixes or low-risk permitted polish while time allows.
4. Run the Cloudflare deployment gate and complete exact-SHA accumulated regression suite.
5. Freeze the exact green release candidate.
6. Update status/handoff evidence.
7. Promote the verified v3 product state to `main` when gates are green.
8. Confirm Cloudflare propagation and production behavior on `mybiblequest.pages.dev` and the compatibility host.
9. Keep a clear list of any task that specifically requires the user; otherwise perform it directly.

If another chat/agent is concurrently modifying the same release branch, do not create competing product changes. First inspect live HEAD and coordinate through the repository evidence. Prefer read-only investigation when ownership is unclear.

At the end of every response, state only factual current status: exact branch/SHA when known, what was actually completed, what gate is next, and any action the user personally must perform before 18:00 JST.

---
